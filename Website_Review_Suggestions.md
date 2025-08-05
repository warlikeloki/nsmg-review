# Comprehensive Website Improvement Suggestions

The following file-by-file improvement guide covers all HTML, CSS, JS, PHP, and JSON files in the `NSMG-20250726.zip` project.

---

## Website Root (Content HTML)

### 404.html & 500.html
- **Header/Footer**: Confirm both `fetch('/header.html')` and `fetch('/footer.html')` are present and error-handled.  
- **Meta Tags**: Add Open Graph (`og:title`, `og:description`, `og:image`, `og:url`) and  
  `<meta name="robots" content="noindex, nofollow">`.  
- **CSS Order**: Ensure `<link>`s follow:
  1. `global.css`
  2. `layout.css`
  3. `header.css`
  4. `navigation.css`
  5. _page-specific (none)_
  6. `mobile.css`
  7. `footer.css`
- **Accessibility**: Wrap content in `<main role="main">`, add a “Back to Home” link.  
- **Validation**: Run W3C HTML validator and fix errors.

### index.html
- **Accessibility Improvements**
  - Add `aria-label` to `<aside>` elements.  
  - Add `role="region"` and `aria-labelledby` on each `.homepage-section`.  
- **Semantic & Validation**
  - Confirm `<main id="homepage">` as primary landmark.  
  - Optionally wrap the injected header in `<nav aria-label="Main navigation">`.  
- **Service Accordion**
  - Toggle `aria-expanded` when sections open/close.  
  - Verify `.subservices` toggles `hidden` attribute.  
- **Dynamic Content**
  - Ensure JS populates:
    - `.testimonials-slider`
    - `#portfolio-grid`
    - `.blog-post-preview`
  - Add `.catch()` error handling on fetches.  
- **SEO Enhancements**
  - Add Open Graph meta tags:
    ```html
    <meta property="og:title" content="…">
    <meta property="og:description" content="…">
    <meta property="og:image" content="…">
    <meta property="og:url" content="…">
    ```
  - Add `<meta name="robots" content="index, follow">`.  
- **Links & Images**
  - Verify all `<a href="…">` resolve without 404s.  
  - Add `width`/`height` to key images; consider WebP.  
- **Sidebars & Layout**
  - Mark empty `<aside>` with `aria-hidden="true"` on mobile.  
  - Ensure sidebars hide at mobile breakpoints.  
- **Call-To-Actions**
  - Confirm CTA buttons have sufficient contrast and focus outlines.

### blog-post.html
- **Dynamic Loading**: Fetch post by ID with `.catch()`.  
- **SEO**: Add `<link rel="canonical">`.  
- **Comments**: Remove demo comments.  
- **Share Buttons**: Use `target="_blank" rel="noopener"`.

### blog.html
- **Pagination**: Replace hardcoded with dynamic JS pagination.  
- **Search/Filter**: Add live client-side filter input.  
- **Meta Description**: Tailor to “Latest articles by Neil Smith Media Group.”

### contact.html
- **Form Validation**: Use HTML5 `required`, `pattern`, plus JS fallback.  
- **Spam Protection**: Add honeypot or reCAPTCHA.  
- **Feedback UI**: Use ARIA live regions.  
- **Meta**: Add `og:type="website"`.

### portfolio.html
- **Filtering**: Validate CSS/data-attribute setup.  
- **Lazy-load**: `loading="lazy"` on images.  
- **Accessibility**: `alt` text and wrap grid in `<ul role="list">`.  
- **Meta**: Add concise `<meta name="description">`.

### services.html
- **Accordion Nav**: Use ARIA `tablist`/`tabpanel`.  
- **Deep Linking**: Support URL hashes to open sections.

### testimonials.html
- **Read More**: Toggle long quotes with `aria-expanded`.  
- **Layout**: CSS Grid with responsive breakpoints.  
- **Meta**: Use `og:type="article"` if appropriate.

---

## About-Us Subfolder

### about-us/about.html

- [ ] **Header/Footer Injection**
  - Fetch `/header.html` immediately after `<body>` opens  
  - Fetch `/footer.html` after closing `</main>`  
