<# 
.SYNOPSIS
  Mirrors the private repo's MAIN branch to the public repo's MAIN branch (branch name configurable).
  Uses a temporary bare clone to avoid affecting your working directories.

.DESIGNED-FOR
  - Windows + PowerShell
  - Git 2.30+ (you have 2.50.x)
  - SSH auth with separate keys for private/public (recommended)

.SECURITY
  - Pushes ONLY a single branch (default: main); no other branches or tags are copied.
  - Uses SSH host aliases so you never embed PATs/credentials in the script or remotes.
  - If you rebase on private/main, use -Force to overwrite the public/main safely.

.PARAMS
  -PrivateRepo  : SSH URL to PRIVATE repo (e.g., git@github-private:owner/private.git)
  -PublicRepo   : SSH URL to PUBLIC repo  (e.g., git@github-public:owner/public.git)
  -Branch       : Branch to mirror (default: main)
  -DryRun       : Show what would happen without pushing
  -Force        : Use --force instead of --force-with-lease (for post-rebase situations)
  -Keep         : Keep the temp bare repo folder (for troubleshooting)
  -IncludeTags  : Also push tags that are reachable from the specified branch (OFF by default)

.ENV-VARS (optional)
  NSMG_PRIVATE_REPO, NSMG_PUBLIC_REPO, NSMG_BRANCH

.EXAMPLES
  # First, do a dry-run:
  .\Mirror-MainToPublic.ps1 -DryRun

  # Run with env vars set previously:
  .\Mirror-MainToPublic.ps1

  # Explicit params, and clean up afterwards:
  .\Mirror-MainToPublic.ps1 -PrivateRepo git@github-private:you/your-private.git `
                            -PublicRepo  git@github-public:you/your-public.git `
                            -Branch main

#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $false)]
  [string]$PrivateRepo = $env:NSMG_PRIVATE_REPO,

  [Parameter(Mandatory = $false)]
  [string]$PublicRepo  = $env:NSMG_PUBLIC_REPO,

  [Parameter(Mandatory = $false)]
  [string]$Branch      = $(if ($env:NSMG_BRANCH) { $env:NSMG_BRANCH } else { 'main' }),

  [switch]$DryRun,
  [switch]$Force,
  [switch]$Keep,
  [switch]$IncludeTags
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Info    { param($m) Write-Host "[INFO ] $m" -ForegroundColor Cyan }
function Write-Warn    { param($m) Write-Host "[WARN ] $m" -ForegroundColor Yellow }
function Write-ErrorX  { param($m) Write-Host "[ERROR] $m" -ForegroundColor Red }
function Exec-Git      { param([string[]]$Args, [string]$Cwd)
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = "git"
  $psi.Arguments = ($Args -join ' ')
  if ($Cwd) { $psi.WorkingDirectory = $Cwd }
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError  = $true
  $psi.UseShellExecute = $false
  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  [void]$p.Start()
  $out = $p.StandardOutput.ReadToEnd()
  $err = $p.StandardError.ReadToEnd()
  $p.WaitForExit()
  if ($p.ExitCode -ne 0) {
    throw "git $($Args -join ' ')`nExitCode: $($p.ExitCode)`nError: $err"
  }
  return $out
}

# --- Sanity checks ---
try { Get-Command git | Out-Null }
catch { throw "Git not found in PATH. Install Git and try again." }

if ([string]::IsNullOrWhiteSpace($PrivateRepo) -or [string]::IsNullOrWhiteSpace($PublicRepo)) {
  throw "PrivateRepo/PublicRepo not set. Pass parameters or set NSMG_PRIVATE_REPO / NSMG_PUBLIC_REPO env vars."
}

if ($PrivateRepo -eq $PublicRepo) {
  throw "Private and Public repo URLs cannot be the same."
}

Write-Info "Source (private) : $PrivateRepo"
Write-Info "Target (public)  : $PublicRepo"
Write-Info "Branch           : $Branch"
if ($DryRun) { Write-Warn "DRY RUN: No changes will be pushed." }

# --- Temp bare repo folder ---
$stamp   = Get-Date -Format "yyyyMMdd-HHmmss"
$baseDir = Join-Path $env:TEMP "nsmg-mirror-$stamp"
$bareDir = Join-Path $baseDir "repo.git"

