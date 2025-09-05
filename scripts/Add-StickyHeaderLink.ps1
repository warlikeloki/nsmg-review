param(
  # Default: the parent folder of where this script lives (handles ...\Website\scripts)
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [switch]$Backup
)

Write-Host "Root: $Root"

if (-not (Test-Path $Root)) {
  Write-Error "Root path not found: $Root"
  exit 1
}

# Find HTML files under root
$files = Get-ChildItem -Path $Root -Recurse -Include *.html -File
if (-not $files) {
  Write-Warning "No .html files found under $Root"
  exit 0
}

$insertLine = '  <link rel="stylesheet" href="/css/sticky-header.css" />'
# Match /css/header.css or ../css/header.css etc.
$headerCssPattern   = '(?is)(<link[^>]+href\s*=\s*["''](?:(?:\.\./)+|/)?css/header\.css["''][^>]*>)'
$alreadyHasPattern  = '(?is)href\s*=\s*["''][^"'']*sticky-header\.css["'']'
$headClosePattern   = '(?is)</head>'
$updatedCount = 0

foreach ($f in $files) {
  $content = Get-Content -Raw -Path $f.FullName

  # Idempotent: skip if sticky-header.css is already referenced
  if ($content -match $alreadyHasPattern) { continue }

  $newContent = $null

  if ($content -match $headerCssPattern) {
    # Insert right after header.css
    $newContent = [regex]::Replace(
      $content,
      $headerCssPattern,
      { param($m) $m.Groups[1].Value + "`r`n" + $insertLine },
      1
    )
  }
  elseif ($content -match $headClosePattern) {
    # Fallback: insert before </head>
    $newContent = [regex]::Replace(
      $content,
      $headClosePattern,
      { param($m) $insertLine + "`r`n" + $m.Groups[0].Value },
      1
    )
  }
  else {
    # Missing </head>? skip and report
    Write-Warning "Skipped (no </head>): $($f.FullName)"
    continue
  }

  if ($newContent -and $newContent -ne $content) {
    if ($Backup) {
      Copy-Item -Path $f.FullName -Destination ($f.FullName + ".bak") -Force
    }
    Set-Content -Path $f.FullName -Value $newContent -Encoding UTF8
    Write-Host "Updated: $($f.FullName)"
    $updatedCount++
  }
}

Write-Host "Done. Files updated: $updatedCount"
