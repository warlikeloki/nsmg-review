# PowerShell script: check-broken-links.ps1

$htmlFiles = Get-ChildItem -Recurse -Filter *.html
$missingLinks = @()

foreach ($file in $htmlFiles) {
    $lines = Get-Content $file.FullName
    foreach ($line in $lines) {
        if ($line -match '<a\s+[^>]*href="([^"#?]+)"') {
            $href = $matches[1]
            # Skip external links
            if ($href -match '^(http|mailto|tel):') { continue }
            $path = Join-Path $file.DirectoryName $href
            if (-not (Test-Path $path)) {
                $missingLinks += "$($file.FullName): $href"
            }
        }
    }
}

if ($missingLinks) {
    Write-Host "Broken internal links found:`n"
    $missingLinks | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "No broken internal links found."
}
