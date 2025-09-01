# replace-admin-index-links.ps1
# Replaces /admin/index.html -> /admin/index.php across .html and .php files,
# skipping any backups like *.old.html

[CmdletBinding()]
param([switch]$WhatIf)

$Root = (Resolve-Path ".").Path
$files = Get-ChildItem $Root -Recurse -File -Include *.html,*.php |
  Where-Object { $_.Name -notlike '*.old.html' }

foreach ($f in $files) {
  $raw = Get-Content $f.FullName -Raw
  $new = $raw -replace '/admin/index\.html', '/admin/index.php'
  if ($new -ne $raw) {
    if ($WhatIf) { Write-Host "[WhatIf] Update: $($f.FullName)" }
    else { Set-Content -Path $f.FullName -Value $new -Encoding UTF8 }
  }
}
Write-Host "Done."
