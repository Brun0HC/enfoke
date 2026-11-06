# Encontrá tu groove

Quiz musical en español argentino, hecho con HTML, CSS y JavaScript puro, sin dependencias. Podés abrir **index.html** directamente en el navegador.

## Servidor local

Con Node.js 18 o posterior:

```sh
npm start
```

Abrí **http://localhost:3000**. En PowerShell, si la política de ejecución bloquea `npm`, usá `npm.cmd start` o `node scripts/serve.cjs`.

Para probar desde una tablet conectada a la misma red, iniciá el servidor con `HOST=0.0.0.0` y entrá a `http://IP-DE-TU-COMPUTADORA:3000`. En PowerShell:

```powershell
$env:HOST = '0.0.0.0'
npm.cmd start
```

## Cómo funciona

- El botón usa directamente `imagens/Boton play.svg` e inicia las diez preguntas en orden. Tocá una respuesta para avanzar.
- Las respuestas muestran solamente el texto y tienen esquinas de 30 px.
- Las diez preguntas usan directamente `imagens/Pregunta 1.svg` a `imagens/Pregunta 10.svg`, con sus textos originales y sin títulos HTML superpuestos.
- Los textos de la interfaz usan Poppins Semibold (600), se muestran en mayúsculas y las alternativas se alinean a la izquierda. La fuente está incluida en `assets/fonts/`, junto con su licencia.
- Los resultados muestran directamente los SVG originales `imagens/a.svg` a `imagens/e.svg`, intactos y sin textos ni botones superpuestos.
- Volver permite corregir una respuesta antes de terminar.
- Después de la décima pregunta aparece Calculando.svg con una animación durante 2,5 segundos. Si la imagen final todavía no cargó, espera hasta tenerla lista.
- Gana la opción que más veces elegiste, aunque no supere cinco votos. Si hay empate, se sortea entre las opciones con el puntaje más alto.
- Después de mostrar el resultado durante 60 segundos, el sitio vuelve automáticamente al inicio y borra las respuestas para el próximo test.
- No se guardan datos ni se requieren servicios externos.

| Opción interna | Resultado | Pantalla |
| --- | --- | --- |
| A | Groovin Bohemia | a.svg |
| B | Chokenbici | b.svg |
| C | Suave Lomito | c.svg |
| D | Cortito y Funky | d.svg |
| E | Latelonius | e.svg |

La presentación conserva el formato horizontal de las ilustraciones, con un máximo de **1024 × 640 px**, centrado también en computadoras. En pantallas pequeñas se adapta para que los textos sigan siendo legibles.

## Archivos

- `index.html`: estructura de las pantallas.
- `css/styles.css`: tamaño, botones, adaptación y animación.
- `js/quiz-data.js`: preguntas, resultados y cálculo por mayoría.
- `js/app.js`: navegación, selección y carga de las ilustraciones.
- `imagens/`: los SVG originales, conservados sin modificaciones. Las diez preguntas, las cinco respuestas y el botón PLAY se usan directamente desde esta carpeta.
- `assets/`: copias optimizadas del inicio y la carga. Solamente en el inicio se retiraron los textos trazados para mostrarlos como HTML con la fuente del sitio. Se conserva el logotipo de Enfoke.

Para regenerar las imágenes optimizadas en Windows:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/optimize-assets.ps1
```

## Verificación

```sh
npm test
```

Las pruebas verifican los cinco resultados, mayorías, empates y respuestas incompletas o inválidas. No hace falta ejecutar `npm install`.
