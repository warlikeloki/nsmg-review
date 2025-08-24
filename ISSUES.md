# Project Issues
_(No sprints; sorted by issue number.)_

## Open Issues
- **NSM-14** — Conduct Accessibility Audit
  - [ ] Audit with axe DevTools (or Lighthouse) on all key pages; export report.
  - [ ] Keyboard-only navigation covers menus, sliders, lightboxes; visible focus styles everywhere.
  - [ ] Color contrast passes WCAG AA (normal text ≥ 4.5:1; large text ≥ 3:1).
  - [ ] All images have meaningful `alt`; decorative images are `role=presentation` or empty `alt`.
  - [ ] Form labels are programmatically associated; error messages announced to screen readers.
  - [ ] Headings are hierarchical and unique per page; landmarks (header/main/nav/footer) present.
  - [ ] Fix all **High** and **Medium** severity findings; document remaining Low/Info with rationale.
  - [ ] Create short A11y checklist in `/docs/ACCESSIBILITY.md` and add to PR template.

- **NSM-15** — Add SEO Metadata & JSON-LD
  - [ ] Every page has unique `<title>` (50–60 chars) and meta description (120–160 chars).
  - [ ] Open Graph + Twitter Card tags present on shareable pages (home, services, blog, gallery).
  - [ ] JSON-LD added: `Organization`, `WebSite` (+ `SearchAction`), `BreadcrumbList`; `Article` on blog posts.
  - [ ] `sitemap.xml` generated and reachable; `robots.txt` references sitemap.
  - [ ] Canonical URLs defined; no duplicate content warnings in a crawl (e.g., ScreamingFrog).
  - [ ] 404 page returns HTTP 404; 500 page returns HTTP 500; both have helpful links.
  - [ ] Basic on-page checks: one H1 per document; images have descriptive `alt`; links are descriptive.
  - [ ] Document SEO standards in `/docs/SEO_GUIDE.md`.

- **NSM-16** — Dynamic Testimonials Page
  - [ ] Testimonials load dynamically from `testimonials.json` (or API when ready).
  - [ ] Cards show name, role (optional), truncated text with 'Read More' expand/collapse.
  - [ ] Client-side pagination or 'Load more' works and preserves scroll position.
  - [ ] Layout responsive from 360px to 1920px; no CLS on load (images sized).
  - [ ] A11y: cards focusable; expand/collapse uses `aria-expanded` and is keyboard operable.
  - [ ] Graceful fallback if data fails (retry + user message).
  - [ ] Unit test basic rendering and expand/collapse logic (if test harness available).

- **NSM-17** — Portfolio/Gallery Dynamic Loading
  - [ ] Images/items load from JSON or DB endpoint with fields: id, src, alt, title, category, tags.
  - [ ] Category filtering works (Photography/Videography/etc.); filter state reflected in URL (hash or query).
  - [ ] Lazy-loading and responsive images (`srcset`/sizes) implemented; LCP < 2.5s on broadband.
  - [ ] Lightbox supports captions and keyboard navigation (← → Esc).
  - [ ] Deep links open specific item and scroll to it when exiting lightbox.
  - [ ] Errors handled with user-friendly message and retry.
  - [ ] Unit test filter function and URL state sync (if test harness available).

- **NSM-18** — Harden Security & Configuration
  - [ ] All forms use server-side validation, prepared statements, and output encoding.
  - [ ] Security headers set: HSTS, CSP (script/style whitelists), X-Content-Type-Options, X-Frame-Options, Referrer-Policy.
  - [ ] Directory listing disabled; `.env`/secrets not publicly accessible.
  - [ ] Session security: secure/HttpOnly cookies; SameSite=Lax or Strict; session fixation prevented.
  - [ ] Error pages do not leak stack traces in production; logs store minimal PII.
  - [ ] Rate limiting or basic abuse controls for form endpoints (IP + user-agent heuristics).
  - [ ] Security checklist documented at `/docs/SECURITY_HARDENING.md`.

- **NSM-20** — Pricing Button: Show Tables & Hide Equipment Sidebar
  - [ ] Clicking Pricing in services view switches content to pricing tables without full page reload.
  - [ ] Equipment sidebar is hidden/collapsed while pricing is visible and restored when leaving.
  - [ ] No console errors; works in Chrome/Firefox/Edge/Safari (latest) and on mobile.
  - [ ] E2E test: navigate between tabs/states 10x without visual glitches or memory leaks.

