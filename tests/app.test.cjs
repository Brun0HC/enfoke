const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const data = require('../js/quiz-data.js');

// Exercise the complete UI controller with a controllable clock and image loads.
function createQuiz({ pendingImages = [], reducedMotion = false, imageVersions } = {}) {
  let now = 0;
  let nextId = 0;
  const timers = new Map();
  const deferred = new Map();
  const elements = new Map();
  const documentHandlers = new Map();
  class Element {
    constructor() {
      this.children = [];
      this.handlers = {};
      this.attributes = {};
      this.dataset = {};
      this.style = {};
      this.firstElementChild = { style: {} };
      this.hidden = true;
    }
    addEventListener(name, callback) { this.handlers[name] = callback; }
    setAttribute(name, value) { this.attributes[name] = value; }
    removeAttribute(name) { delete this[name]; delete this.attributes[name]; }
    replaceChildren(...children) { this.children = children; }
    querySelectorAll() { return this.children; }
    focus() { document.activeElement = this; }
    click() { if (!this.disabled) return this.handlers.click?.(); }
  }
  const document = {
    hidden: false,
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new Element());
      return elements.get(id);
    },
    createElement() { return new Element(); },
    addEventListener(name, callback) { documentHandlers.set(name, callback); },
  };
  document.getElementById('quiz').dataset.screen = 'start';
  document.getElementById('start-screen').hidden = false;
  class MockImage {
    decode() {
      const name = decodeURIComponent(this.src.split('/').pop().split('?')[0]);
      if (!pendingImages.includes(name)) return Promise.resolve();
      return new Promise(resolve => deferred.set(name, resolve));
    }
  }
  class ClockDate extends Date { static now() { return now; } }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8'), {
    document,
    window: { MusicQuizData: data, MusicQuizImageVersions: imageVersions, matchMedia: () => ({ matches: reducedMotion }) },
    Image: MockImage,
    Date: ClockDate,
    setTimeout(callback, delay) {
      const id = ++nextId;
      timers.set(id, { callback, due: now + delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
  });
  const flush = () => new Promise(resolve => setImmediate(resolve));
  async function tick(milliseconds) {
    const target = now + milliseconds;
    while (true) {
      const entry = [...timers].filter(([, timer]) => timer.due <= target)
        .sort((a, b) => a[1].due - b[1].due)[0];
      if (!entry) break;
      const [id, timer] = entry;
      timers.delete(id);
      now = timer.due;
      timer.callback();
      await flush();
    }
    now = target;
    await flush();
  }
  const element = id => document.getElementById(id);
  async function start() { element('play-button').click(); await flush(); }
  async function answer(letter = 'A') {
    element('answers').children['ABCDE'.indexOf(letter)].click();
    await tick(reducedMotion ? 80 : 220);
  }
  async function finish(letter = 'A') {
    await start();
    let lastInteraction;
    for (let question = 0; question < 10; question++) {
      lastInteraction = now;
      await answer(letter);
    }
    await tick(2500);
    return lastInteraction;
  }
  return {
    element, tick, flush, start, answer, finish,
    phase: () => element('quiz').dataset.screen,
    now: () => now,
    release: async name => { deferred.get(name)?.(); await flush(); },
    dispatch: name => documentHandlers.get(name)?.(),
    jump: milliseconds => { now += milliseconds; },
    timerCount: () => timers.size,
    document,
  };
}

test('las imágenes dinámicas usan la versión del contenido cuando está disponible', async () => {
  const app = createQuiz({ imageVersions: { 'Pregunta 1.svg': '0123456789abcdef' } });
  await app.start();
  assert.equal(app.element('screen-art').src, 'imagens/Pregunta%201.svg?v=0123456789abcdef');
});

test('60 segundos sin interacción reinician una pregunta y limpian las respuestas', async () => {
  const app = createQuiz();
  await app.start();
  await app.answer('C');
  await app.tick(59_779);
  assert.equal(app.phase(), 'question');
  await app.tick(1);
  assert.equal(app.phase(), 'start');
  assert.equal(app.timerCount(), 0);
  await app.start();
  assert.equal(app.element('progress-label').textContent, '1 de 10');
  assert.ok(app.element('answers').children.every(button => button.attributes['aria-pressed'] === 'false'));
});

