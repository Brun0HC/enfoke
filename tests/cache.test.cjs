const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { generateImageCache } = require('../scripts/generate-image-cache.cjs');
const { createServer } = require('../scripts/serve.cjs');

function fixture(t) {
  const base = path.resolve(os.tmpdir());
  const root = fs.mkdtempSync(path.join(base, 'enfoke-cache-'));
  t.after(() => {
    if (path.dirname(root) !== base || !path.basename(root).startsWith('enfoke-cache-')) {
      throw new Error('Unexpected fixture cleanup path');
    }
    fs.rmSync(root, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(root, 'imagens'));
  fs.writeFileSync(path.join(root, 'imagens/Mi imagen.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  fs.writeFileSync(path.join(root, 'index.html'), '<link rel="preload" href="imagens/Mi%20imagen.svg" as="image"><img src="imagens/Mi%20imagen.svg">');
  return root;
}

test('la versión depende de la imagen; la generación es repetible y no modifica el SVG', t => {
  const root = fixture(t);
  const file = path.join(root, 'imagens/Mi imagen.svg');
  const original = fs.readFileSync(file);
  const versions = generateImageCache(root);
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const script = fs.readFileSync(path.join(root, 'js/image-versions.js'), 'utf8');
  assert.match(versions['Mi imagen.svg'], /^[a-f0-9]{16}$/);
  assert.equal(html.match(new RegExp(`v=${versions['Mi imagen.svg']}`, 'g')).length, 2);
  const context = { window: {} };
  vm.runInNewContext(script, context);
  assert.equal(context.window.MusicQuizImageVersions['Mi imagen.svg'], versions['Mi imagen.svg']);
  assert.deepEqual(fs.readFileSync(file), original);
  assert.deepEqual(generateImageCache(root), versions);
  assert.equal(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), html);
  fs.writeFileSync(file, '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>');
  const updated = generateImageCache(root);
  assert.notEqual(updated['Mi imagen.svg'], versions['Mi imagen.svg']);
  assert.ok(!fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes(versions['Mi imagen.svg']));
});

async function startServer(t) {
  const root = fixture(t);
  const versions = generateImageCache(root);
  const server = createServer(root, versions);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, version: versions['Mi imagen.svg'], root };
}

test('la imagen versionada tiene caché largo y conserva los bytes originales', async t => {
  const { base, version, root } = await startServer(t);
  const response = await fetch(`${base}/imagens/Mi%20imagen.svg?v=${version}`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  assert.equal(response.headers.get('etag'), `"${version}"`);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), fs.readFileSync(path.join(root, 'imagens/Mi imagen.svg')));
});

test('HTML, URLs sin versión y versiones incorrectas deben revalidarse', async t => {
  const { base } = await startServer(t);
  for (const url of ['/', '/js/image-versions.js', '/imagens/Mi%20imagen.svg', '/imagens/Mi%20imagen.svg?v=0000000000000000']) {
    const response = await fetch(base + url, { method: 'HEAD' });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=0, must-revalidate');
  }
});

test('ETag y Last-Modified permiten responder 304 sin reenviar la imagen', async t => {
  const { base } = await startServer(t);
  const url = `${base}/imagens/Mi%20imagen.svg`;
  const first = await fetch(url, { method: 'HEAD' });
  for (const headers of [
    { 'If-None-Match': first.headers.get('etag') },
    { 'If-None-Match': `W/${first.headers.get('etag')}` },
    { 'If-Modified-Since': first.headers.get('last-modified') },
  ]) {
    const response = await fetch(url, { headers });
    assert.equal(response.status, 304);
    assert.equal((await response.arrayBuffer()).byteLength, 0);
  }
  const changed = await fetch(url, {
    headers: { 'If-None-Match': '"another-version"', 'If-Modified-Since': first.headers.get('last-modified') },
  });
  assert.equal(changed.status, 200);
  await changed.arrayBuffer();
});
