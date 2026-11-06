$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectDirectory = Split-Path -Parent $PSScriptRoot
$inputDirectory = Join-Path $projectDirectory 'imagens'
$outputDirectory = Join-Path $projectDirectory 'assets'
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

# The same 4096 px grain texture is embedded in all 17 original SVGs.
# Resize that texture only; keep the lettering and illustration paths intact.
$firstSvg = [IO.File]::ReadAllText((Join-Path $inputDirectory 'Pantalla inicio.svg'))
$texturePattern = 'data:image/png;base64,[A-Za-z0-9+/=]+'
$originalTexture = [regex]::Match($firstSvg, $texturePattern).Value
$bytes = [Convert]::FromBase64String($originalTexture.Split(',')[1])
$stream = [IO.MemoryStream]::new($bytes, 0, $bytes.Length)
$sourceImage = [Drawing.Image]::FromStream($stream)
$resizedImage = [Drawing.Bitmap]::new(512, 512)
$graphics = [Drawing.Graphics]::FromImage($resizedImage)
$graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.DrawImage($sourceImage, 0, 0, 512, 512)
$outputStream = [IO.MemoryStream]::new()
$resizedImage.Save($outputStream, [Drawing.Imaging.ImageFormat]::Png)
$optimizedTexture = 'data:image/png;base64,' + [Convert]::ToBase64String($outputStream.ToArray())

foreach ($file in Get-ChildItem -LiteralPath $inputDirectory -Filter '*.svg') {
    # Questions, result screens and PLAY are served directly from the originals.
    if ($file.Name -match '^(?:[a-e]|Pregunta (?:[1-9]|10))\.svg$' -or $file.Name -eq 'Boton play.svg') { continue }
    $svg = [IO.File]::ReadAllText($file.FullName)
    $svg = $svg.Replace($originalTexture, $optimizedTexture)
    $svg = $svg.Replace('width="4096" height="4096"', 'width="512" height="512"')
    $svg = $svg.Replace('scale(0.000244141)', 'scale(0.001953125)')
    [IO.File]::WriteAllText((Join-Path $outputDirectory $file.Name), $svg, [Text.UTF8Encoding]::new($false))
}

$outputStream.Dispose()
$graphics.Dispose()
$resizedImage.Dispose()
$sourceImage.Dispose()
$stream.Dispose()
& node (Join-Path $PSScriptRoot 'prepare-artwork.cjs')
if ($LASTEXITCODE -ne 0) { throw 'No se pudo preparar la tipografia de las pantallas.' }
Write-Output 'Listo: las pantallas de inicio y carga se guardaron en assets/.'
