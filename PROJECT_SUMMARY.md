Conversation Snapshot & Key Actions
1. Project Setup & Goals
You’re building a multi-page static/PHP site for Neil Smith Media Group.
All HTML, CSS, JS, and PHP files live under /, with /js/modules/ for modular scripts and /php/ for server endpoints.
You use GitHub issues and 2-week sprints, track statuses (Backlog, Ready, In Progress, Testing, Done), and have designated issue numbers for each task.

2. Files & Layout Changes
Header & Footer
Centralized into header.html and footer.html.
Injected via inline <script>fetch('/header.html')…> on every page.
Navigation menu and social icons styled in navigation.css, footer.css.
Global Shell & Sidebars
Standardized an HTML “shell” for all top-level pages (index, about, services, blog, blog-post, portfolio, gallery, contact, request-form, testimonials, privacy, terms-conditions).

Each page now:
Loads /css/global.css, /css/layout.css, /css/navigation.css, /css/mobile.css, etc.
Includes <script type="module" src="/js/main.js" defer>.
Wraps <main> in a .page-container with <aside class="left-sidebar"> and <aside class="right-sidebar">.
Modular JavaScript
main.js imports all modules: navigation, blog, blog-post, testimonials, equipment, contact, service-request, portfolio, admin, pricing, settings.
Individual modules live in /js/modules/, e.g. navigation.js, pricing.js, service-request.js, contact.js, etc.
Mobile Navigation
Refactored mobile.css to a simple show/hide for submenus (no clipped max-height).
Updated navigation.js to guard null elements, toggle one submenu at a time, collapse on re-tap, and close on outside clicks.
Services Dashboard
Created services.html with a sidebar of buttons: Photography, Videography, Editing, Other Services, Pricing, Request a Service.
Click handlers fetch /services/xyz.html via AJAX into the main pane, plus dynamically inject the right module scripts (equipment loader, service-request handler).

3. Backend Endpoints
Contact Form → php/contact_form.php
Service Request → php/service_request.php
Get Service Requests → php/get_service_requests.php
Pricing Data → php/get_pricing.php (joined pricing + services tables via PDO)
Equipment Data → php/get_equipment.php
Other admin endpoints: get_posts, get_testimonials, etc., all secured via admin.js.
We enabled error reporting in PHP during debugging (ini_set('display_errors',1)) and wrapped queries in try/catch for clear JSON errors.

4. GitHub Issues & Sprint Tracking
Sprint 1 (May 30 – June 8)
Done & Closed:
#29 Add sidebars to all pages
#47 Contact & Service-Request Form Integration
#71 Import main.js across all templates

Testing (bundled under #77):
#42 Fix Mobile Navigation Collapse
#46 Services Page Equipment Filter
#49 Pricing Page Backend Hookup
#51 Improve Mobile Dropdown Behavior

Upcoming
#75 Set up custom domain neilsmith.org (Sprint 2)
#78 Add “Blog” link to site header (Sprint 2)
#79 Implement Admin Portal Authentication (Sprint 3)

5. Test Plan Highlights (Issue #77)
Sidebars on every page (desktop + mobile hidden).
Hamburger menu open/close, outside-click closure, active link highlight.
Services Dashboard: AJAX loads of each service page and form.
Forms: Validation, error/success messages for contact & service-request.
Pricing: pricing.html and backend JSON works (500 → fixed PDO connection).
Mobile submenus: single open, collapse on re‐tap, no clipping.
Global JS: header/footer injection, nav logic, module imports run on all pages.

6. Outstanding Fixes & Notes
Pricing in Dashboard: decided to defer—pricing remains on /pricing.html only.
Request-form loader URL updated to /services/request-form.html and module injection fixed.
PHP 500 for pricing resolved by correcting db_connect.php to supply $pdo and wrapping queries in try/catch.

Next Steps:
Complete Sprint 1 testing under #77, move passing issues to Done.
Kick off Sprint 2 tasks (#75, #78) once testing is finished.