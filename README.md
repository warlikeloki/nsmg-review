# Neil Smith Media Group Website

> Public review mirror of the website for **Neil Smith Media Group**. Intended prod domain: **https://neilsmith.org** (not live yet).

Author: Neil Smith • Year: 2025

---

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Local Development](#local-development)
- [Quality Tooling](#quality-tooling)
- [Sitemap & SEO](#sitemap--seo)
- [Security & Privacy](#security--privacy)
- [Deployment Notes](#deployment-notes)
- [Scripts (PowerShell)](#scripts-powershell)
- [Testing](#testing)
- [Contributing / Branching](#contributing--branching)
- [License](#license)

---

## Overview
This repo contains the source for the Neil Smith Media Group website (HTML/CSS/JS with a PHP backend for admin/data endpoints). This is a **public mirror for code review** — no secrets or private data should be committed here.

**Status:** In active development. Site not live yet.

---

## Tech Stack
- **Frontend:** HTML5, CSS3, vanilla JS modules
- **Backend:** PHP (session-protected admin), simple JSON data
- **Data:** SQL table setup scripts (schema only)
- **Build/Automation:** Node.js scripts; PowerShell utilities
- **CI:** GitHub Actions (lint/check workflows as needed)

---

## Project Structure

```
/about-us/          Static pages (About, Privacy, Terms)
/admin/             Admin UI (session protected; should be noindex)
/css/               Stylesheets (global/layout/header/nav/page-specific)
/gallery/           Gallery page & assets
/js/                JS modules (navigation, homepage, forms, etc.)
/json/              JSON data (posts, testimonials, equipment, etc.)
/media/             Images/icons/logos (public-safe assets)
/php/               PHP endpoints & admin handlers
/ranked-choice/     Ranked-choice demo (create, vote, results)
/scripts/           Utility scripts (incl. sitemap generator)
/services/          Services pages (photography, videography, editing)
/sql/               Schema/migration snippets (no real data)
/tests/             Test scaffolding (remove if unused)

Root HTML pages: `index.html`, `blog.html`, `portfolio.html`, `services.html`, `contact.html`, etc.
Shared partials: `header.html`, `footer.html`
Config: `.gitignore`, `.htaccess`, `package.json`, `composer.json`, `phpunit.xml`, `sitemap.xml`
```

> Keep `/admin`, `/sql`, `/tests` public-safe (no secrets or real data).

---

## Getting Started

### Prerequisites
- [ ] **Node.js** ≥ 18 (`node -v`)
- [ ] **PHP** ≥ 8.1 (`php -v`)
- [ ] **Git** & **PowerShell** (Windows)

### Clone
```powershell
git clone https://github.com/warlikeloki/nsmg-review.git
cd nsmg-review
```

### Install optional tooling (linters/scripts)
```powershell
npm ci  # or: npm install
```

---

## Local Development

### Option A — PHP built-in server (recommended)
```powershell
# from repo root
php -S localhost:8080 -t .
# Open http://localhost:8080
```

### Option B — Static preview (HTML only)
Use VS Code “Live Server” (note: PHP endpoints won’t execute).

---

## Quality Tooling

### Lint HTML/CSS/JS (optional)
```powershell
npx htmlhint "**/*.html"
npx stylelint "**/*.css"
npx eslint "**/*.js"
```

### PHP standards/tests (optional)
```powershell
composer install        # if composer.json configured
vendor/bin/phpcs -q     # coding standards
vendor/bin/phpunit      # tests, if configured
```

---

## Sitemap & SEO

**Dev vs Prod**

- **Dev**: generate `sitemap.dev.xml` with localhost base; set global `<meta name="robots" content="noindex, nofollow">`; `robots.txt` should disallow all.
- **Prod**: generate `sitemap.xml` with the real domain; remove/override `noindex`; `robots.txt` should allow crawling and reference the sitemap.

**Generate sitemap**
```powershell
# Dev (local)
node .\generate-sitemap.js -base http://localhost:8080 -root . -out sitemap.dev.xml

# Prod (when live)
node .\generate-sitemap.js -base https://neilsmith.org -root . -out sitemap.xml
```

**Sitemap rules**
- Include only indexable `.html`
- Exclude: `/admin/`, `/tests/`, `/cypress/`, `/sql/`, `/scripts/`, `/js/`, `/css/`, `/json/`, `/media/`, `.github/`
- Skip: `header.html`, `footer.html`, `404.html`, `500.html`, `sitemap.html`, `sitemap.xml`
- Treat `index.html` as clean folder URLs (e.g., `/about-us/`)

**Robots**
- Dev `robots.txt`:
  ```
  User-agent: *
  Disallow: /
  ```
- Prod `robots.txt`:
  ```
  User-agent: *
  Disallow: /admin/
  Sitemap: https://neilsmith.org/sitemap.xml
  ```

---

## Security & Privacy

- [ ] No `.env`, API keys, or credentials in repo (use `.gitignore`)
- [ ] Admin pages behind **session auth** and include:
  ```html
  <meta name="robots" content="noindex, nofollow">
  ```
- [ ] `/sql` contains **schema only** (no real data)
- [ ] If a secret is ever committed, rotate it immediately and scrub history before pushing

---

## Deployment Notes

- EC2/Deploy workflow removed — this repo is a **review mirror** only.
- When you choose a host, document the steps here (build, upload, cache rules, PHP runtime, etc.).

---

## Scripts (PowerShell)

> Place scripts in `./scripts/` and run from repo root.

- **Find Unused CSS**
  ```powershell
  .\scripts\find-unused-css.ps1
  ```
- **Check Broken Internal Links**
  ```powershell
  .\scripts\check-broken-links.ps1
  ```
- **List CSS Variables**
  ```powershell
  .\scripts\list-css-variables.ps1
  ```
- **Find Unused Images**
  ```powershell
  .\scripts\find-unused-images.ps1
  ```
- **Lowercase Image Filenames**
  ```powershell
  .\scripts\lowercase-image-filenames.ps1
  ```
- **List All TODO/FIXME/BUG**
  ```powershell
  .\scripts\list-todos.ps1
  ```
- **Find Unused JS**
  ```powershell
  .\scripts\find-unused-js.ps1
  ```
- **Count Classes and IDs**
  ```powershell
  .\scripts\count-classes-ids.ps1
  ```
- **Find HTML missing `<title>`**
  ```powershell
  .\scripts\find-missing-title.ps1
  ```
- **Find Missing Images referenced in HTML**
  ```powershell
  .\scripts\find-missing-images.ps1
  ```
- **List external JS/CSS assets**
  ```powershell
  .\scripts\list-external-assets.ps1
  ```
- **Find folders with > 20 files**
  ```powershell
  .\scripts\find-large-folders.ps1
  ```

---

## Testing

- If keeping tests, document how to run them here (e.g., `phpunit`, browser tests, etc.).
- If not using Cypress anymore, remove `/cypress` & related config/scripts to keep the mirror tidy.

---

## Contributing / Branching

- **Private working repo:** continue normal development (`main` or feature branches).
- **Public mirror:** push curated branch (`review-shared`) → `public/main`.
- Use PRs for major changes (README, sitemap rules, admin policies) to keep a clean review trail.

---

## License

© Neil Smith / Neil Smith Media Group. All rights reserved unless otherwise noted.
