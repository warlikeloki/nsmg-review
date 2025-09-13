<#
  Generate-Sitemap.ps1 — NSM-121 (hardened)
  - Uses `git ls-files -co --exclude-standard` so .gitignore is respected
  - Excludes backup/old HTML and non-public dirs
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
try { $Root = (Resolve-Path $RootPath).Path } catch { Fail "RootPath '$RootPath' not found." }

# Helpers
function MatchesAny([string]$s, [string[]]$globs){
  foreach($g in $globs){ if($s -like $g){ return $true } }
  return $false
}

# Exclusions
$excludeFileNames = @('header.html','footer.html','404.html','500.html')
$excludeDirGlobs  = @(
  '*/admin/*','*\admin\*',
  '*/php/*','*\php\*',
  '*/includes/*','*\includes\*',
  '*/vendor/*','*\vendor\*',
  '*/node_modules/*','*\node_modules\*',
  '*/.git/*','*\.git\*',
  '*/.github/*','*\.github\*',
  '*/tests/*','*\tests\*',
  '*/scripts/*','*\scripts\*',
  '*/docs/*','*\docs\*'
)
# Backup/old file name patterns (catch both positions of ".bak" and timestamp suffixes)
$excludeNameGlobs = @(
  '*.html.bak','*.html.bak-*','*.html.old','*.html.old-*',
  '*.bak.html','*.bak-*.html','*.old.html','*.old-*.html',
  '*~','*.tmp','*.swp'
)

# Gather candidate HTML files, preferring git (respects .gitignore)
$files = @()
$useGit = $true
try {
  $gitTop = (git -C $Root rev-parse --show-toplevel 2>$null).Trim()
  if (-not $gitTop) { $useGit = $false }
} catch { $useGit = $false }

if ($useGit) {
  Info "Using git index (respects .gitignore)..."
  $relPaths = (git -C $Root ls-files -co --exclude-standard --full-name) `
              | Where-Object { $_ -like '*.html' }
  foreach($rp in $relPaths){
    $full = Join-Path $Root $rp
    if (Test-Path -LiteralPath $full) { $files += (Get-Item -LiteralPath $full) }
  }
} else {
  Info "git not available; falling back to filesystem scan (won't consult .gitignore)."
  $files = Get-ChildItem -Path $Root -Recurse -File -Filter *.html
}

# Filter out non-public, backups/olds, and named exclusions
$files = $files | Where-Object {
  $rel = $_.FullName.Substring($Root.Length).TrimStart('\','/')
  $relLower = $rel.ToLowerInvariant()
  $name = [IO.Path]::GetFileName($relLower)

  if ($excludeFileNames -contains $name) { return $false }
  if (MatchesAny $relLower $excludeDirGlobs) { return $false }
  if (MatchesAny $relLower $excludeNameGlobs) { return $false }
  return $true
}

if (-not $files) { Fail "No .html files found to include in sitemap after filtering." }

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
$lines = $lines | Where-Object { $_ -notmatch '^\s*Sitemap\s*:' }
$lines += "Sitemap: $BaseUrl/sitemap.xml"
$lines | Set-Content -Path $robotsFile -Encoding UTF8
Info "Updated $RobotsPath with sitemap reference."

Write-Host "Done." -ForegroundColor Green
