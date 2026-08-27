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
        if ($p.A -gt 15) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Bounding box: X=$minX..$maxX (W=$($maxX - $minX + 1)), Y=$minY..$maxY (H=$($maxY - $minY + 1))"

# Crop tight with small 12px padding
$pad = 12
$cropX = [Math]::Max(0, $minX - $pad)
$cropY = [Math]::Max(0, $minY - $pad)
$cropW = [Math]::Min($w - $cropX, ($maxX - $minX + 1) + $pad * 2)
$cropH = [Math]::Min($h - $cropY, ($maxY - $minY + 1) + $pad * 2)

$rect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)

# Crop Light
$cropLight = $bmp.Clone($rect, $bmp.PixelFormat)
$cropLight.Save("C:\Users\oscar\.gemini\antigravity\scratch\invitta-2.0-beta\invitta-logo-light-cropped.png", [System.Drawing.Imaging.ImageFormat]::Png)
$cropLight.Dispose()
$bmp.Dispose()

# Crop Transparent (Original dark "Inv")
$bmpDark = [System.Drawing.Bitmap]::FromFile("C:\Users\oscar\.gemini\antigravity\scratch\invitta-2.0-beta\invitta-logo-transparent.png")
$cropDark = $bmpDark.Clone($rect, $bmpDark.PixelFormat)
$cropDark.Save("C:\Users\oscar\.gemini\antigravity\scratch\invitta-2.0-beta\invitta-logo-transparent-cropped.png", [System.Drawing.Imaging.ImageFormat]::Png)
$cropDark.Dispose()
$bmpDark.Dispose()

Write-Host "✅ Created tightly cropped logos: invitta-logo-light-cropped.png ($cropW x $cropH) and invitta-logo-transparent-cropped.png!"
