
<#
  Generate-Sitemap.ps1 — NSM-121
  Scans the repo for .html pages, builds sitemap.xml with canonical HTTPS URLs and <lastmod>,
  and ensures robots.txt contains a "Sitemap: <base>/sitemap.xml" line.

  Usage (repo root):
    pwsh ./scripts/Generate-Sitemap.ps1
    # (Optional) override base URL:
    pwsh ./scripts/Generate-Sitemap.ps1 -BaseUrl "https://example.com"
#>

[CmdletBinding()]
param(
  [ValidatePattern('^https://')]
  [string]$BaseUrl = "https://neilsmith.org",

  [string]$RootPath = ".",
  [string]$OutFile = "sitemap.xml",
  [string]$RobotsPath = "robots.txt"
)

$ErrorActionPreference = "Stop"

function Info($m){ Write-Host "[info] $m" -ForegroundColor Cyan }
function Fail($m){ Write-Host "[error] $m" -ForegroundColor Red; exit 1 }

# Normalize base url (no trailing slash)
$BaseUrl = $BaseUrl.TrimEnd('/')

# Resolve root
try {
  $Root = (Resolve-Path $RootPath).Path
} catch {
  Fail "RootPath '$RootPath' not found."
}

# Collect .html files (exclude shared partials and server-only dirs)
$excludeFileNames = @('header.html','footer.html','404.html','500.html')
$excludeDirsLike  = @('/admin/','\admin\','/php/','\php\','/includes/','\includes\')

$files = Get-ChildItem -Path $Root -Recurse -File -Filter *.html | Where-Object {
  $rel = $_.FullName.Substring($Root.Length).TrimStart('\','/')
  $name = [IO.Path]::GetFileName($rel).ToLowerInvariant()
  if ($excludeFileNames -contains $name) { return $false }
  $relLower = $rel.ToLowerInvariant()
  foreach ($seg in $excludeDirsLike) { if ($relLower -like "*$seg*") { return $false } }
  return $true
}

if (-not $files) { Fail "No .html files found to include in sitemap." }

# Map file path -> URL path
function Get-UrlPath([string]$rel){
  $p = '/' + ($rel -replace '\\','/')
  if ($p -match '/index\.html$'){ return ($p -replace '/index\.html$','/') }
  return $p
}

# Try git last commit date, fallback to file mtime (UTC)
function Get-LastMod([string]$fullPath, [datetime]$fsTimeUtc){
  $last = $null
  try {
    $git = (git log -1 --format=%cI -- "$fullPath" 2>$null)
    if ($git) { $last = $git.Trim() }
  } catch { }
  if (-not $last) { $last = $fsTimeUtc.ToString('yyyy-MM-ddTHH:mm:ssZ') }
  return $last
}

$urls = foreach ($f in $files) {
  $rel = $f.FullName.Substring($Root.Length).TrimStart('\','/')
  [pscustomobject]@{
    loc     = "$BaseUrl$(Get-UrlPath $rel)"
    lastmod = Get-LastMod -fullPath $f.FullName -fsTimeUtc $f.LastWriteTimeUtc
  }
}

# Build XML (UTF-8 without BOM)
$xml = New-Object System.Text.StringBuilder
[void]$xml.AppendLine('<?xml version="1.0" encoding="UTF-8"?>')
[void]$xml.AppendLine('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
foreach ($u in ($urls | Sort-Object loc)) {
  $locEsc = [System.Security.SecurityElement]::Escape($u.loc)
  [void]$xml.AppendLine('  <url>')
  [void]$xml.AppendLine("    <loc>$locEsc</loc>")
  [void]$xml.AppendLine("    <lastmod>$($u.lastmod)</lastmod>")
  [void]$xml.AppendLine('  </url>')
}
[void]$xml.AppendLine('</urlset>')

$siteMapPath = Join-Path $Root $OutFile
[System.IO.File]::WriteAllText($siteMapPath, $xml.ToString(), [System.Text.UTF8Encoding]::new($false))
Info "Wrote $OutFile with $($urls.Count) URLs."

# Ensure robots.txt has the Sitemap: line
$robotsFile = Join-Path $Root $RobotsPath
if (Test-Path $robotsFile) {
  $lines = Get-Content -LiteralPath $robotsFile
} else {
  $lines = @("User-agent: *","Allow: /")
}

# Remove any existing 'Sitemap:' lines (case-insensitive), then append canonical one
$lines = $lines | Where-Object { $_ -notmatch '^\s*Sitemap\s*:' }
$lines += "Sitemap: $BaseUrl/sitemap.xml"

$lines | Set-Content -Path $robotsFile -Encoding UTF8
Info "Updated $RobotsPath with sitemap reference."

Write-Host "Done." -ForegroundColor Green
