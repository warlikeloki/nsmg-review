# Project Summary: Neil Smith Media Group Website

## 1. Project Setup & Goals
- **Architecture**: Multi-page PHP site, with static HTML, CSS, JS under `/`, modular scripts in `/js/modules/`, PHP JSON endpoints in `/php/`.
- **Workflow**: Two-week sprints, tracked in Jira (keys NSM-XX), statuses: Backlog, Ready, In Progress, Testing, Done.
- **Versioning**: GitHub for code, issues synchronized to Jira; deployments via CI/CD (NSM-30).

## 2. Files & Layout Changes

### Header & Footer
- Moved to **header.html** and **footer.html**, injected on every page via `fetch()` in a small inline `<script>`.
- Navigation (`navigation.css`) and social icons (`footer.css`) standardized.

### Global Shell & Sidebars
- All top-level pages (`index.html`, `about.html`, `services.html`, `blog.html`, `portfolio.html`, `gallery.html`, `contact.html`, `request-form.html`, `testimonials.html`, `privacy.html`, `terms-conditions.html`):
  - Load common CSS (`global.css`, `layout.css`, `navigation.css`, `mobile.css`, etc.)
  - Wrap content in:
    ```html
    <div class="page-container">
      <aside class="left-sidebar">…</aside>
      <main>…</main>
      <aside class="right-sidebar">…</aside>
    </div>
    ```
  - Include `<script type="module" src="/js/main.js" defer></script>`.

## 3. JavaScript Modules
- **main.js** bootstraps:
  - `navigation.js`, `blog.js`, `blog-post.js`, `testimonials.js`, `equipment.js`, `contact.js`, `service-request.js`, `portfolio.js`, `admin.js`, `pricing.js`, `settings.js`.
- Recent module updates:
  - **service-request.js**: AJAX form submission to `/php/service_request.php`.
  - **homepage.js** & **layout.css**: Inline accordion for “Our Services” (2×2 grid, toggles).

## 4. Mobile Navigation
- **mobile.css** simplified submenu show/hide.
- **navigation.js**:
  - Guards null, toggles one submenu at a time.
  - Collapses on re-tap, closes on outside-click.
- **NSM-91**: Backlog task to investigate intermittent hamburger failures.

## 5. Services Dashboard
- **services.html**:
  - Sidebar buttons: Photography, Videography, Editing, Other Services, Pricing, Request a Service.
  - AJAX loads `/services/<service>.html` into main pane and injects the right JS module.
- Key updates:
  - **NSM-87**: Fix “Other Services” AJAX injection.
  - **NSM-77**: Backlog for embedding pricing widget.
  - **NSM-84**: Refined “Learn More” accordion on homepage.

## 6. Backend Endpoints
- **php/contact_form.php**  
- **php/service_request.php**  
- **php/get_service_requests.php**  
- **php/get_pricing.php** (PDO, pricing×services join)  
- **php/get_equipment.php**  
- **php/get_posts.php**, **php/get_testimonials.php**, etc., with admin.js protections.
- Error reporting (`ini_set('display_errors',1)`) during development; try/catch for JSON errors.

## 7. Issue Tracking & Sprint Status

### Sprint 1 (Done)
- NSM-29: Sidebars on all pages  
- NSM-47: Contact & Service-Request Integration  
- NSM-71: Import main.js across templates  
- Mobile nav & services dashboard fixes bundled under regression (NSM-42, NSM-46, NSM-49, NSM-51)

### Sprint 2 (Done)
- NSM-19: Add “Blog” link to header  
- NSM-22, NSM-23, NSM-26: Homepage layout & dynamic modules  
- NSM-27, NSM-51: Mobile styling & submenu behavior  
- NSM-29: Form “Thank You” response fix  
- NSM-42: Custom 404 & 500 pages  
- NSM-72: Regression testing  
- NSM-78: Update footer links

### Sprint 3 (In Progress)
- NSM-30: CI/CD pipeline setup  
- NSM-31: Performance & caching optimizations  
- NSM-34: Admin dashboard UI access  
- NSM-35: Mobile submenu collapse fix  
- NSM-82: Admin authentication & session management

## 8. Test Plan Highlights
- **NSM-72** regression suite for Sprint 2.
- Sidebar injection, hamburger open/close, outside-click closure.
- Services dashboard AJAX loads and form validation/messages.
- Pricing endpoint error handling tested via a 500-trigger script.
- Mobile submenu: single open, collapse on re-tap, no clipping.

## 9. Outstanding Tasks & Backlog
- **NSM-16**: Dynamic Testimonials page  
- **NSM-17**: Portfolio/Gallery dynamic loading  
- **NSM-32**: Gallery keyboard & arrow navigation  
- **NSM-45**: PWA offline support  
- **NSM-77**: Embed pricing widget in services dashboard  
- **NSM-84**: Refine homepage accordion/“Learn More”  
- **NSM-86**: Flickr integration for gallery  
- **NSM-87**: “Other Services” AJAX injection  
- **NSM-88**: Fix testimonials carousel on homepage  
- **NSM-89**: Add dynamic sidebar widget (“Book a Call”, recent posts)  
- **NSM-90**: Dev cache-control configuration  
- **NSM-91**: Investigate hamburger menu issue  
- **NSM-92**: Improve 404 page layout & styling

## 10. Next Steps
1. Finish Sprint 3 items and move to Testing.  
2. Plan Sprint 4 from Backlog, balancing story points.  
3. Consolidate duplicates and archive legacy tasks.  
4. Begin acceptance testing for newly completed features (admin portal, performance, PWA).  
