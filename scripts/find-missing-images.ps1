# find-missing-images.ps1
$projectRoot = Resolve-Path "$PSScriptRoot\.."
$htmlFiles = Get-ChildItem -Path $projectRoot -Recurse -Filter *.html

$imageRefs = @()
foreach ($file in $htmlFiles) {
    $lines = Get-Content $file.FullName
    foreach ($line in $lines) {
        if ($line -match '<img\s+[^>]*src="([^"]+)"') {
            $imgPath = $matches[1]
            if ($imgPath -notmatch '^https?://' -and $imgPath -notmatch '^data:') {
                $imageRefs += $imgPath
            }
        }
    }
}
$uniqueImages = $imageRefs | Sort-Object -Unique
$missing = @()
foreach ($img in $uniqueImages) {
    $fullPath = Join-Path $projectRoot $img
    if (-not (Test-Path $fullPath)) {
        $missing += $img
    }
}
if ($missing.Count -gt 0) {
    Write-Host "Missing images referenced in HTML:"
    $missing | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "No missing images referenced in HTML."
}
