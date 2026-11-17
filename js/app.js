(function () {
  'use strict';

  const { questions, results, calculateResult, formatAnswer } = window.MusicQuizData;
  const letters = Object.keys(results);
  const art = document.getElementById('screen-art');
  const screens = ['start', 'question', 'loading', 'result', 'final'];
  const answersContainer = document.getElementById('answers');
  const questionTitle = document.getElementById('question-title');
  const announcement = document.getElementById('announcement');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const bandCard = document.getElementById('band-card');
  const bandPhoto = document.getElementById('band-photo');
  const bandQr = document.getElementById('band-qr');
  const images = new Map();
  let currentQuestion = 0;
  let answers = [];
  let busy = false;
  let phase = 'start';
  let run = 0;
  let inactivityTimer = null;
  let inactivityDeadline = 0;
  let photoTimer = null;
  let fadeTimer = null;
  let finalTimer = null;
  let activeResult = null;
  let qrVisible = false;

  const imagePath = name => `${name === 'Calculando.svg' ? 'assets' : 'imagens'}/${encodeURIComponent(name)}`;
  const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
  const isCurrent = (currentRun, expectedPhase) => currentRun === run && phase === expectedPhase;

  function clearResultTimers() {
    clearTimeout(photoTimer);
    clearTimeout(fadeTimer);
    clearTimeout(finalTimer);
    photoTimer = fadeTimer = finalTimer = null;
  }

  function armInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      if (Date.now() >= inactivityDeadline) resetQuiz();
      else armInactivityTimer();
    }, Math.max(0, inactivityDeadline - Date.now()));
  }

  function recordInteraction() {
    if (phase === 'start') return;
    inactivityDeadline = Date.now() + 60_000;
    armInactivityTimer();
  }

  function preload(name) {
    if (!images.has(name)) {
      const image = new Image();
      image.src = imagePath(name);
      images.set(name, image.decode().catch(() => {}));
    }
    return images.get(name);
  }

  function showScreen(name, artwork) {
    if (name !== 'result') clearResultTimers();
    phase = name;
    document.getElementById('quiz').dataset.screen = name;
    art.src = imagePath(artwork);
    screens.forEach(screen => { document.getElementById(`${screen}-screen`).hidden = screen !== name; });
  }

  function showQuestion() {
    const question = questions[currentQuestion];
    showScreen('question', `Pregunta ${currentQuestion + 1}.svg`);
    questionTitle.textContent = question.title;
    answersContainer.replaceChildren(...question.answers.map((answer, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'answer-button';
      button.textContent = formatAnswer(answer);
      button.dataset.answer = letters[index];
      button.setAttribute('aria-pressed', String(answers[currentQuestion] === letters[index]));
      button.addEventListener('click', () => chooseAnswer(letters[index]));
      return button;
    }));
    document.getElementById('progress-label').textContent = `${currentQuestion + 1} de ${questions.length}`;
    const progress = document.getElementById('progress');
    progress.setAttribute('aria-valuenow', String(currentQuestion));
    progress.firstElementChild.style.width = `${currentQuestion / questions.length * 100}%`;
    document.getElementById('back-button').disabled = false;
    document.getElementById('question-screen').scrollTop = 0;
    questionTitle.focus({ preventScroll: true });
    announcement.textContent = `Pregunta ${currentQuestion + 1} de ${questions.length}. ${question.title}`;
    busy = false;
    if (currentQuestion < questions.length - 1) preload(`Pregunta ${currentQuestion + 2}.svg`);
    else preload('Calculando.svg');
  }

  async function chooseAnswer(letter) {
    if (busy || phase !== 'question') return;
    const currentRun = run;
    recordInteraction();
    busy = true;
    answers[currentQuestion] = letter;
    answersContainer.querySelectorAll('button').forEach(button => {
      button.disabled = true;
      button.setAttribute('aria-pressed', String(button.dataset.answer === letter));
    });
    document.getElementById('back-button').disabled = true;
    await pause(reducedMotion.matches ? 80 : 220);
    if (!isCurrent(currentRun, 'question')) return;
    if (currentQuestion < questions.length - 1) {
      currentQuestion += 1;
      await preload(`Pregunta ${currentQuestion + 1}.svg`);
      if (!isCurrent(currentRun, 'question')) return;
      showQuestion();
    } else {
      await showResult();
    }
  }

  async function showResult() {
    const currentRun = run;
    const result = results[calculateResult(answers)];
    await preload('Calculando.svg');
    if (!isCurrent(currentRun, 'question')) return;
    showScreen('loading', 'Calculando.svg');
    document.getElementById('loading-title').focus({ preventScroll: true });
    announcement.textContent = 'Estamos buscando tu groove. Banca un toke';
    await Promise.all([pause(2500), preload(result.image), preload(result.photo), preload(result.qr)]);
    if (!isCurrent(currentRun, 'loading')) return;
    activeResult = result;
    qrVisible = false;
    bandPhoto.src = imagePath(result.photo);
    bandQr.src = imagePath(result.qr);
    bandCard.dataset.view = 'photo';
    bandCard.setAttribute('aria-pressed', 'false');
    bandCard.setAttribute('aria-label', `Ver el código QR de ${result.name}`);
    document.getElementById('result-title').textContent = `Tu música es ${result.name}`;
    showScreen('result', result.image);
    document.getElementById('result-title').focus({ preventScroll: true });
    announcement.textContent = `Tu música es ${result.name}.`;
    busy = false;
    photoTimer = setTimeout(showQrCode, 5000);
    preload('final.svg');
  }

  function showQrCode() {
    if (phase !== 'result' || !activeResult || qrVisible) return;
    const currentRun = run;
    clearTimeout(photoTimer);
    photoTimer = null;
    qrVisible = true;
    bandCard.dataset.view = 'qr';
    bandCard.setAttribute('aria-pressed', 'true');
    bandCard.setAttribute('aria-label', `Código QR de ${activeResult.name}`);
    announcement.textContent = `Escaneá el código QR de ${activeResult.name}.`;
    fadeTimer = setTimeout(() => {
      if (!isCurrent(currentRun, 'result')) return;
      finalTimer = setTimeout(showFinal, 30_000);
    }, reducedMotion.matches ? 0 : 600);
  }

  async function showFinal() {
    const currentRun = run;
    await preload('final.svg');
    if (!isCurrent(currentRun, 'result')) return;
    showScreen('final', 'final.svg');
    document.getElementById('final-title').focus({ preventScroll: true });
    announcement.textContent = 'Gracias por participar.';
  }

  bandCard.addEventListener('click', () => {
    if (phase !== 'result') return;
    recordInteraction();
    showQrCode();
  });

  document.getElementById('play-button').addEventListener('click', async () => {
    if (busy) return;
    const currentRun = run;
    busy = true;
    phase = 'starting';
    recordInteraction();
    await preload('Pregunta 1.svg');
    if (!isCurrent(currentRun, 'starting')) return;
    showQuestion();
  });

  document.getElementById('back-button').addEventListener('click', () => {
    if (busy || phase !== 'question') return;
    recordInteraction();
    if (currentQuestion > 0) {
      currentQuestion -= 1;
      showQuestion();
    } else {
      resetQuiz();
    }
  });

  function resetQuiz() {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
    inactivityDeadline = 0;
    clearResultTimers();
    run += 1;
    answers = [];
    currentQuestion = 0;
    busy = false;
    activeResult = null;
    qrVisible = false;
    bandCard.dataset.view = 'photo';
    bandCard.setAttribute('aria-pressed', 'false');
    bandPhoto.removeAttribute('src');
    bandQr.removeAttribute('src');
    answersContainer.replaceChildren();
    announcement.textContent = '';
    showScreen('start', 'Pantalla inicio.svg');
    document.getElementById('play-button').focus({ preventScroll: true });
  }

  document.addEventListener('pointerdown', recordInteraction, { passive: true });
  document.addEventListener('keydown', recordInteraction);
  document.addEventListener('wheel', recordInteraction, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || phase === 'start') return;
    if (Date.now() >= inactivityDeadline) resetQuiz();
    else armInactivityTimer();
  });

  preload('Pregunta 1.svg');
})();
