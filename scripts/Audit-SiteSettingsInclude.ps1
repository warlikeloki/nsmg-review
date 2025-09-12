<#
NSM-155 — Site Settings include audit & fix
Audits *.html for:
  <script type="module" src="/js/modules/site-settings.js"></script>

Default: REPORT ONLY (no changes). Writes CSV: .\reports\audit-site-settings.csv
- Use -Fix  : insert the tag before </head> when missing
- Use -Dedup: remove duplicate tags, leaving a single instance
- Backs up each changed file as .bak-YYYYMMDDHHMMSS

USAGE (from repo root):
  pwsh -File .\scripts\Audit-SiteSettingsInclude.ps1 -Root .
  pwsh -File .\scripts\Audit-SiteSettingsInclude.ps1 -Root . -Fix
  pwsh -File .\scripts\Audit-SiteSettingsInclude.ps1 -Root . -Dedup
  pwsh -File .\scripts\Audit-SiteSettingsInclude.ps1 -Root . -Fix -Dedup
#>

[CmdletBinding()]
param(
  [Parameter(Position=0)]
  [string]$Root = (Get-Location).Path,

  [switch]$Fix,
  [switch]$Dedup,

  [string]$ReportPath = (Join-Path (Get-Location) 'reports\audit-site-settings.csv'),

  # Optional scoping (regex on full path)
  [string]$IncludePathRegex = '',
  [string]$ExcludePathRegex = '\\node_modules\\|\\admin\\templates?\\'
)

$ErrorActionPreference = 'Stop'

# Ensure report directory exists
$reportDir = Split-Path $ReportPath -Parent
if ($reportDir -and -not (Test-Path $reportDir)) {
  New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

# Collect HTML files (skip known partials)
$files = Get-ChildItem -Path $Root -Recurse -Filter *.html -File |
  Where-Object { $_.Name -notin @('header.html','footer.html') }

if ($IncludePathRegex) { $files = $files | Where-Object { $_.FullName -match $IncludePathRegex } }
if ($ExcludePathRegex) { $files = $files | Where-Object { $_.FullName -notmatch $ExcludePathRegex } }

# Detect tag (type="module" + src ending in site-settings.js with optional ?v=)
$scriptDetectPattern = [regex]::new("(?is)<script[^>]*\btype\s*=\s*[""']module[""'][^>]*\bsrc\s*=\s*[""'][^""'>]*site-settings\.js(?:\?[^""'>]*)?[""'][^>]*>\s*</script>")
$closingHeadPattern  = [regex]::new("(?i)</head\s*>")

$insertTag = '  <script type="module" src="/js/modules/site-settings.js"></script>'

# Results
$result = [System.Collections.Generic.List[object]]::new()

foreach ($f in $files) {
  $raw     = Get-Content -LiteralPath $f.FullName -Raw
  $matches = $scriptDetectPattern.Matches($raw)
  $count   = $matches.Count
  $action  = 'None'
  $new     = $raw
  $changed = $false

  # 1) Deduplicate (keep first, remove others from end to start)
  if ($Dedup -and $count -gt 1) {
    $backup = "$($f.FullName).bak-$(Get-Date -Format yyyyMMddHHmmss)"
    Copy-Item -LiteralPath $f.FullName -Destination $backup
    for ($i = $matches.Count - 1; $i -ge 1; $i--) {
      $m = $matches[$i]
      $new = $new.Remove($m.Index, $m.Length)
    }
    $changed = $true
    $action  = "Deduplicated ($count -> 1); backup: $(Split-Path $backup -Leaf)"
    $count   = 1
  }

  # 2) Insert when missing
  if ($Fix -and $count -eq 0) {
    $headMatch = $closingHeadPattern.Match($new)
    if ($headMatch.Success) {
      if (-not $changed) {
        $backup = "$($f.FullName).bak-$(Get-Date -Format yyyyMMddHHmmss)"
        Copy-Item -LiteralPath $f.FullName -Destination $backup
      }
      $new     = $new.Insert($headMatch.Index, "$insertTag`r`n")
      $changed = $true
      $action  = if ($action -eq 'None') { "Inserted include; backup: $(Split-Path $backup -Leaf)" } else { "$action; Inserted include" }
      $count   = 1
    } else {
      $action  = if ($action -eq 'None') { 'Skipped (no </head> found)' } else { "$action; Skipped (no </head> found)" }
    }
  }

  # 3) Write if changed
  if ($changed) {
    Set-Content -LiteralPath $f.FullName -Value $new -Encoding utf8
  } else {
    if     ($count -gt 0 -and -not $Dedup -and -not $Fix) { $action = 'Has include' }
    elseif ($count -eq 0 -and -not $Fix)                  { $action = 'Missing (no change)' }
    elseif ($count -gt 1 -and -not $Dedup)                { $action = "Duplicate ($count) (no change)" }
  }

  $result.Add([pscustomobject]@{
    File   = $f.FullName
    Count  = $count
    Action = $action
  }) | Out-Null
}

$result | Sort-Object File | Export-Csv -Path $ReportPath -NoTypeInformation -Encoding UTF8
Write-Host "Report written to: $ReportPath"
if ($Fix)   { Write-Host "Fix mode executed. Review backups and Git diffs." }
if ($Dedup) { Write-Host "Dedup mode executed. Review backups and Git diffs." }