New-Item -ItemType Directory -Path $baseDir | Out-Null

try {
  Write-Info "Cloning private (bare, single-branch, no tags)…"
  # Clone only the target branch; no other refs/tags are fetched.
  Exec-Git -Args @("clone","--bare","--single-branch","--branch",$Branch,"--no-tags",$PrivateRepo,$bareDir)

  # Confirm local branch tip
  $srcTip = (Exec-Git -Args @("-C",$bareDir,"rev-parse","refs/heads/$Branch")).Trim()
  Write-Info "Private/$Branch tip: $srcTip"

  # Check target's current tip (if it exists)
  Write-Info "Checking public/$Branch tip…"
  $ls = ""
  try {
    $ls = Exec-Git -Args @("ls-remote",$PublicRepo,"refs/heads/$Branch")
  } catch {
    # If the public repo is new/empty or branch missing, ls-remote may return nothing; that's fine.
    $ls = ""
  }
  $dstTip = ""
  if ($ls) {
    $dstTip = ($ls -split '\t')[0]
    Write-Info "Public/$Branch tip: $dstTip"
  } else {
    Write-Warn "Public/$Branch not found (will be created)."
  }

  # Add public remote to the bare repo
  Exec-Git -Args @("-C",$bareDir,"remote","add","public",$PublicRepo)

  if ($DryRun) {
    Write-Host ""
    Write-Host "DRY RUN SUMMARY" -ForegroundColor Yellow
    Write-Host "Would push: $srcTip  (private:$Branch)  →  public:$Branch"
    if ($dstTip) { Write-Host "Remote currently at: $dstTip" }
    if ($IncludeTags) { Write-Host "Would also push tags reachable from $Branch" }
    return
  }

  # Choose push strategy
  $pushArgs = @("-C",$bareDir,"push","public","refs/heads/$Branch:refs/heads/$Branch")
  if ($Force) {
    Write-Warn "Force mode enabled: using --force (overwrites public/$Branch)."
    $pushArgs = @("-C",$bareDir,"push","--force","--prune","public","refs/heads/$Branch:refs/heads/$Branch")
  } else {
    $pushArgs = @("-C",$bareDir,"push","--force-with-lease","public","refs/heads/$Branch:refs/heads/$Branch")
  }

  Write-Info "Pushing $Branch to public…"
  Exec-Git -Args $pushArgs
  Write-Info "Branch push complete."

  if ($IncludeTags) {
    Write-Warn "Pushing tags reachable from $Branch…"
    # Limit tag push to only those that are reachable from the branch (safer than --tags).
    # Build a list of tag names whose commits are ancestors of $srcTip.
    $tags = Exec-Git -Args @("-C",$bareDir,"for-each-ref","--format=%(refname:short)","refs/tags")
    $tags = $tags -split "`r?`n" | Where-Object { $_ -ne "" }
    $reachable = @()
    foreach ($t in $tags) {
      $tagSha = (Exec-Git -Args @("-C",$bareDir,"rev-list","-n","1","refs/tags/$t")).Trim()
      $isAncestor = $false
      try {
        Exec-Git -Args @("-C",$bareDir,"merge-base","--is-ancestor",$tagSha,$srcTip)
        $isAncestor = $true
      } catch { $isAncestor = $false }
      if ($isAncestor) { $reachable += $t }
    }
    if ($reachable.Count -gt 0) {
      $refspecs = $reachable | ForEach-Object { "refs/tags/$_:refs/tags/$_" }
      Exec-Git -Args @("-C",$bareDir,"push","public") + $refspecs
      Write-Info "Pushed $($reachable.Count) reachable tag(s)."
    } else {
      Write-Info "No reachable tags to push."
    }
  }

  Write-Host "`n✅ Mirror complete: private:$Branch → public:$Branch" -ForegroundColor Green

} finally {
  if (-not $Keep -and (Test-Path $baseDir)) {
    Remove-Item -LiteralPath $baseDir -Recurse -Force -ErrorAction SilentlyContinue
  } elseif ($Keep) {
    Write-Warn "Keeping temp folder: $baseDir"
  }
}
