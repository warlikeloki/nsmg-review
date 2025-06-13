Get-ChildItem -Recurse -Include *.html,*.css,*.js,*.php | ForEach-Object {
    Select-String -Path $_.FullName -Pattern "TODO|FIXME|BUG" | ForEach-Object {
        "$($_.Filename):$($_.LineNumber): $($_.Line)"
    }
} | Write-Host
