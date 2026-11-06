const fs = require('node:fs');
const path = require('node:path');

const directory = path.resolve(__dirname, '..', 'assets');
for (const name of fs.readdirSync(directory).filter(name => name.endsWith('.svg'))) {
  const file = path.join(directory, name);
  let svg = fs.readFileSync(file, 'utf8');
  if (svg.includes('data-live-typography="true"') || name === 'Calculando.svg') continue;
  const isStart = name === 'Pantalla inicio.svg';
  if (!isStart) continue;

  // Only the start screen uses HTML typography. All questions and results use
  // their original SVGs, including the outlined text, without modification.
  let index = 0;
  svg = svg.replace(/<path\b[^>]*\/>/g, element => {
    const current = index++;
    if (current >= 8 && current <= 22) return '';
    return element;
  });
  svg = svg.replace('<svg ', '<svg data-live-typography="true" ');
  fs.writeFileSync(file, svg);
}
console.log('Listo: la tipografía de las pantallas se muestra como texto del sitio.');
