# list-external-assets.ps1
$projectRoot = Resolve-Path "$PSScriptRoot\.."
$htmlFiles = Get-ChildItem -Path $projectRoot -Recurse -Filter *.html

$assets = @()
foreach ($file in $htmlFiles) {
    $lines = Get-Content $file.FullName
    foreach ($line in $lines) {
        if ($line -match '<link\s+[^>]*href="(https?://[^"]+)"') {
            $assets += $matches[1]
        }
        if ($line -match '<script\s+[^>]*src="(https?://[^"]+)"') {
            $assets += $matches[1]
        }
    }
}
$assets = $assets | Sort-Object -Unique
Write-Host "External JS/CSS assets used in HTML:"
$assets | ForEach-Object { Write-Host $_ }
