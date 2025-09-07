<#
Add-AssetVersions.ps1
NSM-31: Append or refresh ?v=<version> on static asset URLs to force cache refresh after deploys.

Usage:
  .\Add-AssetVersions.ps1 -Root ".\Website" -Backup
  .\Add-AssetVersions.ps1 -Root ".\Website" -Version "20250907T1500" -Backup
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory=$false)]
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,

  [Parameter(Mandatory=$false)]
  [ValidatePattern("^[A-Za-z0-9._-]+$")]
  [string]$Version = (Get-Date -Format "yyyyMMddHHmm"),

  [switch]$Backup
)

Write-Host "Root: $Root"
Write-Host "Version: $Version"

if (-not (Test-Path -LiteralPath $Root)) {
  Write-Error "Root not found: $Root"
  exit 1
}

function Set-VersionQuery {
  param(
    [Parameter(Mandatory=$true)][string]$Url,
    [Parameter(Mandatory=$true)][string]$Version
  )

  if ($Url -match '^(?:data:|mailto:|tel:|#|javascript:)' ) { return $Url }

  if ($Url -match '^(?<base>[^?#]*)(?:\?(?<qs>[^#]*))?(?:#(?<hash>.*))?$') {
    $base = $Matches.base
    $qs   = $Matches.qs
    $hash = $Matches.hash

    $map = [ordered]@{}
    if ($qs) {
      foreach ($p in $qs -split '&') {
        if (-not $p) { continue }
        if ($p -match '^(?<k>[^=]+)=(?<v>.*)$') { $map[$Matches.k] = $Matches.v }
        else { $map[$p] = '' }
      }
    }

    $map['v'] = $Version

    $newqs = ($map.GetEnumerator() | ForEach-Object { '{0}={1}' -f $_.Key, $_.Value }) -join '&'
    $newUrl = $base
    if ($newqs) { $newUrl += '?' + $newqs }
    if ($hash) { $newUrl += '#' + $hash }
    return $newUrl
  }

  return $Url
}

# Regex for href/src attributes pointing at common static extensions.
$AttrPattern = '(?is)(?<attr>href|src)\s*=\s*(?<q>["''])(?<url>[^"''\s>]+\.(?:css|js|mjs|png|jpe?g|gif|webp|svg|woff2?|ttf|otf))\k<q>'

function Update-HtmlFile {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][string]$VersionArg
  )

  $content = Get-Content -Raw -LiteralPath $Path -ErrorAction Stop

  $evaluator = {
    param($m)
    $attr = $m.Groups['attr'].Value
    $q    = $m.Groups['q'].Value
    $url  = $m.Groups['url'].Value
    $new  = Set-VersionQuery -Url $url -Version $VersionArg
    return ('{0}={1}{2}{1}' -f $attr, $q, $new)
  }

  $newContent = [System.Text.RegularExpressions.Regex]::Replace(
    $content,
    $AttrPattern,
    $evaluator
  )

  if ($newContent -ne $content) {
    if ($Backup) { Copy-Item -LiteralPath $Path -Destination ($Path + '.bak') -Force }
    Set-Content -LiteralPath $Path -Value $newContent -Encoding UTF8
    Write-Host "Updated HTML: $Path"
    return $true
  }
  return $false
}

# JS literal targets: ensure these fetch() URLs get a ?v=version appended
$JsLiteralTargets = @(
  '/header.html',
  '/footer.html',
  '/json/site-settings.json'
)

function Update-JsFileLiterals {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][string]$VersionArg
  )

  $content = Get-Content -Raw -LiteralPath $Path -ErrorAction SilentlyContinue
  if (-not $content) { return $false }
  $original = $content

  foreach ($t in $JsLiteralTargets) {
    $alreadyPattern = [System.Text.RegularExpressions.Regex]::Escape($t) + '(?:\?[^#]*\bv=|\&\bv=)'
    if ($content -match $alreadyPattern) { continue }

    $replacement = if ($t -match '\?') { "$t&v=$VersionArg" } else { "$t?v=$VersionArg" }

    $regex = New-Object System.Text.RegularExpressions.Regex([System.Text.RegularExpressions.Regex]::Escape($t))
    $content = $regex.Replace($content, { param($m) $replacement })
  }

  if ($content -ne $original) {
    if ($Backup) { Copy-Item -LiteralPath $Path -Destination ($Path + '.bak') -Force }
    Set-Content -LiteralPath $Path -Value $content -Encoding UTF8
    Write-Host "Updated JS: $Path"
    return $true
  }
  return $false
}

# Execute

$updatedCount = 0
Get-ChildItem -Path $Root -Recurse -Include *.html -File | ForEach-Object {
  if (Update-HtmlFile -Path $_.FullName -VersionArg $Version) { $updatedCount++ }
}
Write-Host "HTML files updated: $updatedCount"

$jsRoot = Join-Path $Root 'js'
$jsUpdated = 0
if (Test-Path -LiteralPath $jsRoot) {
  Get-ChildItem -Path $jsRoot -Recurse -Include *.js -File | ForEach-Object {
    if (Update-JsFileLiterals -Path $_.FullName -VersionArg $Version) { $jsUpdated++ }
  }
  Write-Host "JS files updated: $jsUpdated"
} else {
  Write-Host "No JS folder found under $Root\js - skipping JS literal updates."
}

Write-Host "Done. Cache-busting version applied."