- [ ] Remove unused `<link rel="stylesheet" href="/css/forms.css" />`  
- [ ] Add `id="about"` to `<main>` for JS targeting/analytics  
- [ ] Add `role="region" aria-labelledby="about-heading"` to `<section class="about-section">`  
  - Give the `<h1>` an `id="about-heading"`  
- [ ] **Optimize Team Photos**
  - Include explicit `width` and `height` attributes on `<img>`  
  - Provide a WebP fallback via `<picture>` or `srcset`  
- [ ] **SEO & Meta**
  - Add Open Graph tags in `<head>`:
    ```html
    <meta property="og:title" content="About Neil Smith Media Group">
    <meta property="og:description" content="Learn about our mission, team, and expertise.">
    <meta property="og:image" content="/media/og/about-preview.png">
    <meta property="og:url" content="https://neilsmith.org/about-us/about.html">
    ```
  - Add `<meta name="robots" content="index, follow">`  
- [ ] Ensure the “About” link is highlighted active in the navigation (check `header.html`)  
- [ ] Mark empty `<aside>` elements with `aria-hidden="true"`  

---

### about-us/privacy.html

- [ ] Normalize `<html lang="en-us">` to `lang="en"`  
- [ ] **CSS `<link>` Order** in `<head>`:
  1. `/css/global.css`  
  2. `/css/layout.css`  
  3. `/css/header.css`  
  4. `/css/navigation.css`  
  5. *page-specific (remove `/css/forms.css` & `/css/media.css` if unused)*  
  6. `/css/mobile.css`  
  7. `/css/footer.css`  
- [ ] Remove unused `<link>`s for `/css/forms.css` and `/css/media.css`  
- [ ] **SEO & Meta**
  - Add Open Graph tags:
    ```html
    <meta property="og:title" content="Privacy Policy">
    <meta property="og:description" content="How we collect, use, and protect your data.">
    <meta property="og:url" content="https://neilsmith.org/about-us/privacy.html">
    ```
  - Add `<meta name="robots" content="index, follow">`  
- [ ] Add `id="privacy"` to `<main>` and `role="region" aria-labelledby="privacy-heading"` on `<section class="privacy-section">`  
  - Give the `<h1>` an `id="privacy-heading"`  
- [ ] Mark empty `<aside>` elements with `aria-hidden="true"`  
- [ ] Move the `fetch('/header.html')` script so it runs immediately after `<body>` opens (before `.page-container`)  
- [ ] Verify the `<a href="mailto:contact@neilsmith.org">` link has a visible focus outline for keyboard users  

---

### about-us/terms-conditions.html

- [ ] Normalize `<html lang="en-us">` to `lang="en"`  
- [ ] **CSS `<link>` Order** in `<head>`:
  1. `/css/global.css`  
  2. `/css/layout.css`  
  3. `/css/header.css`  
  4. `/css/navigation.css`  
  5. *page-specific (remove `/css/forms.css` & `/css/media.css` if unused)*  
  6. `/css/mobile.css`  
  7. `/css/footer.css`  
- [ ] Remove unused `<link>`s for `/css/forms.css` and `/css/media.css`  
- [ ] **SEO & Meta**
  - Add Open Graph tags:
    ```html
    <meta property="og:title" content="Terms and Conditions">
    <meta property="og:description" content="Website use, service agreements, and policies.">
    <meta property="og:url" content="https://neilsmith.org/about-us/terms-conditions.html">
    ```
  - Add `<meta name="robots" content="index, follow">`  
- [ ] Add `id="terms"` to `<main>` and `role="region" aria-labelledby="terms-heading"` on `<section class="terms-section">`  
  - Give the `<h1>` an `id="terms-heading"`  
- [ ] Mark empty `<aside>` elements with `aria-hidden="true"`  
- [ ] Move the `fetch('/header.html')` script to immediately after `<body>` opens (before `.page-container`)  
- [ ] Verify the `<a href="mailto:contact@neilsmith.org">` link is keyboard-accessible with a visible focus outline  


---

## Admin Subfolder (HTML & PHP)

> **All admin pages**: Include `<meta name="robots" content="noindex, nofollow">` and protect via session/auth.

