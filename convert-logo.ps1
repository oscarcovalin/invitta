Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\oscar\.gemini\antigravity\scratch\invitta-2.0-beta\invitta-logo.png"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $bmp.Width
$h = $bmp.Height

# 1. Create transparent original version
$outOrig = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# 2. Create light version for dark headers (White "Inv", Rosy "itta", Gold Feather)
$outLight = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $p = $bmp.GetPixel($x, $y)
        
        # Color difference from pure cream background (243, 244, 239)
        $diffR = 243 - $p.R
        $diffG = 244 - $p.G
        $diffB = 239 - $p.B
        $dist = [Math]::Sqrt($diffR*$diffR + $diffG*$diffG + $diffB*$diffB)
        
        if ($dist -lt 18) {
            # Fully transparent background
            $outOrig.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            $outLight.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $alpha = [Math]::Min(255, [Math]::Max(0, [int](($dist - 14) / 38.0 * 255)))
            
            # Original colored transparent
            $outOrig.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
            
            # For dark mode version:
            # Check if it's the dark slate text "Inv"
            if ($p.R -lt 120 -and $p.G -lt 140 -and $p.B -lt 155) {
                # Map dark slate to elegant luminous off-white/ivory
                $outLight.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 245, 246, 248))
            } else {
                # Keep golden feather and rose-gold itta
                $outLight.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
            }
        }
    }
}

$outOrig.Save("C:\Users\oscar\.gemini\antigravity\scratch\invitta-2.0-beta\invitta-logo-transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)
$outLight.Save("C:\Users\oscar\.gemini\antigravity\scratch\invitta-2.0-beta\invitta-logo-light.png", [System.Drawing.Imaging.ImageFormat]::Png)

$bmp.Dispose()
$outOrig.Dispose()
$outLight.Dispose()

Write-Host "✅ Generated invitta-logo-transparent.png and invitta-logo-light.png successfully!"
