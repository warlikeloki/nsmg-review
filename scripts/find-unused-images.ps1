$imgFiles = Get-ChildItem -Recurse -Include *.png,*.jpg,*.jpeg,*.gif,*.svg -Path .\images\ | Select-Object -ExpandProperty FullName
$htmlCssFiles = Get-ChildItem -Recurse -Include *.html,*.css -Path . | Select-Object -ExpandProperty FullName

$unused = @()
foreach ($img in $imgFiles) {
    $imgName = Split-Path $img -Leaf
    $isUsed = $false
    foreach ($file in $htmlCssFiles) {
        if (Select-String -Path $file -Pattern $imgName -Quiet) {
            $isUsed = $true
            break
        }
    }
    if (-not $isUsed) { $unused += $img }
}
Write-Host "Unused image files:`n"
$unused | ForEach-Object { Write-Host $_ }
