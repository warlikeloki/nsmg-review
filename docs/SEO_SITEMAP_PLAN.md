# SEO & Sitemap Plan

This doc guides you through on-page SEO, robots/sitemap config, and consistent metadata across the site.

---

## 1) Global Head Defaults (apply to all pages)
- [ ] Ensure each page has a unique `<title>` (55–60 chars target) and `<meta name="description">` (140–160 chars).
- [ ] Add Open Graph + Twitter meta (site-wide defaults in header partial):
  ```html
  <meta property="og:site_name" content="Neil Smith Media Group" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Neil Smith Media Group" />
  <meta property="og:description" content="Photography, videography, and editing services." />
  <meta property="og:image" content="https://neilsmith.org/media/og/default.jpg" />
  <meta property="og:url" content="https://neilsmith.org/" />
  <meta name="twitter:card" content="summary_large_image" />
  ```
- [ ] Add canonical link per page (update `href` to match the page):
  ```html
  <link rel="canonical" href="https://neilsmith.org/" />
  ```
- [ ] `lang` attribute on `<html>` is set (e.g., `en` or `en-US`).
- [ ] Add a skip link near the top of the page: `<a class="skip-link" href="#main">Skip to main content</a>`.

---

## 2) Page-Specific Recommendations
### Home (`/index.html`)
- [ ] Title: **Your Story, Captured | Neil Smith Media Group**
- [ ] Description: **Photography, videography, and editing services for brands, events, and businesses. Explore our portfolio and request a quote.**
- [ ] Ensure LCP image (hero) is optimized (webp/avif) and declared with width/height.
- [ ] Mark up organization basics via JSON-LD (footer or head):
  ```html
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Neil Smith Media Group",
    "url": "https://neilsmith.org/",
    "logo": "https://neilsmith.org/media/logos/nsmg-logo.png",
    "sameAs": []
  }
  </script>
  ```

### About (`/about-us/about.html`)
- [ ] Title: **About Neil Smith Media Group**
- [ ] Description: **Our story, values, and the team behind Neil Smith Media Group.**
- [ ] Use `Person` schema for team members if desired.

### Privacy (`/privacy.html`)
- [ ] Title: **Privacy Policy | Neil Smith Media Group**
- [ ] Description: **How we collect, use, and protect your information.**
- [ ] Include “Last updated: YYYY-MM-DD” in the content.

### Terms (`/terms-conditions.html`)
- [ ] Title: **Terms & Conditions | Neil Smith Media Group**
- [ ] Description: **Terms governing website use and service agreements.**
- [ ] Include “Last updated: YYYY-MM-DD” in the content.

### Services (example)
- [ ] Title: **Photography, Videography & Editing Services | NSMG**
- [ ] Description: **Weddings, portraits, commercial shoots, event coverage, color grading, and more.**
- [ ] Consider `Service` or `LocalBusiness` schema.

### Portfolio (example)
- [ ] Title: **Featured Work | Neil Smith Media Group**
- [ ] Description: **A selection of recent photography and video projects.**
- [ ] Use responsive images and descriptive `alt` text.

---

## 3) Robots & Sitemap

### Robots.txt
- [ ] **Dev robots (block all):**
  ```txt
  User-agent: *
  Disallow: /
  ```
- [ ] **Prod robots (allow, with exclusions):**
  ```txt
  User-agent: *
  Disallow: /admin/
  Disallow: /php/
  Disallow: /scripts/
  Disallow: /js/
  Disallow: /css/
  Disallow: /json/
  Disallow: /media/private/
  Sitemap: https://neilsmith.org/sitemap.xml
  ```

### Sitemap (generated)
- [ ] Use the provided script (no external deps).
- [ ] **Dev build:**
  ```powershell
  node .\scripts\generate-sitemap.js -base http://localhost:8080 -root . -out sitemap.dev.xml --dev --robots robots.dev.txt
  ```
- [ ] **Prod build:**
  ```powershell
  node .\scripts\generate-sitemap.js -base https://neilsmith.org -root . -out sitemap.xml --prod --gzip --robots robots.txt
  ```
- [ ] Excludes: admin/tests/assets/etc. Partials like `header.html`, `footer.html`, `404.html`, `500.html` are omitted automatically.
- [ ] Include `.php` pages only if they’re real public routes (use `--include-php`).

---

## 4) Header/Footer Partials (fetch-loaded)
- [ ] Ensure header/footer HTML does not contain another `<h1>`.
- [ ] Move global metadata to page head; header/footer should not inject metadata.
- [ ] Add `rel="noopener"` on external links and ensure keyboard focus styles exist.

---

## 5) Bonus: Preloading & Performance
- [ ] Add `preload` for critical fonts (if any) with `as="font"` and `type`; use `font-display: swap`.
- [ ] Consider `preload` or `fetchpriority="high"` for the LCP image on home only.
- [ ] Lazy load below-the-fold images (`loading="lazy"`, `decoding="async"`).

---

## 6) Package Scripts (optional)
- [ ] In `package.json` add:
  ```json
  {
    "scripts": {
      "sitemap:dev": "node ./scripts/generate-sitemap.js -base http://localhost:8080 -root . -out sitemap.dev.xml --dev --robots robots.dev.txt",
      "sitemap:prod": "node ./scripts/generate-sitemap.js -base https://neilsmith.org -root . -out sitemap.xml --prod --gzip --robots robots.txt"
    }
  }
  ```

---

## 7) Go-Live Checklist
- [ ] Canonicals match live URLs (no localhost).
- [ ] Remove any `noindex` from production pages.
- [ ] Verify robots.txt is the prod version.
- [ ] Submit `sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- [ ] Re-run Lighthouse; check CLS/LCP/SEO categories.