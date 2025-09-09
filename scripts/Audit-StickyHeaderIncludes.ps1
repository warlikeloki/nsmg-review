<# 
Audits .html files for a sticky-header.css <link>. 
Default: REPORT ONLY. Use -Fix to insert the link before </head>.
Creates timestamped .bak before any write. 
#>

param(
  [string]$Root = (Get-Location).Path,
  [switch]$Fix,
  [string]$ReportPath = "$(Get-Location)\reports\audit-sticky-header.csv"
)

$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Path (Split-Path $ReportPath) -Force | Out-Null

$files = Get-ChildItem -Path $Root -Recurse -Filter *.html |
  Where-Object {
    $_.Name -notin @('header.html','footer.html') -and
    $_.FullName -notmatch '\\node_modules\\' -and
    $_.FullName -notmatch '\\admin\\templates?\\'
  }

$result = @()

$pattern = 'href\s*=\s*["'']([^"'']*sticky-header\.css)["'']'
$linkTag = '  <link rel="stylesheet" href="/css/sticky-header.css">'

foreach ($f in $files) {
  $text = Get-Content -Path $f.FullName -Raw
  $hasLink = [bool]([regex]::Matches($text, $pattern, 'IgnoreCase'))

  $action = 'None'
  if ($Fix -and -not $hasLink) {
    if ($text -match '</head\s*>' ) {
      $backup = "$($f.FullName).bak-$(Get-Date -Format yyyyMMddHHmmss)"
      Copy-Item $f.FullName $backup

      $newText = [regex]::Replace($text, '</head\s*>', "$linkTag`r`n</head>", 
                                  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase, 1)
      Set-Content -Path $f.FullName -Value $newText -Encoding UTF8
      $action = "Inserted link; backup: $(Split-Path $backup -Leaf)"
    } else {
      $action = 'Skipped (no </head> found)'
    }
  } elseif ($hasLink) {
    $action = 'Has link'
  } else {
    $action = 'Missing (no change)'
  }

  $result += [pscustomobject]@{
    File     = $f.FullName
    HasLink  = $hasLink
    Action   = $action
  }
}

$result | Sort-Object File | Export-Csv -Path $ReportPath -NoTypeInformation -Encoding UTF8
Write-Host "Report written to: $ReportPath"
if ($Fix) { Write-Host "Fix mode executed. Review backups and commit diffs." }
