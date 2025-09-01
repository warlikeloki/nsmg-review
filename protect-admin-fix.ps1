# protect-admin-fix.ps1
# NSM-82 — Fix admin auth include across /admin/*.php using DOCUMENT_ROOT.
# - Replaces/removes any old "__DIR__ . '/_auth.php'" include
# - Ensures first line is: "<?php require $_SERVER['DOCUMENT_ROOT'] . '/admin/_auth.php'; ?>"
# - Skips admin/login.php, admin/logout.php, admin/_auth.php, and admin/assets/*
# - Writes UTF-8 without BOM
# - (Optional) Comments "Options -Indexes" in admin/.htaccess if host disallows it

[CmdletBinding()]
param([switch]$WhatIf)

$ProjectRoot = (Resolve-Path ".").Path
$AdminDir    = Join-Path $ProjectRoot 'admin'
if (-not (Test-Path $AdminDir)) { throw "No 'admin' folder at $AdminDir" }

function Write-Utf8NoBom {
  param([Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Content)
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $enc)
}

function Do-Write($msg){ if($WhatIf){Write-Host "[WhatIf] $msg"} else {Write-Host $msg} }

# The robust include we want at the very top of each protected file
$NewRequireLine = "<?php require `$_SERVER['DOCUMENT_ROOT'] . '/admin/_auth.php'; ?>" + [Environment]::NewLine

# Regex to remove any existing "<?php require __DIR__ . '/_auth.php'; ?>" line (tolerant to spaces/newlines)
# (We remove it entirely, then prepend the new robust include.)
$RemoveOldBlock = '(?im)^\s*<\?php\s*require\s*__DIR__\s*\.\s*''/_auth\.php''\s*;\s*\?>\s*\r?\n?'

# 1) Update every /admin/*.php except login/logout/_auth and anything under /admin/assets
$PhpFiles = Get-ChildItem $AdminDir -Recurse -File -Filter *.php |
  Where-Object {
    $_.Name -notin @('login.php','logout.php','_auth.php') -and
    $_.FullName -notmatch '\\assets\\'
  }

# Needle to detect if file already has the robust include
$Needle = '$_SERVER[''DOCUMENT_ROOT''] . ''/admin/_auth.php'''

foreach ($f in $PhpFiles) {
  $raw = Get-Content $f.FullName -Raw

  # If it already has the robust include anywhere, skip
  if ($raw.Contains($Needle)) { continue }

  # Remove old "__DIR__" include block if present
  $stripped = [System.Text.RegularExpressions.Regex]::Replace($raw, $RemoveOldBlock, '')

  # Prepend the robust include
  $updated = $NewRequireLine + $stripped

  if ($updated -ne $raw) {
    if ($WhatIf) {
      Do-Write "Fix include in $($f.FullName)"
    } else {
      Write-Utf8NoBom -Path $f.FullName -Content $updated
      Do-Write "Fixed: $($f.FullName)"
    }
  }
}

# 2) (Optional) Adjust admin/.htaccess if 'Options -Indexes' could cause 500 on host
$AdminHt = Join-Path $AdminDir '.htaccess'
if (Test-Path $AdminHt) {
  $ht = Get-Content $AdminHt -Raw
  if ($ht -match '(?im)^\s*Options\s+-Indexes\s*$') {
    $ht2 = [regex]::Replace($ht, '(?im)^\s*Options\s+-Indexes\s*$', '# Options -Indexes (commented by protect-admin-fix)')
    if ($ht2 -ne $ht) {
      if ($WhatIf) { Do-Write "Comment 'Options -Indexes' in $AdminHt" }
      else {
        Write-Utf8NoBom -Path $AdminHt -Content $ht2
        Do-Write "Adjusted: $AdminHt (commented Options -Indexes)"
      }
    }
  }
}

Write-Host "Done."
