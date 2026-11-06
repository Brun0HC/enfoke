const { test } = require('node:test');
const assert = require('node:assert/strict');
const { questions, results, calculateResult } = require('../js/quiz-data.js');

test('el test tiene diez preguntas y cinco opciones en cada una', () => {
  assert.equal(questions.length, 10);
  questions.forEach(question => {
    assert.ok(question.title.length > 0);
    assert.equal(question.answers.length, 5);
    assert.equal(new Set(question.answers).size, 5);
  });
});

for (const [letter, result] of Object.entries(results)) {
  test(`la mayoría de ${letter} recomienda ${result.name}`, () => {
    const other = letter === 'A' ? 'B' : 'A';
    assert.equal(calculateResult([...Array(7).fill(letter), ...Array(3).fill(other)]), letter);
    assert.equal(calculateResult(Array(10).fill(letter)), letter);
  });
}

test('gana la opción más elegida aunque no supere la mitad de las respuestas', () => {
  assert.equal(calculateResult(['C', 'C', 'C', 'C', 'A', 'A', 'B', 'B', 'D', 'E']), 'C');
});

test('un empate de dos opciones puede devolver cualquiera de las dos', () => {
  const answers = [...Array(5).fill('A'), ...Array(5).fill('B')];
  assert.equal(calculateResult(answers, () => 0), 'A');
  assert.equal(calculateResult(answers, () => 0.999999), 'B');
});

test('el sorteo incluye solamente las opciones empatadas en primer lugar', () => {
  const answers = ['A', 'A', 'A', 'C', 'C', 'C', 'E', 'E', 'E', 'B'];
  assert.equal(calculateResult(answers, () => 0), 'A');
  assert.equal(calculateResult(answers, () => 0.5), 'C');
  assert.equal(calculateResult(answers, () => 0.999999), 'E');
});

test('un empate entre las cinco opciones permite los cinco resultados', () => {
  const answers = ['A', 'B', 'C', 'D', 'E', 'A', 'B', 'C', 'D', 'E'];
  Object.keys(results).forEach((letter, index) => {
    assert.equal(calculateResult(answers, () => (index + 0.5) / 5), letter);
  });
});

test('no se calcula un resultado si faltan respuestas o hay valores inválidos', () => {
  for (const answers of [[], Array(9).fill('A'), Array(11).fill('A'), [...Array(9).fill('A'), 'Z'], null]) {
    assert.throws(() => calculateResult(answers), /diez preguntas/);
  }
});
