const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { generateImageCache } = require('./generate-image-cache.cjs');

const root = path.resolve(__dirname, '..');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
};

function createServer(directory = root, imageVersions = {}) {
  return http.createServer((request, response) => {
    let pathname;
    let url;
    try {
      url = new URL(request.url, 'http://localhost');
      pathname = decodeURIComponent(url.pathname);
    } catch {
      response.writeHead(400).end('Solicitud inválida.');
      return;
    }

    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const file = path.resolve(directory, relative);
    const allowed = ['assets', 'imagens', 'css', 'js'].includes(relative.split('/')[0]) || relative === 'index.html';
    if (!allowed || !file.startsWith(directory + path.sep)) {
      response.writeHead(404).end('No encontramos esa página.');
      return;
    }

    fs.stat(file, (error, stat) => {
      if (error || !stat.isFile()) {
        response.writeHead(404).end('No encontramos esa página.');
        return;
      }
      const imageName = relative.startsWith('imagens/') ? relative.slice('imagens/'.length) : null;
      const version = imageVersions[imageName];
      const versioned = Boolean(version && url.searchParams.get('v') === version);
      const etag = version ? `"${version}"` : `W/"${stat.size.toString(16)}-${stat.mtimeMs.toString(16)}"`;
      const headers = {
        'Content-Type': types[path.extname(file)] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate',
        'ETag': etag,
        'Last-Modified': stat.mtime.toUTCString(),
      };
      const ifNoneMatch = request.headers['if-none-match'];
      const unchanged = ifNoneMatch
        ? ifNoneMatch.split(',').some(tag => tag.trim() === '*' || tag.trim().replace(/^W\//, '') === etag.replace(/^W\//, ''))
        : request.headers['if-modified-since'] &&
          Math.floor(stat.mtimeMs / 1000) * 1000 <= Date.parse(request.headers['if-modified-since']);
      if (unchanged && ['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(304, headers).end();
        return;
      }
      response.writeHead(200, { ...headers, 'Content-Length': stat.size });
      if (request.method === 'HEAD') response.end();
      else fs.createReadStream(file).pipe(response);
    });
  });
}

module.exports = { createServer };

if (require.main === module) {
  const host = process.env.HOST || '127.0.0.1';
  const port = Number(process.env.PORT || 3000);
  const server = createServer(root, generateImageCache(root));
  server.listen(port, host, () => {
    console.log(`Quiz listo en http://${host}:${port}`);
    console.log('Presioná Ctrl+C para cerrar el servidor.');
  });
  server.on('error', (error) => {
    console.error(`No se pudo iniciar el servidor: ${error.message}`);
    process.exitCode = 1;
  });
}
