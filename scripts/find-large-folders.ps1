# find-large-folders.ps1
$projectRoot = Resolve-Path "$PSScriptRoot\.."
$folders = Get-ChildItem -Path $projectRoot -Recurse -Directory

foreach ($folder in $folders) {
    $fileCount = (Get-ChildItem -Path $folder.FullName -File).Count
    if ($fileCount -gt 20) {
        Write-Host "$($folder.FullName): $fileCount files"
    }
}
