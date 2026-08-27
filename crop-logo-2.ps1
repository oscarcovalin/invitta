Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\oscar\.gemini\antigravity\scratch\invitta-2.0-beta\invitta-logo-light.png"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $bmp.Width
$h = $bmp.Height

$minX = $w; $maxX = 0
$minY = $h; $maxY = 0

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -gt 120) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Real Text Bounds: X=$minX..$maxX (W=$($maxX - $minX + 1)), Y=$minY..$maxY (H=$($maxY - $minY + 1))"

$padX = 20
$padY = 16
$cropX = [Math]::Max(0, $minX - $padX)
$cropY = [Math]::Max(0, $minY - $padY)
$cropW = [Math]::Min($w - $cropX, ($maxX - $minX + 1) + $padX * 2)
$cropH = [Math]::Min($h - $cropY, ($maxY - $minY + 1) + $padY * 2)

$rect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)

$cropLight = $bmp.Clone($rect, $bmp.PixelFormat)
$cropLight.Save("C:\Users\oscar\.gemini\antigravity\scratch\invitta-2.0-beta\invitta-logo-light.png", [System.Drawing.Imaging.ImageFormat]::Png)
$cropLight.Dispose()
$bmp.Dispose()

$bmpDark = [System.Drawing.Bitmap]::FromFile("C:\Users\oscar\.gemini\antigravity\scratch\invitta-2.0-beta\invitta-logo-transparent.png")
$cropDark = $bmpDark.Clone($rect, $bmpDark.PixelFormat)
$cropDark.Save("C:\Users\oscar\.gemini\antigravity\scratch\invitta-2.0-beta\invitta-logo-transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)
$cropDark.Dispose()
$bmpDark.Dispose()

Write-Host "✅ Successfully cropped to: $cropW x $cropH"
