
# NSMG — Prioritized Next Steps
_Last updated: 2025-08-10_

This focuses on fast, high-impact improvements and sets you up for the dynamic migration.

## ✅ Order of Work (my recommendation)
1. **Admin hardening (quick wins, high value)**
2. **Sitemap/robots integration** (wire npm scripts + generate files)
3. **Phase 0 dynamic scaffold** (Slim + Twig bootstrap; keep current pages working)
4. **CI checks** (HTML/CSS/JS lint + PHP syntax; make required in branch protection)
5. **Performance polish** (images width/height, webp/avif, lazy)

---

## 1) Admin Hardening (Do This Next)
- [ ] Add `/php/session_bootstrap.php` (session + headers)
- [ ] Add `/php/admin_logout.php` (secure logout)
- [ ] Update `/admin/admin.php` to require the bootstrap, add `<meta name="robots" content="noindex, nofollow">`
- [ ] (Optional) Add `.htaccess` headers for static assets

**Commit plan (PowerShell):**
```powershell
git checkout -b feat/admin-hardening
# Add the three PHP files (or paste the updated versions once I provide them)
git add php/session_bootstrap.php php/admin_logout.php admin/admin.php
git commit -m "sec(admin): session hardening, logout route, robots noindex for admin"
git push -u origin HEAD
```

---

## 2) Sitemap & Robots Integration
- [ ] Add the no-deps script: `scripts/generate-sitemap.js` (already provided)
- [ ] Generate **dev** sitemap + robots:
  ```powershell
  node .\scripts\generate-sitemap.js -base http://localhost:8080 -root . -out sitemap.dev.xml --dev --robots robots.dev.txt
  ```
- [ ] Generate **prod** sitemap + robots (when domain is live):
  ```powershell
  node .\scripts\generate-sitemap.js -base https://neilsmith.org -root . -out sitemap.xml --prod --gzip --robots robots.txt
  ```
- [ ] (Optional) Add package scripts in `package.json`:
  ```json
  {
    "scripts": {
      "sitemap:dev": "node ./scripts/generate-sitemap.js -base http://localhost:8080 -root . -out sitemap.dev.xml --dev --robots robots.dev.txt",
      "sitemap:prod": "node ./scripts/generate-sitemap.js -base https://neilsmith.org -root . -out sitemap.xml --prod --gzip --robots robots.txt"
    }
  }
  ```

---

## 3) Phase 0 — Dynamic Scaffold (Slim + Twig)
- [ ] Add Composer and deps:
  ```powershell
  composer require slim/slim:^4 slim/psr7:^1 twig/twig:^3 vlucas/phpdotenv:^5
  ```
- [ ] Create `/public` webroot + `.htaccess` rewrite
- [ ] Add `public/index.php`, `routes/web.php`, `routes/admin.php`
- [ ] Add `resources/views/layouts/base.twig` and port `index.html` → `home.twig`
- [ ] Start dev server:
  ```powershell
  php -S localhost:8080 -t public
  ```

---

## 4) CI Checks (GitHub Actions)
- [ ] HTMLHint, ESLint, Stylelint configs
- [ ] PHP syntax check (`php -l` over all PHP)
- [ ] Workflow triggers on PRs; mark as required status checks after first run

**Commit plan (PowerShell):**
```powershell
git checkout -b ci/lint-and-php-syntax
# Add workflow + configs (I can generate these files next)
git add .github/workflows/lint.yml .htmlhintrc .eslintrc.cjs .stylelintrc.cjs
git commit -m "ci: add html/css/js lint and php syntax checks"
git push -u origin HEAD
```

---

## 5) Performance Polish
- [ ] Add explicit `width`/`height` or CSS `aspect-ratio` for hero & images to reduce CLS
- [ ] Convert heavy images to webp/avif; keep fallback
- [ ] Ensure `loading="lazy"`, `decoding="async"` on non-hero images

---

## Done / In Flight
- [x] Repo docs polish (CONTRIBUTING, SECURITY, CoC, templates, CODEOWNERS)
- [x] SUGGESTIONS.md (file-by-file review)
- [x] REPO_HARDENING.md
- [x] SEO & Sitemap plan + generator script
- [x] A11y improvements (skip-link pattern, accordion keyboard support)
