Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\oscar\.gemini\antigravity\scratch\invitta-2.0-beta\invitta-logo.png"
$bytes = [System.IO.File]::ReadAllBytes($srcPath)
$ms = New-Object System.IO.MemoryStream($bytes, 0, $bytes.Length)
$bmp = [System.Drawing.Bitmap]::FromStream($ms)

# Exact logo bounds with comfortable padding
$minX = 320
$maxX = 730
$minY = 40
$maxY = 224

$cropW = $maxX - $minX + 1
$cropH = $maxY - $minY + 1

$outDark = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$outLight = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($cy = 0; $cy -lt $cropH; $cy++) {
    $sy = $minY + $cy
    for ($cx = 0; $cx -lt $cropW; $cx++) {
        $sx = $minX + $cx
        $p = $bmp.GetPixel($sx, $sy)
        
        # Color distance from the linen background (243, 244, 239)
        $diffR = 243.0 - $p.R
        $diffG = 244.0 - $p.G
        $diffB = 239.0 - $p.B
        $dist = [Math]::Sqrt($diffR*$diffR + $diffG*$diffG + $diffB*$diffB)
        
        if ($dist -lt 12.0) {
            # Pure transparency
            $outDark.SetPixel($cx, $cy, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            $outLight.SetPixel($cx, $cy, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            # Smooth antialiased alpha transition
            $alpha = [Math]::Min(255, [Math]::Max(0, [int](($dist - 8.0) / 28.0 * 255)))
            
            # Dark background version (Original charcoal "Inv" + Terracotta "itta" + Gold Feather)
            $outDark.SetPixel($cx, $cy, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
            
            # Light version for dark UI (Crisp ivory #F7F6EC "Inv" + Warm Rose #E0A899 "itta" + Luminous Gold #D4AF37 Feather)
            if ($p.R -lt 130 -and $p.G -lt 145 -and $p.B -lt 160) {
                # Map dark charcoal "Inv" to pristine ivory/cream
                $factor = (255 - $p.R) / 255.0
                $r = [int](245 + ($p.R - 50) * 0.1)
                $g = [int](246 + ($p.G - 60) * 0.1)
                $b = [int](248 + ($p.B - 70) * 0.1)
                $outLight.SetPixel($cx, $cy, [System.Drawing.Color]::FromArgb($alpha, [Math]::Min(255, $r), [Math]::Min(255, $g), [Math]::Min(255, $b)))
            } else {
                # Keep vibrant feather and warm terracotta/rose
                $outLight.SetPixel($cx, $cy, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
            }
        }
    }
}

$bmp.Dispose()
$ms.Dispose()

$outDark.Save("C:\Users\oscar\.gemini\antigravity\scratch\invitta-2.0-beta\invitta-logo-dark.png", [System.Drawing.Imaging.ImageFormat]::Png)
$outLight.Save("C:\Users\oscar\.gemini\antigravity\scratch\invitta-2.0-beta\invitta-logo-light.png", [System.Drawing.Imaging.ImageFormat]::Png)

$outDark.Dispose()
$outLight.Dispose()

Write-Host "✅ Created crystal-clear cropped logos! Dimensions: $cropW x $cropH"
