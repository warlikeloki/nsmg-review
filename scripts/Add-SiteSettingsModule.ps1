param(
  [string]$Root,
  [switch]$Backup
)

function Resolve-WebRoot {
  param([string]$StartPath)
  # If this folder has .html files, use it
  if (Get-ChildItem -Path $StartPath -Recurse -Include *.html -File -ErrorAction SilentlyContinue) {
    return (Resolve-Path $StartPath).Path
  }
  # Otherwise, try parent (common when script is under \Website\scripts)
  $parent = (Resolve-Path (Join-Path $StartPath "..")).Path
  if (Get-ChildItem -Path $parent -Recurse -Include *.html -File -ErrorAction SilentlyContinue) {
    return $parent
  }
  return $null
}

if (-not $Root -or -not (Test-Path $Root)) {
  $Root = Resolve-WebRoot -StartPath $PSScriptRoot
}

if (-not $Root -or -not (Test-Path $Root)) {
  Write-Error "Root path not found. Pass -Root 'G:\Website' (or your site folder)."
  exit 1
}

Write-Host "Root: $Root"

$files = Get-ChildItem -Path $Root -Recurse -Include *.html -File
if (-not $files) {
  Write-Warning "No .html files found under $Root"
  exit 0
}

$already = '(?is)<script[^>]+type\s*=\s*["'']module["''][^>]+src\s*=\s*["'']/js/modules/site-settings\.js["'']'
$headClose = '(?is)</head>'
$insertLine = '  <script type="module" src="/js/modules/site-settings.js"></script>'

$updated = 0
foreach ($f in $files) {
  $content = Get-Content -Raw -Path $f.FullName
  if ($content -match $already) { continue }

  if ($content -match $headClose) {
    $newContent = [regex]::Replace(
      $content,
      $headClose,
      { param($m) $insertLine + "`r`n" + $m.Groups[0].Value },
      1
    )
    if ($newContent -ne $content) {
      if ($Backup) { Copy-Item $f.FullName ($f.FullName + ".bak") -Force }
      Set-Content -Path $f.FullName -Value $newContent -Encoding UTF8
      Write-Host "Updated: $($f.FullName)"
      $updated++
    }
  } else {
    Write-Warning "Skipped (no </head>): $($f.FullName)"
  }
}

Write-Host "Done. Files updated: $updated"
