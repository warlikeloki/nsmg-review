# PowerShell script: list-css-variables.ps1

$cssFiles = Get-ChildItem -Recurse -Filter *.css

Write-Host "`nVariables Defined:`n"
$cssFiles | ForEach-Object {
    $content = Get-Content $_.FullName
    foreach ($line in $content) {
        if ($line -match '--[a-zA-Z0-9\-]+:\s*[^;]+;') {
            Write-Host "$($_.FullName): $line"
        }
    }
}

Write-Host "`nVariables Used:`n"
$cssFiles | ForEach-Object {
    $content = Get-Content $_.FullName
    foreach ($line in $content) {
        if ($line -match 'var\(--[a-zA-Z0-9\-]+') {
            Write-Host "$($_.FullName): $line"
        }
    }
}
