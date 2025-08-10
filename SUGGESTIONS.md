# NSMG Code Review Suggestions (Public Mirror)
_Last updated: 2025-08-09_

> Scope: This review covers the files and layout visible in your public mirror and the pages you shared. Items are grouped by path. Each list is actionable and uses checkboxes so you can track progress locally.

---

## Root HTML & Shared Partials

### `/index.html`
- [ ] Add a `<meta name="robots" content="noindex, nofollow">` **for dev builds** to prevent accidental indexing; remove/override in prod.
- [ ] Keep `<script type="module" src="/js/main.js" defer>` and ensure `main.js` null-checks elements before DOM queries.
- [ ] Services accordion: add full keyboard support (ArrowUp/Down, Home/End), correct `aria-controls`, toggle `aria-expanded`, and a roving tab index.
- [ ] Add explicit `width`/`height` or `aspect-ratio` for hero/preview images to reduce CLS.
- [ ] Replace inline `fetch('/header.html')`/`fetch('/footer.html')` with a tiny loader that handles fetch failures (render minimal fallback).
- [ ] Lazy/perf: `loading="lazy"`, `decoding="async"`, `fetchpriority="low"` for injected thumbnails; reserve high priority only for LCP image.
- [ ] Add `prefetch`/`preload` for the next likely route (e.g., `/services.html`).
- [ ] Buttons-as-links: keep as `<a>`; only use `role="button"` if necessary; add `rel` on external links.

### `/header.html` and `/footer.html`
- [ ] Exactly one `<h1>` per page (do not place `<h1>` in header).
- [ ] Add `aria-current="page"` on the active nav link.
- [ ] Include a “Skip to main content” link to `#homepage`/`#main`.
- [ ] Footer: add Organization schema (JSON-LD), consistent contact data, and `rel="me"` for social profile links.

### `/404.html`, `/500.html`
- [ ] Provide navigation back to home and search link (if you have search).
- [ ] Add `noindex` meta and ensure correct HTTP status is returned.

### `/sitemap.xml`
- [ ] Exclude admin/tests/scripts/etc., and non-indexable pages/partials (`header.html`, `footer.html`, `404.html`, `500.html`). Generate via `generate-sitemap.js`.

### `/robots.txt` (add if missing)
- [ ] **Dev:** block all crawling. **Prod:** allow all except `/admin/` and include `Sitemap: https://neilsmith.org/sitemap.xml`.

---

## About/Legal Pages

### `/about-us/about.html`
- [ ] Ensure descriptive `alt` text for logos and staff photos.
- [ ] Wrap each person in semantic `<article>`; optional Person schema for rich results.
- [ ] Add Breadcrumb JSON-LD (`BreadcrumbList`) for deeper paths like `/about-us/`.

### `/privacy.html`, `/terms-conditions.html`
- [ ] Confirm unique `<title>` and `<meta name="description">`.
- [ ] Link from footer; reflect `lastmod` in sitemap.
- [ ] Include “last updated” date and a contact method.

---

## Services / Portfolio / Blog

### `/services.html` and `/services/*`
- [ ] Stable `id` anchors for subsections to match sidebar/accordion links.
- [ ] Add structured data (`Service` / `LocalBusiness`) where useful.

### `/portfolio.html` and `/gallery/*`
- [ ] Use responsive images (`srcset`/`sizes` or `<picture>` with webp/avif).
- [ ] Keyboard navigation and visible focus for lightbox/carousel.
- [ ] `alt` text describes the scene (avoid keyword stuffing).

### `/blog.html`, `/blog-post.html`
- [ ] JSON-LD `BlogPosting` per post, canonical link, and Open Graph/Twitter meta.
- [ ] `<time datetime="...">` for post dates.
- [ ] Prev/next links and categories/tags if you’ll expand.

---

## Admin Area (`/admin/*`)

