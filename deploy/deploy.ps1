<#
.SYNOPSIS
  NSMG Deploy (SFTP) — Windows PowerShell 5.1+ compatible

.DESCRIPTION
  Uploads your site via OpenSSH SFTP, preserving directory structure.
  Pre-filled for: user fh5494bhswi9 / web root /home4/fh5494bhswi9/public_html
  NOTE: Use your server hostname (e.g., gatorXXXX.hostgator.com), not the Cloudflare-proxied domain.

.REQUIREMENTS
  - OpenSSH client on Windows (sftp.exe, ssh.exe)
#>

[CmdletBinding()]
param(
  # Host + auth
  [Parameter()][string]$HostName = $env:DEPLOY_HOST,   # e.g., gatorXXXX.hostgator.com (or server IP)
  [Parameter()][int]$Port = $(if ($env:DEPLOY_PORT) { [int]$env:DEPLOY_PORT } else { 22 }),
  [Parameter()][string]$UserName = $env:DEPLOY_USER,
  [Parameter()][ValidateNotNullOrEmpty()][string]$KeyPath = $(if ($env:DEPLOY_KEY) { $env:DEPLOY_KEY } else { 'C:\Users\Owner\.ssh\nsmg_deploy_ed25519' }),

  # Remote target directory (document root)
  [Parameter()][string]$RemoteDir = $(if ($env:REMOTE_PATH) { $env:REMOTE_PATH } else { '/home4/fh5494bhswi9/public_html' }),

  # What to upload (patterns or paths). Directories are synced recursively.
  [Parameter()][string[]]$Include = @('index.html','*.html','assets','php'),

  # Show plan only (no changes)
  [switch]$Preview
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ---------- Defaults & sanity ----------
if ([string]::IsNullOrWhiteSpace($HostName)) { throw "Set -HostName or `$env:DEPLOY_HOST to your SERVER hostname (e.g., gatorXXXX.hostgator.com), not the public domain." }
if ([string]::IsNullOrWhiteSpace($UserName)) { $UserName = 'fh5494bhswi9' }
if (-not (Test-Path -Path $KeyPath)) { throw "Key not found: $KeyPath" }

# Resolve sftp.exe and ssh.exe explicitly
$SftpCmd = Get-Command sftp -ErrorAction SilentlyContinue
if (-not $SftpCmd) { throw "sftp.exe not found. Install the 'OpenSSH Client' optional Windows feature and restart PowerShell." }
$SftpExe = $SftpCmd.Source

$SshCmd = Get-Command ssh -ErrorAction SilentlyContinue
$hasSsh = $null -ne $SshCmd
$SshExe = if ($hasSsh) { $SshCmd.Source } else { $null }

# Resolve project root and a function to POSIX-ify paths for SFTP
$LocalRoot = (Resolve-Path ".").Path
function To-Posix([string]$p) {
  $full = [System.IO.Path]::GetFullPath($p)
  if ($full.StartsWith("\\?\")) { $full = $full.Substring(4) }
  return ($full -replace '\\','/')
}
$LocalRootPosix = To-Posix $LocalRoot

# Ensure remote base exists (ssh)
if ($hasSsh) {
  $mkdirCmd = "mkdir -p `"$RemoteDir`""
  & $SshExe -o "StrictHostKeyChecking=no" -o "Port=$Port" -o "IdentityFile=$KeyPath" "$UserName@$($HostName)" $mkdirCmd | Out-Null
}

# ---------- Build upload plan ----------
# We’ll group files by their relative directory, and push directories recursively.
$dirsToPush = New-Object System.Collections.Generic.HashSet[string]
$filesByDir = @{}  # key: rel dir, value: list of rel files

foreach ($entry in $Include) {
  if (Test-Path -LiteralPath $entry) {
    $item = Get-Item -LiteralPath $entry
    if ($item.PSIsContainer) {
      # Push dir recursively
      $rel = Resolve-Path -LiteralPath $item.FullName | ForEach-Object {
        $_.Path.Substring($LocalRoot.Length).TrimStart('\','/')
      }
      if ([string]::IsNullOrWhiteSpace($rel)) { $rel = '.' }
      [void]$dirsToPush.Add($rel)
    } else {
      # Single file
      $relFile = (Resolve-Path -LiteralPath $item.FullName).Path.Substring($LocalRoot.Length).TrimStart('\','/')
      $relDir  = Split-Path $relFile -Parent
      if ([string]::IsNullOrWhiteSpace($relDir)) { $relDir = '.' }
      if (-not $filesByDir.ContainsKey($relDir)) { $filesByDir[$relDir] = New-Object System.Collections.Generic.List[string] }
      $filesByDir[$relDir].Add($relFile)
    }
  } else {
    # Pattern: expand to files
    $files = Get-ChildItem -Recurse -File -Filter $entry -ErrorAction SilentlyContinue
    foreach ($f in $files) {
      $relFile = (Resolve-Path -LiteralPath $f.FullName).Path.Substring($LocalRoot.Length).TrimStart('\','/')
      $relDir  = Split-Path $relFile -Parent
      if ([string]::IsNullOrWhiteSpace($relDir)) { $relDir = '.' }
      if (-not $filesByDir.ContainsKey($relDir)) { $filesByDir[$relDir] = New-Object System.Collections.Generic.List[string] }
      $filesByDir[$relDir].Add($relFile)
    }
  }
}

# Deduplicate file lists
foreach ($k in @($filesByDir.Keys)) {
  $filesByDir[$k] = [System.Collections.Generic.List[string]]([string[]]($filesByDir[$k] | Sort-Object -Unique))
}

# ---------- Show plan ----------
Write-Host "SFTP deploy to $UserName@$($HostName)"
Write-Host "Port:       $Port"
Write-Host "Remote dir: $RemoteDir"
Write-Host "Local root: $LocalRoot"
if ($dirsToPush.Count -gt 0) {
  Write-Host "`nDirectories (recursive):"
  $dirsToPush | Sort-Object | ForEach-Object { Write-Host "  - $_" }
}
if ($filesByDir.Count -gt 0) {
  Write-Host "`nFiles:"
  foreach ($dir in ($filesByDir.Keys | Sort-Object)) {
    foreach ($f in $filesByDir[$dir]) { Write-Host "  - $f" }
  }
}
if ($Preview) { Write-Host "`n[Preview] No changes made."; return }

# ---------- Build SFTP batch script ----------
$batch = New-TemporaryFile
$lines = New-Object System.Collections.Generic.List[string]

# cd to local root and remote base
$lines.Add("lcd `"$LocalRootPosix`"")
$lines.Add("cd `"$RemoteDir`"")

# Ensure each needed remote subdir exists (via ssh first; sftp lacks -p)
if ($hasSsh) {
  $subdirs = @()
  $subdirs += $dirsToPush
  $subdirs += $filesByDir.Keys
  $subdirs = $subdirs | Where-Object { $_ -ne '.' } | Sort-Object -Unique
  foreach ($sd in $subdirs) {
    $remoteSub = To-Posix (Join-Path $RemoteDir $sd)
    $mk = "mkdir -p `"$remoteSub`""
    & $SshExe -o "StrictHostKeyChecking=no" -o "Port=$Port" -o "IdentityFile=$KeyPath" "$UserName@$($HostName)" $mk | Out-Null
  }
}

# Queue directory uploads (recursive)
foreach ($relDir in ($dirsToPush | Sort-Object)) {
  $srcDir = To-Posix (Join-Path $LocalRoot $relDir)
  $lines.Add("put -r `"$srcDir`" .")
}

# Queue file uploads (preserve relative directories)
foreach ($dir in ($filesByDir.Keys | Sort-Object)) {
  $remoteTarget = if ($dir -eq '.') { '.' } else { To-Posix (Join-Path $RemoteDir $dir) }
  foreach ($relFile in $filesByDir[$dir]) {
    $srcFile = To-Posix (Join-Path $LocalRoot $relFile)
    if ($dir -eq '.') {
      $lines.Add("put `"$srcFile`" .")
    } else {
      # Put file into its relative remote directory
      $lines.Add("put `"$srcFile`" `"$remoteTarget/`"")
    }
  }
}

$lines | Set-Content -Encoding ASCII -Path $batch.FullName

# ---------- Run SFTP (correct arg order: options FIRST, destination LAST) ----------
Write-Host "`nStarting SFTP..."
$SftpArgs = @(
  '-o', 'StrictHostKeyChecking=no',
  '-i', $KeyPath,
  '-P', $Port
)
# -b must appear BEFORE the destination (Windows OpenSSH requirement)
& $SftpExe @SftpArgs -b $batch.FullName "$UserName@$($HostName)" 2>&1 | ForEach-Object { $_ }
$code = $LASTEXITCODE
Remove-Item $batch.FullName -Force -ErrorAction SilentlyContinue

if ($code -ne 0) {
  throw "SFTP failed with exit code $code."
}

Write-Host "Deployment complete."