- **NSM-21** — Service Request: Success Message on Valid Submission
  - [ ] On valid submit, user sees 'Thank you! Your request has been submitted.' without duplicate sends.
  - [ ] Client- and server-side validation errors shown inline; focus moves to first error.
  - [ ] Submission writes to storage (mock DB/JSON now; real DB later) with timestamp.
  - [ ] No PII in logs; user receives optional confirmation email (configurable).

- **NSM-24** — Modify Testimonial Cards
  - [ ] Card layout matches design spec; consistent spacing, typography, and avatar sizing.
  - [ ] Text truncation avoids mid-word breaks; 'Read More' expands with smooth animation.
  - [ ] RTL and long-name edge cases handled; no layout shift.
  - [ ] Cross-browser rendering parity confirmed.

- **NSM-25** — Add Testimonials to Homepage
  - [ ] Homepage shows 3–5 rotating testimonials with a link to the full testimonials page.
  - [ ] Rotation is pausable on hover and accessible via keyboard; no movement for reduced-motion users.
  - [ ] No CSS conflicts with full testimonials page styles.
  - [ ] Performance: carousel initializes under 150ms; no blocking main thread.

- **NSM-28** — Harden SSH & Deployment Security
  - [ ] SSH: key-based auth only; disable password auth & root login; change default SSH port or add port-knocking.
  - [ ] Firewall (e.g., UFW) allows 80/443 and SSH; Fail2Ban (or equivalent) enabled.
  - [ ] CI/CD deploy key uses least privilege; secrets stored in GitHub Actions as encrypted secrets.
  - [ ] Production deploys are atomic (temp dir + symlink swap or versioned folder).
  - [ ] phpMyAdmin restricted by IP or SSH tunnel; strong DB creds; no remote root.
  - [ ] File/dir perms: webroot 755/644 (or more restrictive); no writable code dirs by web server.
  - [ ] Run hardening checklist from `/docs/DEPLOYMENT_SECURITY.md` and record evidence.

- **NSM-30** — Portfolio Page Updates
  - [ ] Grid/gallery layout finalized; consistent card sizing and aspect ratios.
  - [ ] Header/footer fetched; no duplicate nav bars when embedded.
  - [ ] Copy and CTAs reviewed; links to gallery or contact where appropriate.
  - [ ] Mobile: 1–2 columns; Desktop: 3–4+ columns; no overflow.

- **NSM-31** — Gallery Page Updates
  - [ ] Integrate dynamic loader (shared with NSM-17) and lightbox.
  - [ ] Add category filters and search (if in scope) with instant feedback.
  - [ ] Performance budget: initial payload < 1MB; subsequent loads chunked.
  - [ ] A11y: focus trapping in lightbox; ESC closes; arrows navigate.

- **NSM-32** — Gallery: Keyboard & Arrow Navigation
  - [ ] Left/Right arrows move to prev/next item in lightbox; Home/End jump to first/last.
  - [ ] Focus is trapped within lightbox and returned to trigger on close.
  - [ ] `aria-live` polite announcements for slide changes (optional).
  - [ ] Works on desktop and mobile external keyboards; unit tests for handlers.

- **NSM-33** — Cross-Browser QA
  - [ ] Test matrix defined for Chrome/Edge/Firefox/Safari (latest + last), iOS Safari, Android Chrome.
  - [ ] Resolve all critical/major discrepancies; document minor cosmetic differences.
  - [ ] Automated checks via Playwright (if available) for smoke flows.
  - [ ] QA report stored in `/docs/QA_REPORT.md`.

- **NSM-34** — Admin Access (Login/Auth Flow)
  - [ ] Admin login with hashed passwords (Argon2 or bcrypt); CSRF tokens on forms.
  - [ ] Session management: inactivity timeout; secure/HttpOnly cookies.
  - [ ] Role-based access (admin vs standard user) gates management pages.
  - [ ] Audit log records admin actions (create/update/delete).
  - [ ] Brute force protection (cooldowns or captcha after N failures).

- **NSM-35** — Navigation: Tapping Same Parent Collapses Submenu
  - [ ] Mobile nav: tapping an already-open parent collapses its submenu.
  - [ ] Only one submenu open at a time (accordion behavior) unless spec says otherwise.
  - [ ] ARIA: `aria-expanded` and correct roles/states applied; keyboard support mirrors touch behavior.

