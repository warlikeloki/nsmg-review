Get-ChildItem -Recurse -Include *.jpg,*.jpeg,*.png,*.gif,*.svg | ForEach-Object {
    $lower = $_.FullName.ToLower()
    if ($_.FullName -ne $lower) {
        Rename-Item $_.FullName $lower
    }
}
Write-Host "All image filenames converted to lowercase."