test('responder y usar el teclado renuevan el plazo global de inactividad', async () => {
  const app = createQuiz();
  await app.start();
  await app.tick(40_000);
  await app.answer('B');
  await app.tick(40_000);
  assert.equal(app.phase(), 'question');
  app.dispatch('keydown');
  await app.tick(59_999);
  assert.equal(app.phase(), 'question');
  await app.tick(1);
  assert.equal(app.phase(), 'start');
});

for (const [letter, result] of Object.entries(data.results)) {
  test(`${result.name} muestra su foto y su QR originales, y después la pantalla final`, async () => {
    const app = createQuiz();
    const lastInteraction = await app.finish(letter);
    assert.equal(app.phase(), 'result');
    assert.equal(app.element('screen-art').src, `imagens/${result.image}`);
    assert.equal(app.element('band-photo').src, `imagens/${result.photo}`);
    assert.equal(app.element('band-qr').src, `imagens/${result.qr}`);
    for (const file of [result.photo, result.qr]) {
      assert.ok(fs.existsSync(path.join(__dirname, '../imagens', file)));
    }
    await app.tick(4999);
    assert.equal(app.element('band-card').dataset.view, 'photo');
    await app.tick(1);
    assert.equal(app.element('band-card').dataset.view, 'qr');
    await app.tick(600 + 29_999);
    assert.equal(app.phase(), 'result');
    await app.tick(1);
    assert.equal(app.phase(), 'final');
    assert.equal(app.element('screen-art').src, 'imagens/final.svg');
    // Automatic photo/QR/final transitions must never renew the inactivity clock.
    await app.tick(lastInteraction + 60_000 - app.now() - 1);
    assert.equal(app.phase(), 'final');
    await app.tick(1);
    assert.equal(app.phase(), 'start');
    assert.equal(app.timerCount(), 0);
  });
}

test('un clic anticipa el QR y los clics repetidos no postergan la pantalla final', async () => {
  const app = createQuiz();
  await app.finish('B');
  await app.tick(1000);
  app.element('band-card').click();
  assert.equal(app.element('band-card').dataset.view, 'qr');
  await app.tick(600 + 10_000);
  app.element('band-card').click();
  await app.tick(19_999);
  assert.equal(app.phase(), 'result');
  await app.tick(1);
  assert.equal(app.phase(), 'final');
});

test('la preferencia de movimiento reducido elimina el fade y conserva los tiempos', async () => {
  const app = createQuiz({ reducedMotion: true });
  await app.finish();
  await app.tick(5000 + 29_999);
  assert.equal(app.phase(), 'result');
  await app.tick(1);
  assert.equal(app.phase(), 'final');
});

test('una imagen tardía no reabre el quiz después de vencer el plazo durante el inicio', async () => {
  const app = createQuiz({ pendingImages: ['Pregunta 1.svg'] });
  await app.start();
  await app.tick(60_000);
  assert.equal(app.phase(), 'start');
  await app.release('Pregunta 1.svg');
  assert.equal(app.phase(), 'start');
  await app.start();
  assert.equal(app.phase(), 'question');
});

test('una pregunta pendiente no reaparece después del reinicio por inactividad', async () => {
  const app = createQuiz({ pendingImages: ['Pregunta 2.svg'] });
  await app.start();
  await app.answer();
  await app.tick(60_000);
  assert.equal(app.phase(), 'start');
  await app.release('Pregunta 2.svg');
  assert.equal(app.phase(), 'start');
  await app.start();
  assert.equal(app.element('progress-label').textContent, '1 de 10');
});

test('el plazo global también cancela una carga de resultado pendiente', async () => {
  const app = createQuiz({ pendingImages: ['groovin_bohemia_qrcode.svg'] });
  await app.finish();
  assert.equal(app.phase(), 'loading');
  await app.tick(60_000);
  await app.release('groovin_bohemia_qrcode.svg');
  assert.equal(app.phase(), 'start');
  assert.equal(app.timerCount(), 0);
});

test('una pantalla final pendiente no reaparece después del reinicio', async () => {
  const app = createQuiz({ pendingImages: ['final.svg'] });
  await app.finish();
  await app.tick(5000 + 600 + 30_000);
  assert.equal(app.phase(), 'result');
  await app.tick(60_000);
  await app.release('final.svg');
  assert.equal(app.phase(), 'start');
});

test('volver a una pestaña con el plazo vencido vuelve al inicio inmediatamente', async () => {
  const app = createQuiz();
  await app.start();
  app.jump(60_001);
  app.dispatch('visibilitychange');
  assert.equal(app.phase(), 'start');
});