- **NSM-36** — Create Manage Services Admin Panel
  - [ ] CRUD UI for services (title, description, category, price, image optional).
  - [ ] Validation (client/server); error handling; optimistic UI where reasonable.
  - [ ] Image upload with size/type checks; stored in `/media/services/` (or S3 later).
  - [ ] Filtering by category and search by title implemented.
  - [ ] Protected by admin auth (NSM-34); actions recorded in audit log.

- **NSM-37** — Review and Update global CSS variables
  - [ ] Inventory current variables; remove duplicates; define naming convention.
  - [ ] Extend palette for semantic tokens (e.g., `--color-text-muted`, `--surface-elev-1`).
  - [ ] Create `/css/variables.css` (or ensure central file) and import in all pages.
  - [ ] Document usage guidance in `/docs/CSS_VARIABLES.md`.

- **NSM-38** — Add Blog-Post Data to Populate Blog Page
  - [ ] Blog list loads from `posts.json` or API with title, author, date, teaser, tags, slug.
  - [ ] Cards render teaser; clicking opens full post page; dates formatted locale-sensitively.
  - [ ] Empty state and error state handled gracefully.
  - [ ] Unit tests for parsing, sorting (newest first), and tag filtering (if present).

- **NSM-39** — Expand Admin Dashboard
  - [ ] Dashboard sections added: Accounting, Invoicing, Equipment, Service Requests.
  - [ ] Consistent card/button UI; quick links to each module’s key actions.
  - [ ] Stats widgets show basic counts (e.g., open requests today).
  - [ ] Permissions respect roles (read-only vs admin).

- **NSM-40** — Blog Pagination
  - [ ] Pagination controls work (Prev/Next + page numbers); state syncs with URL.
  - [ ] SEO: rel=prev/next (or modern equivalents); paginated pages have unique titles.
  - [ ] Works with search/filtering without resetting user context.

- **NSM-41** — Blog Search & Filtering
  - [ ] Search matches in title/teaser; tag filters combine with search (AND/OR as specified).
  - [ ] Filter state persisted in URL; clearing restores default list.
  - [ ] Performance: search over 500 posts completes < 150ms client-side (or server-side).

- **NSM-43** — Analytics Integration
  - [ ] GA4/Plausible (or chosen tool) integrated with consent banner support.
  - [ ] IP anonymization enabled; no PII tracked; respect DNT when feasible.
  - [ ] Key events tracked: contact submit, service request, gallery item open, blog read.
  - [ ] Docs: `/docs/ANALYTICS.md` lists events, parameters, and dashboards.

- **NSM-44** — Form Spam Protection (Honeypot/Recaptcha)
  - [ ] Hidden honeypot implemented and verified server-side.
  - [ ] Submission timestamp + minimum fill time check blocks bots.
  - [ ] Optional reCAPTCHA/Turnstile integrated for high-risk forms; accessible fallback provided.
  - [ ] Spam rate drops below target threshold for 14 days.

- **NSM-45** — PWA Offline Support
  - [ ] Add `site.webmanifest` with icons and metadata; valid via Lighthouse.
  - [ ] Service worker caches shell + critical assets; offline landing UX in place.
  - [ ] `beforeinstallprompt` handled; add-to-home-screen tested on Android and desktop Chrome.
  - [ ] Document update strategy and cache invalidation.

- **NSM-46** — Blog Categories/Tags
  - [ ] Tags/categories attached to posts; UI chips render and are clickable filters.
  - [ ] Tag pages (or filtered state) are linkable; crawlers can index lists.
  - [ ] Counts per tag displayed (optional).

- **NSM-47** — RSS Feed for Blog
  - [ ] `/feed.xml` generated with latest N posts; valid RSS per W3C validator.
  - [ ] Feed includes title, link, pubDate, author, and description/summary.
  - [ ] Linked from `<head>` with `<link rel="alternate" type="application/rss+xml" ...>`.

- **NSM-50** — Set Up CI/CD Pipeline
  - [ ] GitHub Actions builds, lints, and deploys on `main` merges; secrets stored securely.
  - [ ] Branch protection rules enabled; required checks pass before merge.
  - [ ] Deploy script uses atomic strategy; rollback documented and tested.
  - [ ] Public mirror job pushes to public repo without leaking secrets.

- **NSM-75** — Services not displaying
  - [ ] Other Services data retrieved from DB (`other_services` table) or JSON fallback.
  - [ ] Front-end (other-services.html) renders collapsible boxes starting collapsed; shows description & image (if any).
  - [ ] Layout styles (`other-services-section`, `other-services-container`) present and conflict-free.
  - [ ] Error state visible with retry; confirmed working in dev and prod.

