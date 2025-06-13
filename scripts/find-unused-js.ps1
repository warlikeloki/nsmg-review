# find-unused-js.ps1
$projectRoot = Resolve-Path "$PSScriptRoot\.."

# Exclude node_modules, scripts, cypress, and ranked-choice folders
$excludePattern = '\\node_modules\\|\\scripts\\|\\cypress\\|\\ranked-choice\\'

$jsFiles = Get-ChildItem -Path $projectRoot -Recurse -Filter *.js -File | Where-Object {
    $_.FullName -notmatch $excludePattern
} | Select-Object -ExpandProperty FullName

$textFiles = Get-ChildItem -Path $projectRoot -Recurse -Include *.html,*.js -File | Where-Object {
    $_.FullName -notmatch $excludePattern
} | Select-Object -ExpandProperty FullName

$unused = @()
foreach ($js in $jsFiles) {
    $jsName = Split-Path $js -Leaf
    $isUsed = $false
    foreach ($file in $textFiles) {
        if (Select-String -Path $file -Pattern $jsName -Quiet) {
            $isUsed = $true
            break
        }
    }
    if (-not $isUsed) { $unused += $js }
}
if ($unused.Count -gt 0) {
    Write-Host "Unused JS files:`n"
    $unused | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "All JS files are referenced in HTML or JS."
}
