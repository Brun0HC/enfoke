(function () {
  'use strict';

  const { questions, results, calculateResult } = window.MusicQuizData;
  const letters = Object.keys(results);
  const art = document.getElementById('screen-art');
  const screens = ['start', 'question', 'loading', 'result'];
  const answersContainer = document.getElementById('answers');
  const questionTitle = document.getElementById('question-title');
  const announcement = document.getElementById('announcement');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const images = new Map();
  let currentQuestion = 0;
  let answers = [];
  let busy = false;
  let phase = 'start';
  let run = 0;
  let resultReturnTimer = null;

  const imagePath = name => `${/^(?:[a-e]|Pregunta (?:[1-9]|10))\.svg$/.test(name) ? 'imagens' : 'assets'}/${encodeURIComponent(name)}`;
  const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

  function preload(name) {
    if (!images.has(name)) {
      const image = new Image();
      image.src = imagePath(name);
      images.set(name, image.decode().catch(() => {}));
    }
    return images.get(name);
  }

  function showScreen(name, artwork) {
    clearTimeout(resultReturnTimer);
    resultReturnTimer = null;
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
      button.textContent = answer;
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
    busy = true;
    answers[currentQuestion] = letter;
    answersContainer.querySelectorAll('button').forEach(button => {
      button.disabled = true;
      button.setAttribute('aria-pressed', String(button.dataset.answer === letter));
    });
    document.getElementById('back-button').disabled = true;
    await pause(reducedMotion.matches ? 80 : 220);
    if (currentQuestion < questions.length - 1) {
      currentQuestion += 1;
      await preload(`Pregunta ${currentQuestion + 1}.svg`);
      showQuestion();
    } else {
      await showResult();
    }
  }

  async function showResult() {
    const currentRun = run;
    const result = results[calculateResult(answers)];
    await preload('Calculando.svg');
    showScreen('loading', 'Calculando.svg');
    document.getElementById('loading-title').focus({ preventScroll: true });
    announcement.textContent = 'Estamos buscando tu groove. Bancá un toque…';
    // Wait for both the loading animation and the final image, without flashing.
    await Promise.all([pause(2500), preload(result.image)]);
    if (currentRun !== run) return;
    document.getElementById('result-title').textContent = `Tu música es ${result.name}`;
    showScreen('result', result.image);
    document.getElementById('result-title').focus({ preventScroll: true });
    announcement.textContent = `Tu música es ${result.name}.`;
    busy = false;
    resultReturnTimer = setTimeout(resetQuiz, 60_000);
  }

  document.getElementById('play-button').addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    await preload('Pregunta 1.svg');
    showQuestion();
  });

  document.getElementById('back-button').addEventListener('click', () => {
    if (busy || phase !== 'question') return;
    if (currentQuestion > 0) {
      currentQuestion -= 1;
      showQuestion();
    } else {
      showScreen('start', 'Pantalla inicio.svg');
      document.getElementById('play-button').focus({ preventScroll: true });
    }
  });

  function resetQuiz() {
    run += 1;
    answers = [];
    currentQuestion = 0;
    busy = false;
    announcement.textContent = '';
    showScreen('start', 'Pantalla inicio.svg');
    document.getElementById('play-button').focus({ preventScroll: true });
  }

  preload('Pregunta 1.svg');
})();
