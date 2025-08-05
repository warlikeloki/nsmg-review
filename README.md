Author: Neil Smith
Year: 2025

Official website for Neil Smith Media Group—offering photography, videography, editing, and related media services.Live domain: https://neilsmith.org

Project Structure

/                    # Project root
  /css               # Stylesheets (global.css, layout.css, navigation.css, mobile.css, homepage.css, etc.)
  /js                # JavaScript files
    /modules         # Per-feature modules (navigation.js, homepage.js, service-request.js, pricing.js, equipment.js, blog.js, gallery.js, admin.js, etc.)
  /php               # Server endpoints (contact_form.php, service_request.php, get_pricing.php, get_equipment.php, get_posts.php, get_testimonials.php, etc.)
  /services          # Static HTML fragments loaded via AJAX in services dashboard
  /admin             # Admin UI pages (accounting.html, invoicing.html, manage_equipment.html, website_settings.html, etc.)
  /gallery           # Gallery page and Flickr‑integration code
  /scripts           # Utility scripts (PowerShell & Node.js)
  header.html        # Shared site header include
  footer.html        # Shared site footer include
  index.html         # Homepage
  about.html         # About page
  services.html      # Services dashboard container
  blog.html          # Blog listing
  portfolio.html     # Portfolio listing
  gallery.html       # Gallery page
  testimonials.html  # Testimonials listing
  contact.html       # Contact page
  request-form.html  # Service request form page
  404.html           # Custom 404 error page
  500.html           # Custom 500 error page

JavaScript Modules

All entry via main.js (imports & initializes each module):

navigation.jsDesktop & mobile menu toggles, submenu collapse, outside‑click to close.

homepage.jsHero banner, services accordion (2×2 grid), testimonials carousel, portfolio & blog teasers, about preview.

service-request.jsAJAX submit of service quote form to /php/service_request.php, client‑side validation.

pricing.jsFetch and render pricing plans from /php/get_pricing.php.

equipment.jsLoad equipment lists by category via /php/get_equipment.php.

blog.jsRender blog posts using /php/get_posts.php.

gallery.jsDisplay gallery images, including Flickr API integration (NSM‑86).

testimonials.jsRender testimonials from /php/get_testimonials.php.

admin.jsProtect admin pages, session checks, sidebar highlights.

Services Dashboard

Located at services.html

Left sidebar buttons: Photography, Videography, Editing, Other Services, Pricing, Request a Service.

Clicking a button loads /services/<name>.html into the main pane via AJAX and injects the related JS module (equipment.js, service-request.js, etc.).

Known backlog issues: NSM‑77 (pricing embed), NSM‑87 (Other Services injection).

This is to test the CI/CD things. It will be deleted later.