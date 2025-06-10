# PowerShell script: find-unused-css.ps1
# Place this in your project root and run from PowerShell

$cssFiles = Get-ChildItem -Recurse -Filter *.css | Select-Object -ExpandProperty FullName
$htmlFiles = Get-ChildItem -Recurse -Filter *.html | Select-Object -ExpandProperty FullName

$unused = @()
foreach ($css in $cssFiles) {
    $cssName = Split-Path $css -Leaf
    $isUsed = $false
    foreach ($html in $htmlFiles) {
        if (Select-String -Path $html -Pattern $cssName -Quiet) {
            $isUsed = $true
            break
        }
    }
    if (-not $isUsed) { $unused += $css }
}
Write-Host "Unused CSS files:`n"
$unused | ForEach-Object { Write-Host $_ }
