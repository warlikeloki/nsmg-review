<#
Audit-HeadIncludes.ps1
Reports which HTML files include key head assets.
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory=$false)]
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

if (-not (Test-Path -LiteralPath $Root)) {
  Write-Error "Root path not found: $Root"
  exit 1
}

$targets = @(
  '/css/sticky-header.css',
  '/js/main.js',
  '/js/modules/site-settings.js'
)

$regexes = @{}
foreach ($t in $targets) {
  $regexes[$t] = New-Object System.Text.RegularExpressions.Regex([System.Text.RegularExpressions.Regex]::Escape($t), 'IgnoreCase')
}

$rows = @()
$files = Get-ChildItem -Path $Root -Recurse -Include *.html -File
foreach ($f in $files) {
  $c = Get-Content -Raw -LiteralPath $f.FullName
  $rows += [pscustomobject]@{
    File            = $f.FullName
    HasStickyCss    = $regexes['/css/sticky-header.css'].IsMatch($c)
    HasMainJs       = $regexes['/js/main.js'].IsMatch($c)
    HasSiteSettings = $regexes['/js/modules/site-settings.js'].IsMatch($c)
  }
}

$rows | Sort-Object File | Format-Table -AutoSize
Write-Host "Total HTML files: $($rows.Count)"
Write-Host ("Missing sticky-header.css: {0}" -f ($rows | Where-Object { -not $_.HasStickyCss } | Measure-Object).Count)
Write-Host ("Missing main.js: {0}" -f ($rows | Where-Object { -not $_.HasMainJs } | Measure-Object).Count)
Write-Host ("Missing site-settings.js: {0}" -f ($rows | Where-Object { -not $_.HasSiteSettings } | Measure-Object).Count)
