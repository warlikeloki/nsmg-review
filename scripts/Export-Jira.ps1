param(
  [string]$Jql = 'project = NSM ORDER BY updated DESC',
  [string]$OutMd = 'docs/jira/issues-latest.md',
  [string]$OutCsv = '',
  [string]$SprintFieldId = 'auto',
  [int]$PageSize = 100
)

# ============================
# Env & Auth
# ============================
$Base = $env:JIRA_BASE            # e.g., https://your-site.atlassian.net
$Email = $env:JIRA_EMAIL          # Atlassian account email
$Token = $env:JIRA_TOKEN          # API token
$UseScoped = $env:JIRA_USE_SCOPED # "1"/"true" for scoped tokens
$CloudIdEnv = $env:JIRA_CLOUD_ID  # optional

if (-not $Base -or -not $Email -or -not $Token) {
  throw "Set env vars JIRA_BASE, JIRA_EMAIL, JIRA_TOKEN before running."
}

$Base = $Base.TrimEnd('/')
$BasicAuth = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${Email}:${Token}"))
$AuthHeader = @{ Authorization = $BasicAuth }

# ============================
# API base resolution
# ============================
function Get-ApiBase {
  param(
    [string]$SiteBase,
    [string]$UseScopedFlag,
    [string]$CloudIdFromEnv
  )

  $useScoped = $false
  if ($UseScopedFlag) {
    $useScoped = @('1','true','yes','on') -contains ($UseScopedFlag.ToLower())
  }

  if (-not $useScoped) {
    return "$SiteBase/rest/api/3"
  }

  # Scoped: https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3
  $cloudId = $CloudIdFromEnv
  if (-not $cloudId) {
    try {
      $tenantInfo = Invoke-RestMethod -Uri "$SiteBase/_edge/tenant_info" -Method Get -ErrorAction Stop
      if ($tenantInfo -and $tenantInfo.cloudId) {
        $cloudId = $tenantInfo.cloudId
      } else {
        throw "Could not discover cloudId from $SiteBase/_edge/tenant_info"
      }
    } catch {
      throw "Failed to determine cloudId: $($_.Exception.Message)"
    }
  }
  return "https://api.atlassian.com/ex/jira/$cloudId/rest/api/3"
}

$ApiBase = Get-ApiBase -SiteBase $Base -UseScopedFlag $UseScoped -CloudIdFromEnv $CloudIdEnv

function Get-ApiUrl {
  param([string]$Path, [hashtable]$Query)
  $url = "$ApiBase/$Path".TrimEnd('/')
  if ($Query -and $Query.Count -gt 0) {
    $pairs = @()
    foreach ($k in $Query.Keys) {
      $pairs += ("{0}={1}" -f [uri]::EscapeDataString($k), [uri]::EscapeDataString([string]$Query[$k]))
    }
    $url = $url + "?" + ($pairs -join '&')
  }
  return $url
}

function Invoke-JiraGet {
  param([string]$Path, [hashtable]$Query)
  $url = Get-ApiUrl -Path $Path -Query $Query
  Invoke-RestMethod -Headers $AuthHeader -Uri $url -Method Get -ErrorAction Stop
}

# ============================
# Field discovery (Sprint)
# ============================
function Get-SprintFieldIdAuto {
  try {
    $fields = Invoke-JiraGet -Path "field" -Query @{}
  } catch {
    Write-Warning "Failed to fetch fields: $($_.Exception.Message)"
    return $null
  }
  foreach ($f in $fields) {
    if ($f.name -eq 'Sprint') { return $f.id }
    if ($f.schema -and $f.schema.custom -and ($f.schema.custom -match 'gh-sprint')) { return $f.id }
  }
  return $null
}

if ($SprintFieldId -eq 'auto' -or [string]::IsNullOrWhiteSpace($SprintFieldId)) {
  $detected = Get-SprintFieldIdAuto
  if ($detected) {
    Write-Host "Detected Sprint field id: $detected"
    $SprintFieldId = $detected
  } else {
    Write-Warning "Could not auto-detect Sprint field id. Proceeding without Sprint column."
    $SprintFieldId = ''
  }
}

# ============================
# Search (paginated)
# ============================
function Invoke-JiraSearch {
  param([string]$Query, [int]$StartAt = 0, [int]$MaxResults = 100)

  $fieldList = @('summary','status','assignee','updated','issuetype','priority','labels')
  if ($SprintFieldId) { $fieldList += $SprintFieldId }

  $res = Invoke-JiraGet -Path "search" -Query @{
    jql        = $Query
    startAt    = $StartAt
    maxResults = $MaxResults
    fields     = ($fieldList -join ',')
  }
  return $res
}

function Get-SprintNames {
  param($SprintFieldValue)
  if (-not $SprintFieldValue) { return @() }
  if ($SprintFieldValue -is [System.Array]) {
    $names = @()
    foreach ($s in $SprintFieldValue) {
      if ($s.PSObject.Properties.Name -contains 'name') { $names += $s.name }
      elseif ($s -is [string]) {
        if ($s -match 'name=([^,]+)') { $names += $matches[1] }
      }
    }
    return ($names | Select-Object -Unique)
  }
  if ($SprintFieldValue -is [string] -and ($SprintFieldValue -match 'name=([^,]+)')) { return @($matches[1]) }
  return @()
}

