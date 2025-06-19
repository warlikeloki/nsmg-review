# Neil Smith Media Group Website

**Author**: Neil Smith
**Year**: 2025

This purpose of this site is to act as the official site of Neil Smith Media Group, a media and technology company in Virginia, USA.
The intended domain is https://neilsmith.org

The site was created by Neil Smith, beginning in 2025. It is written in HTML, CSS, & JS with PHP and SQL.
All content of the site is property of Neil Smith and/or Neil Smith Media Group, unless otherwise annotated.

to update the ISSUES.md file, use the following in powershell:
'python update_issues.py issues.tsv ISSUES.md'

## Utility Scripts Usage

- **Find Unused CSS:**
  1. Save `find-unused-css.ps1` to your project folder.
  2. Run in PowerShell:
      ```powershell
      .\scripts\find-unused-css.ps1
      ```
  3. Review the output for unused stylesheets.

- **Check for Broken Internal Links:**
  1. Save `check-broken-links.ps1` to your project folder.
  2. Run:
      ```powershell
      .\scripts\check-broken-links.ps1
      ```

- **List CSS Variables:**
  1. Save `list-css-variables.ps1` to your project folder.
  2. Run:
      ```powershell
      .\scripts\list-css-variables.ps1
      ```

- **Optimize Images:**
  1. Install Node.js.
  2. In terminal:
      ```sh
      npx imagemin images/* --out-dir=images/optimized
      ```
  3. Find optimized images in `/images/optimized/`.

- **Lint HTML:**
  1. Install Node.js.
  2. In terminal:
      ```sh
      npx htmlhint "**/*.html"
      ```
## Web Utility Scripts – Usage

- **Find Unused Images**
    1. Save as `find-unused-images.ps1`.
    2. Run: `.\scripts\find-unused-images.ps1`

- **Batch Lowercase All Image Filenames**
    1. Save as `lowercase-image-filenames.ps1`.
    2. Run: `.\scripts\lowercase-image-filenames.ps1`

- **List All TODO/FIXME/BUG Comments**
    1. Save as `list-todos.ps1`.
    2. Run: `.\scripts\list-todos.ps1`

- **Find Unused JS Files**
    1. Save as `find-unused-js.ps1`.
    2. Run: `.\scripts\find-unused-js.ps1`

- **Count Classes and IDs**
    1. Save as `count-classes-ids.ps1`.
    2. Run: `.\cscripts\count-classes-ids.ps1`
# Utility Scripts

- **Find HTML files missing a <title>**
    1. Save as `find-missing-title.ps1`
    2. Run: `.\scripts\find-missing-title.ps1`

- **Find missing images referenced in HTML**
    1. Save as `find-missing-images.ps1`
    2. Run: `.\scripts\find-missing-images.ps1`

- **List all external JS/CSS assets**
    1. Save as `list-external-assets.ps1`
    2. Run: `.\scripts\list-external-assets.ps1`

- **Find folders with more than 20 files**
    1. Save as `find-large-folders.ps1`
    2. Run: `.\scripts\find-large-folders.ps1`

This is to test the CI/CD things. It will be deleted later.