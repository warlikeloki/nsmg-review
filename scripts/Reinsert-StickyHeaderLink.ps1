<#
Reinsert-StickyHeaderLink.ps1
Adds <link rel="stylesheet" href="/css/sticky-header.css"> to HTML files that are missing it.
- Inserts right after the first header.css link if found; otherwise right before </head>.
- Creates .bak backups when -Backup is used.
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory=$false)]
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [switch]$Backup
)

if (-not (Test-Path -LiteralPath $Root)) {
  Write-Error "Root path not found: $Root"
  exit 1
}

Write-Host "Root: $Root"

# Patterns
$stickyHref    = '/css/sticky-header.css'
$stickyPresent = New-Object System.Text.RegularExpressions.Regex([System.Text.RegularExpressions.Regex]::Escape($stickyHref), 'IgnoreCase')

$headerCssRx = New-Object System.Text.RegularExpressions.Regex(
  '<link[^>]+href\s*=\s*["'']\/css\/[^"''>]*header\.css["''][^>]*>',
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$endHeadRx = New-Object System.Text.RegularExpressions.Regex('</head>', 'IgnoreCase')

$insertLine = '  <link rel="stylesheet" href="/css/sticky-header.css">'

$files = Get-ChildItem -Path $Root -Recurse -Include *.html -File
$updated = 0
foreach ($f in $files) {
  $content = Get-Content -Raw -LiteralPath $f.FullName -ErrorAction Stop

  if ($stickyPresent.IsMatch($content)) { continue }

  $newContent = $content
  if ($headerCssRx.IsMatch($content)) {
    $newContent = $headerCssRx.Replace($content, { param($m) $m.Value + "`r`n" + $insertLine }, 1)
  } elseif ($endHeadRx.IsMatch($content)) {
    $newContent = $endHeadRx.Replace($content, $insertLine + "`r`n</head>", 1)
  } else {
    Write-Warning "Skipped (no </head>): $($f.FullName)"
    continue
  }

  if ($newContent -ne $content) {
    if ($Backup) { Copy-Item -LiteralPath $f.FullName -Destination ($f.FullName + '.bak') -Force }
    Set-Content -LiteralPath $f.FullName -Value $newContent -Encoding UTF8
    Write-Host "Updated: $($f.FullName)"
    $updated++
  }
}
Write-Host "Done. Files updated: $updated"
