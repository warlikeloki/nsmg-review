# Neil Smith Media Group — Website

_Updated: 2025-08-26

Public marketing site with dynamic sections (Services, Blog, Portfolio) and an Admin area. Front end is **static HTML/CSS/JS** with modular ES modules; backend uses **light PHP** endpoints for data and form handling. **GitHub Actions** handles deploys. **Jira** is the system of record for issues/sprints/epics.

---

## Contents
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Environment & Secrets](#environment--secrets)
- [Admin Auth (NSM-82)](#admin-auth-nsm-82)
- [Testing & QA](#testing--qa)
- [Issues & Workflow](#issues--workflow)
- [Deployment](#deployment)
- [Maintenance & Ops](#maintenance--ops)
- [Roadmap & Sprints](#roadmap--sprints)
- [Release Checklist](#release-checklist)
- [Contributing](#contributing)
- [License](#license)

---

## Getting Started

### Prerequisites
- [ ] **Git**
- [ ] **PHP 8+** (for `/php/*.php` endpoints and local server)
- [ ] **NodeJS (optional)** — only if you use extra tooling; not required for basic dev
- [ ] **VS Code** (recommended) with HTML, PHP, and Markdown extensions

### Quick start (serve locally)
```powershell
# From repo root
php -S 127.0.0.1:8000 -t .
# Visit http://127.0.0.1:8000
```
> VS Code “Live Server” is fine for static pages, but PHP endpoints still require the PHP built‑in server above.

---

## Project Structure
```
/
├─ index.html
├─ header.html
├─ footer.html
├─ about-us/                 # About, Contact, Privacy, Terms, etc.
├─ admin/                    # Admin UI pages (authentication required)
├─ css/
│  ├─ navigation.css
│  ├─ homepage.css
│  └─ ... (component/page styles)
├─ js/
│  ├─ main.js                # Bootstraps header/footer, module auto-init
│  └─ modules/
│     ├─ navigation.js
│     ├─ homepage.js
│     ├─ blog.js
│     ├─ blog-post.js
│     ├─ testimonials.js
│     ├─ equipment.js
│     ├─ pricing.js
│     ├─ contact.js
│     ├─ other-services.js
│     ├─ services-nav.js
│     └─ portfolio.js
├─ media/
│  ├─ icons/                 # svg/png icons
│  └─ logos/                 # brand assets (use lowercase filenames/paths)
├─ php/
│  ├─ auth/                  # login/logout handlers (NSM-82)
│  ├─ get_services.php
│  ├─ ... other endpoints ...
│  └─ config.local.php       # NOT IN GIT; local secrets (see below)
├─ scripts/
│  └─ Build-IssuesFromApi.ps1# Sync ISSUES.md from Jira
└─ .github/
   └─ ISSUE_TEMPLATE/
      ├─ bug.md
      ├─ feature.md
      └─ config.yml          # “Create in Jira” buttons
```

---

## Local Development

### 1) Create local PHP config (DB, options)
Create **`php/config.local.php`** (do **not** commit):

```php
<?php
// php/config.local.php (example)
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'nsmg');
define('DB_USER', 'nsmg_local');
define('DB_PASS', 'CHANGE_ME');

// Optional session config (overrides)
define('SESSION_NAME', 'nsmg_admin');
define('SESSION_SECURE', true); // HTTPS only
```

Your PHP endpoints should include it if present:
```php
$local = __DIR__ . '/config.local.php';
if (file_exists($local)) { require_once $local; }
```

### 2) Run a local server
```powershell
php -S 127.0.0.1:8000 -t .
```

### 3) Verify modules
- [ ] Header/footer load (via `main.js` partials)
- [ ] Homepage services render
- [ ] Testimonials carousel shows items
- [ ] Blog list/post pages fetch (if enabled)
- [ ] Contact form posts to `/php/...` (use a local stub if needed)

---

## Environment & Secrets
- **Never commit secrets.** Keep DB creds and admin password in `php/config.local.php` (local) and secure env on prod.
- **Case-sensitive assets:** Use **lowercase** filenames/paths for everything under `/media`, `/css`, `/js`. (See **NSM-116**.)
- **Security headers & CSP:** Baseline headers (NSM-123) and a CSP moving from Report‑Only to Enforced (NSM-117) are tracked issues.

---

## Admin Auth (NSM-82)
Sprint 6 introduces:
- **Login** `/admin/login.html` → `/php/auth/login.php`
- **Session management**: cookie flags (**HttpOnly**, **Secure**, **SameSite=Lax**), idle timeout, absolute lifetime; rotate session ID on login
- **CSRF**: per‑session token; verified on all state‑changing POSTs
- **Guard**: reusable `auth_guard.php` included at the top of every protected admin page and `/php/*` endpoint
- **Logout**: invalidates session and clears cookie

> Until NSM‑82 is finished, restrict admin/phpMyAdmin at the host/network level (allowlists).

---

## Testing & QA

### Manual checks (high value)
- [ ] **Mobile nav**: drawer open/close, submenus, services dashboard menu (NSM-103/104)
- [ ] **Forms**: success/error flows; user‑friendly messages; no console errors (NSM-21)
- [ ] **A11y**: keyboard focus; skip link to `#main`; headings/labels (NSM-14)
- [ ] **Perf**: hero images optimized; caching behaving (NSM-31, NSM-120)

### Automated (planned/adding)
- **CI gates**: axe-core + Lighthouse CI (NSM-119)
- **Broken links**: CI + weekly crawl (NSM-125)
- **Error tracking**: Sentry (or similar) FE + PHP (NSM-118)

---

## Issues & Workflow

### Jira is the source of truth
- **New issues**: Use Jira. GitHub **New issue** shows **“Create a Bug/Feature in Jira”** (configured in `/.github/ISSUE_TEMPLATE/config.yml`).
- **Footer links**: The site footer contains **Report a bug** / **Request a feature** links that deep‑link to Jira create pages (NSM‑105).

### Keep `ISSUES.md` in sync from Jira
```powershell
# From repo root
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\scripts\Build-IssuesFromApi.ps1 -ProjectKey "NSM" -OutPath ".\ISSUES.md"
```
_Add a timestamp line in the script if desired:_
```powershell
$lines.Insert(1, "_Generated from Jira on $(Get-Date -Format 'yyyy-MM-dd')_")
```

### Branch & PR guidelines
- Branch names: `feat/...`, `fix/...`, `chore/...`; include Jira key, e.g., `feat/footer-jira-links-NSM-105`
- Commit messages: reference Jira key in the subject, e.g.  
  `feat(footer): add Jira bug/feature links (NSM-105)`
- Link PRs to Jira tickets (Development panel).

---

## Deployment
- Deployed via **GitHub Actions** (`.github/workflows/deploy.yml`).
- Prefer **OIDC** for short‑lived deploy credentials over static keys (tracked under security epics).
- Ensure assets keep **lowercase** names to avoid case‑sensitive 404s (NSM‑116).

**Typical flow**
1. Open PR → checks pass
2. Merge to `main`
3. GitHub Action deploys to host (cPanel/FTP/rsync, per workflow)

---

## Maintenance & Ops
- **Backups**: Nightly DB + `/media` with retention; perform restore drill (NSM‑122)
- **Security headers**: HSTS, X‑CTO, XFO/FO, Referrer‑Policy, Permissions‑Policy (NSM‑123)
- **CSP**: Start **Report‑Only**, fix violations, then **Enforce** (NSM‑117)
- **Consent**: GA4 Consent Mode or cookie gating as appropriate (NSM‑124)
- **Monitoring**: Error tracking for FE + PHP (NSM‑118); broken‑link monitoring (NSM‑125)

---

## Roadmap & Sprints
- Cadence: **3‑week sprints**; Sprint 6 begins Sep 1, 2025.
- Epics (created as NSM‑106 → NSM‑115):
  - Security & Access Hardening (NSM‑106)
  - Application Security & Authentication (NSM‑107)
  - Mobile Navigation & UX (NSM‑108)
  - Forms & Conversion Flows (NSM‑109)
  - Performance & Caching (NSM‑110)
  - SEO & Metadata (NSM‑111)
  - Content & Publishing (NSM‑112)
  - Admin Console & Settings (NSM‑113)
  - Accessibility & Quality (NSM‑114)
  - Analytics & Feedback (NSM‑115)

See **`ISSUES.md`** for current Open/Closed lists (synced from Jira).

---

## Release Checklist
- [ ] **CI passes** for build/lint/tests (where applicable)
- [ ] **CSP** is in **Report‑Only** or **Enforced** as planned (NSM‑117); no broken pages
- [ ] **Security headers** present (HSTS, X‑CTO, XFO/FO, Referrer‑Policy, Permissions‑Policy) (NSM‑123)
- [ ] **Admin auth** enforced for admin pages and `/php/*` endpoints (NSM‑82)
- [ ] **Forms**: success/error flows verified; anti‑spam enabled (NSM‑21, NSM‑44)
- [ ] **Mobile nav**: drawer/submenus/services dashboard behave on iOS Safari & Android Chrome (NSM‑103/104)
- [ ] **Performance**: LCP/TBT within targets on mobile profile; responsive images in place (NSM‑31, NSM‑120)
- [ ] **SEO**: meta + JSON‑LD present; `sitemap.xml`/`robots.txt` current (NSM‑15, NSM‑121)
- [ ] **Analytics**: base tagging + consent behavior verified (NSM‑43, NSM‑124)
- [ ] **Error tracking**: frontend + PHP events received (NSM‑118)
- [ ] **Links**: no internal 404s; weekly link check green (NSM‑125)
- [ ] **Backups**: nightly job healthy; last restore drill documented (NSM‑122)
- [ ] **Footer Jira links**: render & open correctly (NSM‑105)

---

## Contributing
- Add/adjust **ARIA and focus states** for interactive elements.
- Keep filenames/paths **lowercase**.
- Avoid inline scripts/styles that CSP will block once enforced.
- Update docs if you add a new admin page or `/php/*` endpoint (auth guard + CSRF).

---

## License
Copyright © Neil Smith
