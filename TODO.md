# TODO — Remaining Work Only

> Updated after README refresh, deploy.yml removal, .gitignore hardening, and secret scan (no hits). This list removes items already marked **Done** and keeps only what still needs action.

## Testimonials

- [ ] Build `/testimonials.html` as a full list view with pagination/filtering; fetch from `/php/get_testimonials.php` (or JSON) with graceful error UI.
- [ ] Implement `/php/get_testimonials.php` (JSON response, pagination params, input sanitization).

## Global Styles & Layout

- [ ] Finish mobile polish on pages with sidebars (verify collapse/hide, spacing, `:focus-visible`, hit areas).
- [ ] Standardize `<head>` across pages (OG tags, robots, CSS order) via a shared include or PHP `include`.

## Equipment

- [ ] Admin: create `manage_equipment.html` with CRUD (list, create, edit, retire) and table accessibility (`<caption>`, `<th scope>`).
- [ ] Services pages: ensure equipment widget renders correctly on `photography.html`, `videography.html`, `editing.html`, `other-services.html`.

## Admin Dashboard & Backend

- [ ] Flesh out sidebar sections (Manage Posts, Manage Testimonials, Website Settings, Accounting, Invoicing, Service Requests).
- [ ] Add `/admin/website_settings.html` + backend to update site title, description, contact email, socials, logo (validate uploads).
- [ ] Add `<meta name="robots" content="noindex, nofollow">` to all `/admin/` pages and ensure session checks on PHP endpoints.

## Portfolio & Gallery

- [ ] Implement lightbox with keyboard (←/→) and focus trapping; add descriptive alts and `loading="lazy"`.
- [ ] Add category filters; ensure grid is responsive and maintains aspect ratios.

## Services Page / Pricing

- [ ] Finish `/services/pricing.html` updates and verify links from left sidebar.
- [ ] Decide whether pricing should be embedded dynamically on services dashboard (AJAX + JSON/PHP) or left as a static page.
- [ ] Currency formatting and validation for any inputs (server + client).

## Contact & Service Request

- [ ] Add HTML5 validation + JS fallback; honeypot or reCAPTCHA; ARIA live region for success/error.
- [ ] Implement `/php/service_request.php` (sanitize inputs, rate-limit, email/sendgrid optional).

## Footer & Navigation

- [ ] Verify active state accessibility and focus outlines; ensure Blog link is present if blog is public.

## Blog & Content

- [ ] `blog.html`: add client-side search/filter and pagination.
- [ ] `blog-post.html`: add canonical link, share buttons with `rel="noopener"`, and previous/next.

## Security & CI

- [ ] Keep secret scanning enabled; enable Dependabot and CodeQL in GitHub Security tab.
- [ ] Add CI workflow for linting (HTMLHint, Stylelint, ESLint, PHP_CodeSniffer) and optional link checking (lychee).

## Sitemap & Robots

- [ ] Regenerate sitemap excluding admin/tests/etc.; commit as `sitemap.dev.xml` during dev and `sitemap.xml` for prod.
- [ ] Add dev `robots.txt` (Disallow: /); add prod `robots.txt` (Disallow: /admin/ + Sitemap link).

## JavaScript Resilience

- [ ] Review all `fetch()` calls for `.catch()` handlers and user-friendly error states across homepage modules (services, testimonials, portfolio, blog).
- [ ] Avoid hardcoded item limits; centralize counts in config or query params.

## Cleanup

- [ ] Remove `/cypress` folder and config if you’re not using it; delete any references in `package.json`.
- [ ] Remove obsolete EC2 deploy files/secrets (already deleted workflow; confirm repo secrets cleared).

---

## Completed / No Longer Needed (recent updates)

- [x] README.md rewritten and committed.
- [x] Removed EC2 `deploy.yml` GitHub Action.
- [x] Public review mirror set up (`review-shared` → `public/main`).
- [x] `.gitignore` updated to ignore env/keys/logs.
- [x] Local secret scan run — no hits.