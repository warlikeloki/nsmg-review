param(
  [string]$Path = ".",
  [string]$Output = "TODO_AUTO.md"
)

# Collect all HTML files recursively
$files = Get-ChildItem -Path $Path -Recurse -Include *.html

# Prepare an array to hold the Markdown lines
$todos = @()

# Common template items for every page (use single-quoted strings to avoid escape issues)
$template = @(  
  '- [ ] Inject shared header and footer via fetch calls',
  '- [ ] Include and order CSS links (global, layout, header, navigation, page-specific, mobile, footer)',
  '- [ ] Add Open Graph meta tags in <head> (og:title, og:description, og:image, og:url)',
  '- [ ] Add <meta name="robots" content="index, follow">',
  '- [ ] Ensure <main> has an appropriate id and ARIA attributes',
  '- [ ] Mark empty <aside> elements with aria-hidden="true"',
  '- [ ] Verify all <a> links resolve to valid pages',
  '- [ ] Confirm key images have width/height attributes and consider WebP fallback',
  '- [ ] Test mobile responsiveness and sidebar behavior',
  '- [ ] Check keyboard accessibility and focus outlines'
)

foreach ($file in $files) {
  # Extract page title from <title> tag, fallback to filename
  $content = Get-Content $file.FullName -Raw
  if ($content -match '<title>(.*?)</title>') { $pageTitle = $matches[1] } else { $pageTitle = $file.Name }

  # Add section header
  $todos += "## $($file.Name) — $pageTitle"
  $todos += $template
  $todos += ""  # blank line between sections
}

# Export to Markdown file
$todos | Out-File -Encoding UTF8 -FilePath $Output
Write-Host "Generated TODO list at: $Output"