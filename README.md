# Encontrá tu groove

Quiz musical en español argentino, hecho con HTML, CSS y JavaScript puro, sin dependencias. Podés abrir **index.html** directamente en el navegador.

## Servidor local

Con Node.js 18 o posterior:

```sh
npm start
```

Abrí **http://localhost:3000**. En PowerShell, si la política de ejecución bloquea `npm`, usá `npm.cmd start` o `node scripts/serve.cjs`.

Para probar desde otra computadora conectada a la misma red, iniciá el servidor con `HOST=0.0.0.0` y entrá a `http://IP-DE-TU-COMPUTADORA:3000`. En PowerShell:

```powershell
$env:HOST = '0.0.0.0'
npm.cmd start
```

## Cómo funciona

- El botón usa directamente `imagens/Boton play.svg` e inicia las diez preguntas en orden. Tocá una respuesta para avanzar.
- Las respuestas muestran solamente el texto y tienen esquinas de 30 px.
- Las diez preguntas usan directamente `imagens/Pregunta 1.svg` a `imagens/Pregunta 10.svg`, con sus textos originales y sin títulos HTML superpuestos.
- Las alternativas usan Poppins Semibold (600), tamaño **20 px** e interlineado **20 px**, con alineación izquierda. Se muestran en minúsculas con mayúscula inicial y después de los puntos. La fuente está incluida en `assets/fonts/`, junto con su licencia.
- Los resultados usan los SVG originales `imagens/a.svg` a `imagens/e.svg`, intactos. Dentro del cuadrado aparece la foto correspondiente a la banda, como una capa HTML.
- La foto permanece **5 segundos** y luego se desvanece para mostrar su QR. También podés hacer clic en la foto para anticipar el QR. El fade dura 600 ms y respeta la preferencia de movimiento reducido.
- Después de **30 segundos con el QR visible**, aparece `imagens/final.svg`. Los clics repetidos sobre el QR no postergan esa transición.
- Volver permite corregir una respuesta antes de terminar.
- Después de la décima pregunta aparece Calculando.svg con una animación durante 2,5 segundos y el texto «Banca un toke». Si las imágenes del resultado todavía no cargaron, espera hasta tenerlas listas.
- Gana la opción que más veces elegiste, aunque no supere cinco votos. Si hay empate, se sortea entre las opciones con el puntaje más alto.
- El plazo de **60 segundos sin interacción es global**: funciona en las preguntas, la carga, el resultado y la pantalla final. Un clic, una tecla o el desplazamiento lo renuevan; las transiciones automáticas no. Al vencer, vuelve al inicio, cancela las transiciones pendientes y borra las respuestas. Una carga tardía no reabre la partida anterior.
- Un aviso discreto dentro de la esquina superior derecha de la imagen del quiz muestra «Sin actividad, volvés al inicio en» y los segundos restantes. Acompaña el tamaño del quiz, incluso cuando quedan márgenes alrededor. Se resalta en los últimos diez segundos, se renueva con la interacción y se oculta al volver al inicio. Usa el mismo plazo global y no anuncia cada segundo a los lectores de pantalla.
- No se guardan datos ni se requieren servicios externos.

| Opción interna | Resultado | Pantalla |
| --- | --- | --- |
| A | Groovin Bohemia | a.svg |
| B | Chokenbici | b.svg |
| C | Suave Lomito | c.svg |
| D | Cortito y Funky | d.svg |
| E | Latelonius | e.svg |

Las fotos y los QR se toman de los pares `groovin_bohemia_pic/qrcode.svg`, `chokenbici_pic/qrcode.svg`, `suave_lomito_pic/qrcode.svg`, `coritoyfunky_pic/qrcode.svg` y `latelonius_pic/qrcode.svg` de `imagens/`. Se conserva la escritura de los nombres de archivo provistos.

La presentación está preparada para computadoras en formato **16:9**, usando las ilustraciones de inicio y preguntas de **1920 × 1080 px**. Se ajusta al ancho y al alto disponibles, sin el límite anterior de 1024 px ni barras de desplazamiento en escritorio. Las imágenes conservan sus proporciones y se muestran completas; las que tienen otra proporción quedan centradas. Los contenedores acompañan el tamaño de la pantalla; las alternativas mantienen fuente e interlineado de 20 px.

## Archivos

- `index.html`: estructura de las pantallas.
- `css/styles.css`: tamaño, botones, adaptación y animación.
- `js/quiz-data.js`: preguntas, resultados y cálculo por mayoría.
- `js/app.js`: navegación, selección y carga de las ilustraciones.
- `imagens/`: los SVG originales, conservados sin modificaciones. El inicio, las diez preguntas, las cinco respuestas y el botón PLAY se usan directamente desde esta carpeta.
- `assets/`: archivos generados y fuente local. Las imágenes del sitio se toman de los SVG originales de `imagens/`.

## Caché de imágenes y Vercel

Las imágenes usan una URL con una versión calculada a partir de su contenido, por ejemplo `imagens/a.svg?v=0123456789abcdef`. La URL se mantiene mientras la imagen no cambie. Así, fondos, fotos, QR y botón PLAY pueden reutilizarse desde el caché del navegador sin modificar ningún SVG.

- Las imágenes versionadas usan `Cache-Control: public, max-age=31536000, immutable`: pueden conservarse hasta un año, según el espacio y las políticas del navegador.
- HTML, CSS y JavaScript se revalidan para recibir los cambios del próximo despliegue. El archivo de versiones también se revalida.
- Cuando cambia una imagen, se genera otra versión y el navegador solicita la URL nueva. No hace falta pedirle a la gente que borre el caché.
- El servidor local también envía `ETag` y `Last-Modified`, y responde `304` sin transferir de nuevo el archivo si no cambió.
- El precargado de la próxima pregunta se conserva y usa exactamente las mismas URLs que las imágenes visibles.

`vercel.json` ya define **Framework: Other**, **Build Command: npm run build** y **Output Directory: .**. El build únicamente calcula versiones y actualiza sus referencias; no instala dependencias ni convierte imágenes. Hacé un nuevo deploy para aplicar estos encabezados en Vercel. Esta configuración reemplaza la publicación anterior sin build.

```sh
npm run build
```

El comando genera `js/image-versions.js` y actualiza las URLs de las imágenes iniciales de `index.html`. No edites esas versiones a mano. `npm start` también las actualiza al iniciar; después de cambiar imágenes durante el desarrollo, reiniciá el servidor. Abrir `index.html` como archivo sigue funcionando, pero el caché HTTP requiere servir el sitio por HTTP/HTTPS.

El caché mejora las visitas siguientes y la reutilización de imágenes. **No reduce el primer download**: los fondos originales siguen pesando aproximadamente 25 MB cada uno. Tampoco descarga anticipadamente los 463 MB de la carpeta completa ni agrega funcionamiento sin conexión.

Para regenerar las imágenes optimizadas en Windows:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/optimize-assets.ps1
```

## Verificación

```sh
npm test
```

Las pruebas verifican los cinco resultados, mayorías y empates, formato de las alternativas, inactividad global, secuencia foto/QR/final, clics anticipados y cargas que terminan después de un reinicio. También verifican las versiones por contenido, la conservación de los SVG, encabezados HTTP y respuestas `304`. Los tiempos se comprueban con un reloj controlado. No hace falta ejecutar `npm install`.