### accounting.html
- Fetch header/footer with error handling.  
- Add `<caption>` and `<th scope="col">`.  
- Add “New Entry” button and per-row Edit/Delete.

### admin.old.html
- Archive or remove; do not expose in production.

### admin.php
- Wrap nav in `<nav aria-label="Admin navigation">`.  
- Add `<noscript>` warning.  
- Ensure mobile-friendly `.page-container` flex layout.

### equipment.html
- Add `<caption>Equipment Inventory</caption>`.  
- Add category filter dropdown and bulk-action checkboxes.

### invoicing.html
- Mirror accounting; add PDF export button.

### login.html
- Secure `<form>` with CSRF token.  
- Proper `<label>` usage.

### manage-posts.html & manage-testimonials.html
- Add multi-select Batch Publish.  
- Add live preview links.

### service-requests.html
- Use color badges for status.  
- Add real-time search filter.

### website-settings.html
- Group settings with `<fieldset>`.  
- Preview current logo.  
- ARIA live region for save confirmation.

---

## Gallery Subfolder

### gallery.html
- Ensure lightbox with prev/next and keyboard nav.  
- Descriptive `alt` text.  
- Category filter UI.  
- Lazy-load images.

---

## Ranked-Choice Subfolder

### create-ballot.html & create_ballot.php
- Enforce 2–10 candidates in JS and PHP.  
- Use `<input type="datetime-local">`.

### ranked-choice.html & ranked-choice.js
- Make list drag/drop with ARIA roles.  
- Show error if ballot missing.

### results.html & get_ranked_choice_results.php
- Present `<canvas aria-label="Results chart">`.  
- Provide collapsible data table for each round.

### vote.html & submit_rankings.php
- Disable form after submit.  
- Show confirmation message.

---

## CSS Folder

For each CSS file, run Stylelint. Key checks:
- **global.css**: Audit `:root` variables; remove unused.  
- **layout.css**: Consistent grid/gap; responsive utilities.  
- **header.css/navigation.css**: Focus styles; remove unused selectors.  
- **mobile.css**: Verify breakpoints; consolidate overlap.  
- **footer.css**: Add “back to top” link; touch-target padding.  
- **homepage.css/services*.css**: Validate that styles match markup; section comments.  
- **forms.css**: Standardize focus; remove old prefixes.  
- **gallery.css/media.css**: Consolidate image sizing; improve transitions.  
- **admin.css**: Add table-responsive wrapper; normalize button sizes.  
- **feature CSS**: Remove duplicate selectors; use variables for spacing/font sizes.

---

## JS Folder

Run ESLint on all. General rules:
- Add `.catch()` on every `fetch()`.  
- Update `aria-expanded` when toggling UI.  
- Remove `console.log` for production.

Specific modules:
- **homepage.js**: Validate content injection.  
- **navigation.js**: Test mobile menu toggles.  
- **contact.js/service-request.js**: Validation and feedback.  
- **equipment.js**: Filtering with debounce.  
- **testimonials.js**: Swipe/keyboard support.  
- **pricing.js**: Numeric validation, currency formatting.  
- **settings.js**: Two-way form binding.  
- Archive unused scripts.

---

## JSON Folder

- Define and validate against JSON Schema.  
- Ensure uniform structure and no trailing commas/comments.  
- Validate with `jsonlint`.

---

## PHP Folder

Apply to every endpoint:
1. Use PDO + prepared statements.  
2. Sanitize inputs.  
3. Try/catch DB calls; return JSON `{ success, data?, error? }`.  
4. Disable `display_errors` in production.  
5. Protect admin routes with sessions.  
6. Set `Content-Type: application/json`.

Specifics:
- **get_*.php**: consistent JSON response.  
- **service_request.php**: rate limit.  
- **update_settings.php**: validate uploads.  
- **admin_logout.php**: `session_unset(); session_destroy();`.

---

## Final Notes

- **Remove dead code**: Archive or delete unused files.  
- **Automate linting**: Integrate HTMLHint, Stylelint, ESLint, PHP_CodeSniffer, and JSON linting into CI.  
- **Centralize includes**: Use PHP `include` or template engine for `head.html`, `header.html`, `footer.html`.  
- **Documentation**: Keep a `README.md` with workflow, file structure, and standards.
