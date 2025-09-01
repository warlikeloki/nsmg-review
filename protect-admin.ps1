# protect-admin.ps1
# NSM-82 — Protect /admin with auth include, rename .html->.php (excluding backups), update login links, and tighten admin/.htaccess.
# This version SKIPS any backup HTMLs named *.old.html.

[CmdletBinding()]
param([switch]$WhatIf)

$ProjectRoot = (Resolve-Path ".").Path
$AdminDir    = Join-Path $ProjectRoot 'admin'
if (-not (Test-Path $AdminDir)) { throw "No 'admin' folder at $AdminDir" }

# Pattern of backup HTMLs to skip
$BackupHtmlPattern = '*.old.html'

function Write-Do($msg) { if ($WhatIf) { Write-Host "[WhatIf] $msg" } else { Write-Host $msg } }

# 1) admin/.htaccess: DirectoryIndex + disable listings
$AdminHt = Join-Path $AdminDir '.htaccess'
if (-not (Test-Path $AdminHt)) {
  $content = "DirectoryIndex index.php index.html`r`nOptions -Indexes`r`n"
  if ($WhatIf) { Write-Do "Create $AdminHt with DirectoryIndex + -Indexes" }
  else { Set-Content -Path $AdminHt -Value $content -Encoding UTF8 }
} else {
  $raw = Get-Content $AdminHt -Raw
  if ($raw -notmatch '(?im)^\s*DirectoryIndex\b') {
    if ($WhatIf) { Write-Do "Append DirectoryIndex to $AdminHt" }
    else { Add-Content -Path $AdminHt -Value "`r`nDirectoryIndex index.php index.html" }
  }
  if ($raw -notmatch '(?im)^\s*Options\s+-Indexes\b') {
    if ($WhatIf) { Write-Do "Append Options -Indexes to $AdminHt" }
    else { Add-Content -Path $AdminHt -Value "`r`nOptions -Indexes" }
  }
}

# 2) Rename /admin/*.html -> .php (EXCLUDING backups like *.old.html)
$HtmlFiles = Get-ChildItem $AdminDir -Recurse -File -Filter *.html |
  Where-Object { $_.Name -notlike $BackupHtmlPattern }

foreach ($f in $HtmlFiles) {
  $new = [System.IO.Path]::ChangeExtension($f.FullName, '.php')
  if (Test-Path $new) { Write-Warning "Skip rename: $new already exists"; continue }
  if ($WhatIf) { Write-Do "Rename $($f.FullName) -> $new" }
  else { Rename-Item -LiteralPath $f.FullName -NewName $new }
}

# 3) Prepend auth include to /admin/*.php (except login.php, logout.php, _auth.php, and excluding admin/assets/)
$PhpFiles = Get-ChildItem $AdminDir -Recurse -File -Filter *.php |
  Where-Object { $_.Name -notin @('login.php','logout.php','_auth.php') -and $_.FullName -notmatch '\\assets\\' }

$RequireLine = "<?php require __DIR__ . '/_auth.php'; ?>" + [Environment]::NewLine
foreach ($f in $PhpFiles) {
  $text = Get-Content $f.FullName -Raw
  if ($text -match "(?s)require\s+__DIR__\s*\.\s*'/_auth\.php'") { continue } # already protected
  if ($WhatIf) { Write-Do "Prepend auth to $($f.FullName)" }
  else { Set-Content -Path $f.FullName -Value ($RequireLine + $text) -Encoding UTF8 }
}

# 4) Replace links to /admin/login.html -> /admin/login.php across site
#    Skip editing backup HTML files matching *.old.html
$SiteFiles = Get-ChildItem $ProjectRoot -Recurse -File -Include *.html,*.php |
  Where-Object {
    $_.FullName -notmatch '\\vendor\\' -and
    ( $_.Extension -eq '.php' -or ( $_.Extension -eq '.html' -and $_.Name -notlike $BackupHtmlPattern ) )
  }

foreach ($f in $SiteFiles) {
  $raw = Get-Content $f.FullName -Raw
  $new = $raw -replace '/admin/login\.html', '/admin/login.php'
  if ($new -ne $raw) {
    if ($WhatIf) { Write-Do "Update login link in $($f.FullName)" }
    else { Set-Content -Path $f.FullName -Value $new -Encoding UTF8 }
  }
}

# 5) Ensure .gitignore ignores the admin auth config
$GitIgnore = Join-Path $ProjectRoot '.gitignore'
$IgnoreLine = 'php/includes/admin_auth_config.php'
if (Test-Path $GitIgnore) {
  $gi = Get-Content $GitIgnore -Raw
  if ($gi -notmatch [regex]::Escape($IgnoreLine)) {
    if ($WhatIf) { Write-Do "Append $IgnoreLine to .gitignore" }
    else { Add-Content -Path $GitIgnore -Value "`r`n$IgnoreLine" }
  }
} else {
  if ($WhatIf) { Write-Do "Create .gitignore with $IgnoreLine" }
  else { Set-Content -Path $GitIgnore -Value "$IgnoreLine`r`n" -Encoding UTF8 }
}

Write-Host "Done."
