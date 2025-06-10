# find-missing-title.ps1
$projectRoot = Resolve-Path "$PSScriptRoot\.."
$htmlFiles = Get-ChildItem -Path $projectRoot -Recurse -Filter *.html

$missingTitle = @()
foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -notmatch '<title>.*</title>') {
        $missingTitle += $file.FullName
    }
}
if ($missingTitle.Count -gt 0) {
    Write-Host "HTML files missing <title> tag:"
    $missingTitle | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "All HTML files have <title> tags."
}
