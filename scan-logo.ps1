Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\oscar\.gemini\antigravity\scratch\invitta-2.0-beta\invitta-logo.png"
$bytes = [System.IO.File]::ReadAllBytes($srcPath)
$ms = New-Object System.IO.MemoryStream($bytes, 0, $bytes.Length)
$bmp = [System.Drawing.Bitmap]::FromStream($ms)

# Check middle horizontal slice Y=150..240 where text is located
$colDarkCount = @{}
for ($x = 0; $x -lt $bmp.Width; $x += 4) {
    $darkPix = 0
    for ($y = 80; $y -lt 280; $y += 2) {
        $p = $bmp.GetPixel($x, $y)
        $diff = [Math]::Abs(243 - $p.R) + [Math]::Abs(244 - $p.G) + [Math]::Abs(239 - $p.B)
        if ($diff -gt 60) { $darkPix++ }
    }
    if ($darkPix -gt 5) {
        $colDarkCount[$x] = $darkPix
    }
}

$activeCols = $colDarkCount.Keys | Sort-Object
$minCol = $activeCols[0]
$maxCol = $activeCols[$activeCols.Count - 1]

Write-Host "Logo X Range in middle slice: $minCol to $maxCol"

# Check vertical slice for X between minCol and maxCol
$minRow = 338; $maxRow = 0
for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = $minCol; $x -le $maxCol; $x += 2) {
        $p = $bmp.GetPixel($x, $y)
        $diff = [Math]::Abs(243 - $p.R) + [Math]::Abs(244 - $p.G) + [Math]::Abs(239 - $p.B)
        if ($diff -gt 60) {
            if ($y -lt $minRow) { $minRow = $y }
            if ($y -gt $maxRow) { $maxRow = $y }
        }
    }
}

Write-Host "Logo Y Range: $minRow to $maxRow"

$bmp.Dispose()
$ms.Dispose()