- **NSM-77** — Homepage Testimonials Slideshow (10 items, final card links)
  - [ ] Slideshow shows ~10 items; final card links to full testimonials page.
  - [ ] Autoplay respects reduced-motion; manual controls are keyboard-accessible.
  - [ ] No style bleed into full testimonials page (see NSM-80).
  - [ ] Performance: no layout shift on slide change.

- **NSM-79** — Review All CSS for Global Variables
  - [ ] Sweep all CSS files to replace hardcoded colors/sizes with variables where appropriate.
  - [ ] Remove unused variables; map globals to components; update documentation.
  - [ ] Run visual regression check after refactor.

- **NSM-80** — Prevent Homepage Slideshow CSS from Conflicting with Full Testimonials Page
  - [ ] Namespacing strategy applied (e.g., `.home-testimonials-` prefix).
  - [ ] Full testimonials page layout remains unchanged after homepage styles load.
  - [ ] Add automated CSS scope test (if available) to prevent regressions.

- **NSM-81** — Homepage Testimonials Slideshow: Add Animation & Pagination
  - [ ] Add pagination dots/numbers; keyboard focus management for controls.
  - [ ] Animations honor reduced-motion; FPS stable on low-power devices.
  - [ ] No CLS introduced; Lighthouse performance score unaffected.

- **NSM-82** — Apply Mobile Styling Across All Pages
  - [ ] Audit each page at 360px/414px widths; fix overflow and tap targets (≥ 44px).
  - [ ] Responsive tables scroll horizontally; images scale within containers.
  - [ ] Navbar and footer function correctly on mobile; no content hidden behind fixed bars.

- **NSM-86** — Ranked-Choice Voting: Continue Work on ranked-choice.html
  - [ ] Page structure finalized; header/footer fetched correctly.
  - [ ] Core ballot creation UI stable; candidate components reusable.
  - [ ] State saved to URL or localStorage for session continuity (until backend ready).

- **NSM-87** — Ranked-Choice Voting: Switch to Candidate Count Dropdown
  - [ ] Dropdown sets number of candidates (2–10); auto-generates inputs.
  - [ ] Validation for unique candidate names; error messaging inline.
  - [ ] Works with existing ranking logic and summary view.

- **NSM-88** — Ranked-Choice Voting: Show Diagram of Vote Totals After Counting
  - [ ] After vote counting, chart renders (bar or Sankey) showing rounds and eliminations.
  - [ ] A11y: data table alternative provided; chart announces values on focus.
  - [ ] Export of results as JSON/CSV available.

- **NSM-89** — Create Service Pages (photography/videography/editing/other-services)
  - [ ] Pages created under `/services/`; header/footer loaded; unique meta titles.
  - [ ] Content placeholders present with real copy TBD; images optimized and lazy-loaded.
  - [ ] Cross-links between services where relevant; contact CTA on each page.

- **NSM-90** — Services: Folder Structure & Navigation Wiring
  - [ ] Services left-nav buttons stacked vertically; current section highlighted.
  - [ ] Right sidebar equipment list loads where applicable; visually appealing card/list.
  - [ ] No header/footer duplication inside dynamically loaded content.

- **NSM-91** — JSON-Based Equipment List (full view + per-service filtering)
  - [ ] `equipment.json` includes fields: id, name, category, description, tags, image (optional).
  - [ ] services.html shows full list; per-service pages filter relevant items.
  - [ ] Group by category with headers; optional thumbnails and expandable cards.
  - [ ] Mobile behavior adjusted per design (tap-only expansion, etc.).

- **NSM-92** — equipment.json: Add 'category' Field for Each Item
  - [ ] All items tagged with category: camera, lens, mic/recorder, lighting, software, set piece, accessories.
  - [ ] No category typos; categories documented; filters updated accordingly.
  - [ ] Backfill existing items; validate JSON syntax CI check.

- **NSM-97** — Install & Configure SSL/HTTPS
  - [ ] Valid TLS certs installed (Let’s Encrypt or provider); auto-renew configured.
  - [ ] Redirect HTTP→HTTPS; HSTS enabled after validation.
  - [ ] Mixed-content audit passes; all resources load over HTTPS.
  - [ ] External scanners (SSL Labs) report grade A or better.

## Completed / Closed Issues
- **NSM-42**
- **NSM-48**
- **NSM-51**
- **NSM-52**
- **NSM-54**
- **NSM-55**
- **NSM-68**
- **NSM-72**
- **NSM-102** — NSGM Logo shows broken link on index.html