# ============================
# Fetch all results
# ============================
$all = @()
$start = 0
do {
  try {
    $res = Invoke-JiraSearch -Query $Jql -StartAt $start -MaxResults $PageSize
  } catch {
  # Try ErrorDetails.Message first (may be null in 5.1)
  if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
    Write-Host "Jira error details:" -ForegroundColor Yellow
    Write-Host $_.ErrorDetails.Message
  }
  else {
    # Fallback: read the HTTP response body
    $resp = $_.Exception.Response
    if ($resp -and $resp.GetResponseStream) {
      $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $body = $reader.ReadToEnd()
      if ($body) {
        Write-Host "Jira error details (raw):" -ForegroundColor Yellow
        Write-Host $body
        try {
          $errObj = $body | ConvertFrom-Json
          if ($errObj -and $errObj.errorMessages) {
            foreach ($m in $errObj.errorMessages) { Write-Host " - $m" -ForegroundColor Yellow }
          }
          if ($errObj -and $errObj.errors) {
            $props = $errObj.errors.PSObject.Properties
            foreach ($p in $props) { Write-Host (" - {0}: {1}" -f $p.Name, $p.Value) -ForegroundColor Yellow }
          }
        } catch { }
      }
    }
  }
  throw ("Jira search failed: " + $_.Exception.Message)
}

  if ($res.issues) { $all += $res.issues }
  $start = $start + $PageSize
} while ($res.total -gt $all.Count)

# ============================
# Build Markdown
# ============================
$today = Get-Date
$day = $today.ToString('yyyy-MM-dd')
$lines = @()
$lines += "# Jira Snapshot ($day)"
$lines += ""
$lines += "JQL: $Jql"
$lines += ""
$lines += "Total issues: $($all.Count)"
$lines += ""

# Summary by Status Category
$byCat = $all | ForEach-Object {
  [PSCustomObject]@{
    Key = $_.key
    Category = $_.fields.status.statusCategory.name
  }
} | Group-Object Category | Sort-Object Name

if ($byCat.Count -gt 0) {
  $lines += "## Summary"
  foreach ($g in $byCat) { $lines += ("- " + $g.Name + ": " + $g.Count) }
  $lines += ""
}

# Table
$lines += "## Issues"
if ($SprintFieldId) {
  $lines += "| Key | Summary | Status | Assignee | Sprint | Updated |"
  $lines += "| --- | --- | --- | --- | --- | --- |"
} else {
  $lines += "| Key | Summary | Status | Assignee | Updated |"
  $lines += "| --- | --- | --- | --- | --- |"
}

$sorted = $all | Sort-Object { $_.fields.updated } -Descending
foreach ($i in $sorted) {
  $f = $i.fields
  $assignee = if ($f.assignee) { $f.assignee.displayName } else { "-" }
  $updated = ([DateTime]$f.updated).ToString('yyyy-MM-dd')
  $summary = ($f.summary -replace '\|','\|')

  if ($SprintFieldId) {
    $sprints = Get-SprintNames $f.$SprintFieldId
    $sprintStr = if ($sprints.Count -gt 0) { ($sprints -join ', ') } else { "-" }
    $lines += "| [$($i.key)]($Base/browse/$($i.key)) | $summary | $($f.status.name) | $assignee | $sprintStr | $updated |"
  } else {
    $lines += "| [$($i.key)]($Base/browse/$($i.key)) | $summary | $($f.status.name) | $assignee | $updated |"
  }
}

# Ensure output directory exists
$dir = Split-Path $OutMd -Parent
if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$lines | Set-Content -Path $OutMd -Encoding UTF8
Write-Host ("Wrote " + $OutMd)

# ============================
# Optional CSV
# ============================
if ($OutCsv) {
  $csvRows = $all | ForEach-Object {
    $f = $_.fields
    [PSCustomObject]@{
      Key        = $_.key
      Url        = "$Base/browse/$($_.key)"
      Summary    = $f.summary
      Status     = $f.status.name
      Assignee   = if ($f.assignee) { $f.assignee.displayName } else { "" }
      Sprint     = if ($SprintFieldId) { (Get-SprintNames $f.$SprintFieldId) -join ', ' } else { "" }
      Updated    = ([DateTime]$f.updated).ToString('s')
      Type       = $f.issuetype.name
      Priority   = if ($f.priority) { $f.priority.name } else { "" }
      Labels     = if ($f.labels) { ($f.labels -join ',') } else { "" }
    }
  }
  $csvDir = Split-Path $OutCsv -Parent
  if ($csvDir) { New-Item -ItemType Directory -Force -Path $csvDir | Out-Null }
  $csvRows | Export-Csv -Path $OutCsv -NoTypeInformation -Encoding UTF8
  Write-Host ("Wrote " + $OutCsv)
}
