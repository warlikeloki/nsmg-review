# NSMG Project Summary
_Last updated: 2025-08-09_

Neil Smith Media Group (NSMG) is a content-focused site offering photography, videography, and editing services, with an **admin area** for internal management and a public marketing website. This document summarizes repos, architecture, workflows, and the current plan of record.

---

## Repositories & Branches
- **Private repo**: primary development (contains workflows and secrets).  
  - Default branch: `main`
  - Working branch: `review-shared` (feature/integration)
- **Public mirror**: `warlikeloki/nsmg-review` (read-only mirror for external review).
- **Branching model**: feature branches off `main` (e.g., `feat/...`, `fix/...`). Use PRs; protected branches block direct pushes (see `REPO_HARDENING.md`).

---

## Tech Stack
- **Frontend**: HTML5, CSS3, vanilla ES modules (with `/js/main.js` orchestrator), accessibility-first components (accordions, carousels).
- **Backend**: PHP (admin dashboard, future JSON endpoints under `/php`), session-based auth.
- **Tooling**:
  - Node.js (local scripts) — **no external deps** for sitemap generator.
  - PowerShell-first scripts (Windows friendly), e.g., Jira exporter.
- **Data**: JSON files for content stubs; SQL scripts for table setup (no real data committed).

---

## Key Directories
- `/admin` — Admin UI (HTML/PHP), e.g., `admin.php`, `equipment.html`, `accounting.html`.
- `/about-us`, `/services`, `/portfolio`, `/blog` — Public pages.
- `/css`, `/js`, `/media` — Static assets.
- `/php` — (Planned/partial) JSON endpoints and session handling.
- `/scripts` — Utility scripts (e.g., `generate-sitemap.js`, `Export-Jira.ps1`).
- `/docs` — Project docs (`SUGGESTIONS.md`, SEO plan, Jira snapshots if mirrored).

---

## Environment Targets
- **Dev**: localhost (PHP built-in server or host of choice), `robots` fully blocked, `sitemap.dev.xml`.
- **Prod**: eventual domain **`neilsmith.org`**, `robots.txt` with exclusions, gzip’d `sitemap.xml`.

---

## Security & Governance
- **Branch protection**: PR-only merges, Code Owners required, disallow force/deletions, include admins. (See `REPO_HARDENING.md`.)
- **Secret hygiene**: No secrets in repo. Use GitHub Secrets (private repo) for tokens (e.g., Jira).
- **Admin hardening (in progress)**: secure sessions, CSRF for POST, security headers (CSP, XFO, etc.).
- **Scanning (recommended)**: enable Dependabot alerts/updates, secret scanning with push protection, CodeQL (JS/TS). Consider PHP static analysis later.

---

## SEO & Sitemap
- **Script**: `scripts/generate-sitemap.js` (dependency-free).
  - Dev:  
    ```powershell
    node .\scripts\generate-sitemap.js -base http://localhost:8080 -root . -out sitemap.dev.xml --dev --robots robots.dev.txt
    ```
  - Prod (when live):  
    ```powershell
    node .\scripts\generate-sitemap.js -base https://neilsmith.org -root . -out sitemap.xml --prod --gzip --robots robots.txt
    ```
- **Global meta**: unique titles/descriptions, OG/Twitter defaults, canonicals per page.
- See `docs/SEO_SITEMAP_PLAN.md` for the full checklist.

---

## Workflows (CI/CD)
- **Jira → Markdown mirror (private repo)**: PowerShell exporter creates `/docs/jira/issues-latest.md` and optional dated snapshots.  
  _Status_: configured locally; **GitHub Action temporarily paused** until token-endpoint choice is finalized.
- **Planned CI**:
  - HTML/CSS/JS linters and PHP syntax check on PRs.
  - Mark lint/build checks as **required status checks** in branch protection.

---

## Current Status (High-level)
- ✅ README refreshed and committed.
- ✅ `SUGGESTIONS.md` published with file-by-file improvements.
- ✅ Repo hardening guide created (`REPO_HARDENING.md`).
- ✅ SEO/Sitemap script and checklist drafted.
- 🚧 Admin hardening (sessions, CSRF, headers) — to implement.
- ⏸️ Jira mirror workflow — awaiting token style decision (classic vs scoped).

---

## Roadmap (Next Steps)
- [ ] **Admin security pass**: secure session settings, logout route, CSRF tokens, default security headers.
- [ ] **Accessibility**: keyboard support for accordions and carousels; focus styles; skip links.
- [ ] **Performance**: image formats (webp/avif), explicit width/height, lazy-loading, Lighthouse fixes.
- [ ] **Sitemap/robots**: wire npm scripts; verify excludes; prepare for domain flip to `neilsmith.org`.
- [ ] **CI linting**: add HTMLHint/ESLint/Stylelint and PHP syntax checks; mark as required in branch protection.
- [ ] **Jira mirror**: re-enable workflow (choose classic vs scoped token; set secrets; run daily).

---

## Handy Commands (PowerShell)
- Run dev PHP server:
  ```powershell
  php -S localhost:8080 -t .
  ```
- Generate dev sitemap + robots:
  ```powershell
  node .\scripts\generate-sitemap.js -base http://localhost:8080 -root . -out sitemap.dev.xml --dev --robots robots.dev.txt
  ```
- Generate prod sitemap + robots (when live):
  ```powershell
  node .\scripts\generate-sitemap.js -base https://neilsmith.org -root . -out sitemap.xml --prod --gzip --robots robots.txt
  ```

---

## Reference Docs
- `README.md` — project setup and usage
- `SUGGESTIONS.md` — file-by-file improvement checklist
- `REPO_HARDENING.md` — public repo security
- `docs/SEO_SITEMAP_PLAN.md` — SEO + sitemap strategy
- `docs/jira/issues-latest.md` — latest Jira snapshot (if mirrored)
- `TODO.md` / `ISSUES.md` — project tasks (high-level; Jira is source of truth)

If anything in here drifts, ping me and I’ll refresh this summary again.