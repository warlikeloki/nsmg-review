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

Mobile Navigation

Styles in navigation.css & mobile.css; logic in navigation.js:

Only one submenu open at a time

Tap again to collapse

Close on outside click

Backlog investigation: NSM‑91 intermittent hamburger toggle failures

Backend Endpoints

All PHP endpoints return JSON and include validation & error handling:

Endpoint

Function

/php/contact_form.php

Process contact form

/php/service_request.php

Process service quote requests

/php/get_service_requests.php

Retrieve submitted service requests

/php/get_pricing.php

Return pricing data (joins pricing & services)

/php/get_equipment.php

Return equipment list by category

/php/get_posts.php

Return blog posts

/php/get_testimonials.php

Return testimonials

Note: Error reporting enabled during dev (ini_set('display_errors',1)); use try/catch for JSON errors.

Local Development

Prerequisites

PHP 8.x & MySQL

Apache (or XAMPP/WAMP/LAMP)

Node.js (for linters & build tasks)

Setup

Clone repository into webserver root (e.g., htdocs).

Hosts file entry:

127.0.0.1  nsmg.local

Apache VirtualHost:

<VirtualHost *:80>
  ServerName nsmg.local
  DocumentRoot "/path/to/project"
  <Directory "/path/to/project">
    AllowOverride All
    Require local
  </Directory>
</VirtualHost>

Database:

Create MySQL DB nsmg_db

Import provided db_dump.sql

Update /php/db_connect.php or use environment variables

Browse to http://nsmg.local to verify.

Issue Workflow

Jira keys: NSM‑XX

Statuses: Backlog, Ready, In Progress, Testing, Done

Regenerate ISSUES.md from TSV:

python update_issues.py issues.tsv ISSUES.md

Utility Scripts

Scripts reside in /scripts. Run from project root.

PowerShell

find-unused-css.ps1        — scan HTML for unused CSS selectors

find-unused-js.ps1         — detect unreferenced JS modules

find-unused-images.ps1     — list unreferenced image files

find-missing-images.ps1    — flag broken <img> paths

find-missing-title.ps1     — find HTML files missing <title>

check-broken-links.ps1     — crawl site for 404s

list-css-variables.ps1     — enumerate CSS variables

list-external-assets.ps1   — list external JS/CSS URLs

list-todos.ps1             — find TODO/FIXME/BUG comments

lowercase-image-filenames.ps1 — rename image files to lowercase

count-classes-ids.ps1      — count distinct HTML classes & IDs

find-large-folders.ps1     — identify folders with >20 files

Example:

.\scriptsind-unused-css.ps1

Node.js

Optimize Images:

npx imagemin images/* --out-dir=images/optimized

Lint HTML:

npx htmlhint "**/*.html"

Contributing

Create a branch: feature/NSM-XX-description

Commit message format: NSM-XX: brief summary

Open a Pull Request linking the Jira issue

Ensure all linters & scripts pass before merge

Deployment

CI/CD via GitHub Actions (.github/workflows):

On PR: lint, tests, security scan

On merge: deploy to staging → production

Secrets: managed in GitHub repo settings

License & Attribution

All site content © Neil Smith Media Group.Developed by Neil Smith, 2025.