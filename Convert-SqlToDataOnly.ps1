<# 
.SYNOPSIS
  Converts schema+data .sql into DATA-ONLY .sql by removing DROP/CREATE/ALTER blocks
  and (optionally) converting INSERT to INSERT IGNORE to avoid dup errors.

.PARAMS
  -Path: Folder containing .sql files
  -OutDir: Output folder for converted files (default: .\_dataonly)
  -UseInsertIgnore: Switch to change "INSERT INTO" → "INSERT IGNORE INTO"
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory=$false)][string]$Path = ".",
  [Parameter(Mandatory=$false)][string]$OutDir = ".\_dataonly",
  [switch]$UseInsertIgnore
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

Get-ChildItem -Path $Path -Filter *.sql -File | ForEach-Object {
  $inFile  = $_.FullName
  $sql     = Get-Content -LiteralPath $inFile -Raw

  # Remove /* ... */ multi-line comments and -- line comments
  $sql = [regex]::Replace($sql, '(?s)/\*.*?\*/', '')
  $sql = ($sql -split "`r?`n") | ForEach-Object { if ($_ -match '^\s*--') { '' } else { $_ } } | Out-String

  # Remove DROP TABLE, CREATE TABLE (multi-line), and ALTER TABLE statements
  $sql = [regex]::Replace($sql, '(?is)DROP\s+TABLE\s+IF\s+EXISTS\s+.*?;', '')
  $sql = [regex]::Replace($sql, '(?is)CREATE\s+TABLE\s+.*?\);', '')
  $sql = [regex]::Replace($sql, '(?is)ALTER\s+TABLE\s+.*?;', '')

  # Optionally change INSERT INTO → INSERT IGNORE INTO
  if ($UseInsertIgnore) {
    $sql = [regex]::Replace($sql, '(?i)\bINSERT\s+INTO\b', 'INSERT IGNORE INTO')
  }

  $sql = $sql.Trim()

  $base = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
  $out  = Join-Path $OutDir "$base.dataonly.sql"
  Set-Content -LiteralPath $out -Value $sql -Encoding UTF8 -NoNewline
  Write-Host "→ $out"
}

Write-Host "Done. Import files from: $OutDir"