### `/admin/admin.php`
- [ ] Keep the session gate at the top. Harden sessions:
  - [ ] `session.cookie_httponly=1`, `session.cookie_secure=1` (HTTPS), `SameSite=Lax`
  - [ ] `session.use_strict_mode=1`, regenerate ID on login
  - [ ] Add security headers (PHP or server):  
        `Content-Security-Policy: default-src 'self'`  
        `X-Frame-Options: DENY`  
        `X-Content-Type-Options: nosniff`  
        `Referrer-Policy: no-referrer-when-downgrade`  
        `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - [ ] `<meta name="robots" content="noindex, nofollow">` on all admin pages
- [ ] Left-nav: event delegation; update focus/ARIA when switching sections.
- [ ] `/php/admin_logout.php`: destroy session and clear cookies securely.
- [ ] Add CSRF tokens for any state-changing POSTs.

### `/admin/equipment.html`, `/admin/accounting.html`
- [ ] Upgrade from static tables to CRUD UI (fetch with pagination; debounced search).
- [ ] Backend endpoints under `/php/*`: always validate/sanitize; use prepared statements.
- [ ] Accessibility: `scope="col"`, `<caption>`, meaningful captions.
- [ ] Add CSV import/export with server-side validation.
- [ ] Audit fields in DB: `created_by`, `updated_by`, `updated_at`.

### `/admin/login.html` (if planned)
- [ ] Rate limit attempts; `password_hash()/password_verify()`.
- [ ] Rotate session ID on success; generic failure message.
- [ ] Inputs with `autocomplete="username"` and `autocomplete="current-password"`.

---

## PHP Endpoints (`/php/*`)
- [ ] Centralize DB connection and prepared statements; never interpolate user input in SQL.
- [ ] Escape output with `htmlspecialchars` when echoing into HTML.
- [ ] JSON endpoints: validate method & `Content-Type`, return proper status codes.
- [ ] Disable verbose errors in prod; log errors server-side.
- [ ] Consider a small `index.php` router to set headers and handle 404s consistently.

---

## Stylesheets (`/css/*`)
- [ ] Add a base reset/normalize; define design tokens (CSS variables) in `:root` (colors, spacing, fonts).
- [ ] Use `clamp()` for fluid type/spacing; respect `prefers-reduced-motion`.
- [ ] High-contrast focus styles; avoid `outline: none` without replacement.
- [ ] Split layout vs component styles; prefer BEM-ish naming to avoid specificity issues.
- [ ] Remove unused CSS (purge list via tooling), then minify for prod; hashed filenames if/when bundling.
- [ ] Mobile-first media queries; consistent breakpoint scale.

---

## JavaScript (`/js/*`)
- [ ] Keep modules side-effect free; export helpers; let a single `main.js` orchestrate.
- [ ] Defensive DOM: null-check selectors; wrap `fetch` in `try/catch` with visible errors.
- [ ] Performance: `IntersectionObserver` for lazy sections; batch DOM writes to avoid layout thrash.
- [ ] Accessibility: keyboard handling for accordions/menus/sliders; focus traps for modals; correct ARIA toggles.
- [ ] Fetch hygiene: timeouts/AbortController; respect ETag/Last-Modified; handle 304s.
- [ ] Security: never inject unsanitized HTML; sanitize if needed.
- [ ] If size grows, consider a light bundler (esbuild/rollup) for tree-shaking + minification.

---

## JSON Data (`/json/*`)
- [ ] Document a mini schema per file (`id`, `title`, `slug`, `created`, `updated`, `status`).
- [ ] Dates in ISO 8601 UTC; include a `version` if schema may change.
- [ ] Validate JSON on build (Node script that parses all JSON and fails CI if invalid).
- [ ] Prefer fetching JSON and hydrating vs large inline blobs in HTML.

---

## Scripts (`/scripts/*` & `generate-sitemap.js`)
- [ ] `generate-sitemap.js`: args `--base`, `--root`, `--out`; exclude `/admin`, `/tests`, `/sql`, `/scripts`, `/js`, `/css`, `/json`, `/media`, `.github`, and `header.html`, `footer.html`, `404.html`, `500.html`.
- [ ] Add `--dev` flag → writes `sitemap.dev.xml` and uses localhost base; `--prod` for live base.
- [ ] Wrap with try/catch and friendly errors (missing deps, bad base URL).
- [ ] Add npm scripts to run dev/prod generation.

---

## Apache / `.htaccess`
- [ ] Security headers (`CSP`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
- [ ] Cache rules: long cache for versioned assets; shorter for HTML. Enable gzip/br if supported.
- [ ] Redirects for canonical host/trailing slashes; robust 404 handling.
- [ ] `Options -Indexes` to block directory listing.

---

## Node / `package.json`
- [ ] Add scripts:
  - [ ] `"lint:html": "htmlhint \"**/*.html\""`, `"lint:css": "stylelint \"**/*.css\""`, `"lint:js": "eslint \"**/*.js\""`
  - [ ] `"sitemap:dev": "node ./generate-sitemap.js -base http://localhost:8080 -root . -out sitemap.dev.xml"`
  - [ ] `"sitemap:prod": "node ./generate-sitemap.js -base https://neilsmith.org -root . -out sitemap.xml"`
- [ ] Only set `"type": "module"` if converting scripts to ESM; otherwise stay CommonJS.
- [ ] Add Prettier and `.editorconfig` for consistent formatting.

---

## PHP / `composer.json`, `phpunit.xml`
- [ ] Pin PHP version & extensions; add PSR-12 (`squizlabs/php_codesniffer`).
- [ ] If not using PHPUnit yet, remove `phpunit.xml` or add a smoke test.
- [ ] Consider `vlucas/phpdotenv` for local dev (don’t commit `.env`).

---

## Tests (`/tests`)
- [ ] If Cypress is being removed, delete `/cypress` and references.
- [ ] If keeping tests, document how to run them and wire to CI.

---

## SEO & Analytics
- [ ] Add OG/Twitter meta defaults across pages and a site-wide image.
- [ ] Canonical URLs; avoid dupes with/without trailing slash.
- [ ] When live, add privacy-friendly analytics (with IP anonymization) + cookie/banner if needed.

---

## Accessibility (global)
- [ ] WCAG AA color contrast.
- [ ] Visible focus states; keyboard-only nav works everywhere.
- [ ] `lang` on `<html>` and meaningful `<title>` per page.
- [ ] Use landmark elements (`<header>`, `<nav>`, `<main>`, `<footer>`).

---

## Performance (global)
- [ ] Optimize images (webp/avif), lazy-load non-critical assets.
- [ ] Consider inlining critical CSS for above-the-fold; defer non-critical CSS.
- [ ] Only preconnect to origins you actually use.
- [ ] Run Lighthouse and fix big offenders (CLS/LCP/TTI). Optionally commit results to `/docs/metrics/`.

---

## Security (global)
- [ ] Keep secrets out of repo; use env and server config.
- [ ] `/admin` and any PHP endpoints must check session and use CSRF where applicable.
- [ ] Validate all input; sanitize all output; rate-limit + log.

---

## Nice-to-haves
- [ ] Add issue/PR templates, `CODEOWNERS`, and `SECURITY.md`.
- [ ] Add `CONTRIBUTING.md` with branch naming and commit style.
- [ ] Add a GitHub Action for HTML/CSS/JS lint + PHP syntax check.

---

### Notes
- If you want, I can turn any section into a PR with concrete code changes (e.g., harden admin headers, upgrade the accordion for A11y, wire up `generate-sitemap.js` with proper excludes).