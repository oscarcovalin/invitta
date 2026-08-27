Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\oscar\.gemini\antigravity\scratch\invitta-2.0-beta\invitta-logo.png"
$bytes = [System.IO.File]::ReadAllBytes($srcPath)
$ms = New-Object System.IO.MemoryStream($bytes, 0, $bytes.Length)
$bmp = [System.Drawing.Bitmap]::FromStream($ms)

$w = $bmp.Width
$h = $bmp.Height

# Find bounding box where pixel is noticeably darker than background
$minX = $w; $maxX = 0
$minY = $h; $maxY = 0

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $p = $bmp.GetPixel($x, $y)
        # Background is around 243, 244, 239. Text/feather is darker or more saturated.
        $diff = [Math]::Abs(243 - $p.R) + [Math]::Abs(244 - $p.G) + [Math]::Abs(239 - $p.B)
        if ($diff -gt 35) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Exact Logo Content Bounds: X=$minX..$maxX (W=$($maxX - $minX + 1)), Y=$minY..$maxY (H=$($maxY - $minY + 1))"

$padX = 14
$padY = 12
$cropX = [Math]::Max(0, $minX - $padX)
$cropY = [Math]::Max(0, $minY - $padY)
$cropW = [Math]::Min($w - $cropX, ($maxX - $minX + 1) + $padX * 2)
$cropH = [Math]::Min($h - $cropY, ($maxY - $minY + 1) + $padY * 2)

# Create cropped bitmaps
$outLight = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$outDark = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($cy = 0; $cy -lt $cropH; $cy++) {
    $sy = $cropY + $cy
    for ($cx = 0; $cx -lt $cropW; $cx++) {
        $sx = $cropX + $cx
        $p = $bmp.GetPixel($sx, $sy)
        
        $diffR = 243 - $p.R
        $diffG = 244 - $p.G
        $diffB = 239 - $p.B
        $dist = [Math]::Sqrt($diffR*$diffR + $diffG*$diffG + $diffB*$diffB)
        
        if ($dist -lt 14) {
            $outDark.SetPixel($cx, $cy, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            $outLight.SetPixel($cx, $cy, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $alpha = [Math]::Min(255, [Math]::Max(0, [int](($dist - 10) / 30.0 * 255)))
            
            # Dark background version (original colors)
            $outDark.SetPixel($cx, $cy, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
            
            # Light mode version for dark themes (Crisp pure ivory/white "Inv" + brilliant rose-gold "itta" + gleaming gold feather)
            if ($p.R -lt 130 -and $p.G -lt 145 -and $p.B -lt 160) {
                $outLight.SetPixel($cx, $cy, [System.Drawing.Color]::FromArgb($alpha, 245, 246, 248))
            } else {
                $outLight.SetPixel($cx, $cy, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
            }
        }
    }
}

$bmp.Dispose()
$ms.Dispose()

$outLight.Save("C:\Users\oscar\.gemini\antigravity\scratch\invitta-2.0-beta\invitta-logo-light.png", [System.Drawing.Imaging.ImageFormat]::Png)
$outDark.Save("C:\Users\oscar\.gemini\antigravity\scratch\invitta-2.0-beta\invitta-logo-dark.png", [System.Drawing.Imaging.ImageFormat]::Png)

$outLight.Dispose()
$outDark.Dispose()

Write-Host "🎉 Perfect Transparent Logos Saved! Size: $cropW x $cropH"
