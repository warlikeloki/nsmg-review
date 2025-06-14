# NSMG Website Consolidated To-Do List

Below is a reviewed and de-duplicated to-do list for the Neil Smith Media Group website.  
Items marked **(Done)** have been completed already.  
Items marked **(In Progress)** are currently being worked on.  
Items marked **(??)** are uncertain—if not yet addressed, they remain; if already resolved, please remove or update accordingly.

---

## Testimonials

- **Modify Testimonial Cards**  
  - Limit character-count preview (e.g. 120 chars)  
  - Add a “Read More” / “Read Less” toggle button on each card  
  **Status:** Done (#24, #25)

- **Homepage Testimonials Slideshow**  
  - Show 5–10 testimonials as a carousel  
  - Include the “Read More” toggle on each slide  
  - Final slide = “View All Testimonials” → `/testimonials.html`  
  **Status:** Done (#25)

- **Dynamic Testimonials Page**  
  - Build `/testimonials.html` to show full list of testimonials  
  - Ensure it fetches from `/php/get_testimonials.php` or JSON  
  **Status:** In Progress (#45)

---

## Global Styles & Layout

- **Review All CSS for Global Variables**  
  - Audit `:root { --primary-color; --secondary-color; … }`  
  - Ensure consistent naming and usage across all `.css` files  
  **Status:** Done (#26) 

- **Ensure All Pages Include Shared Header/Footer/Nav**  
  - Verify each page’s `<head>` has `navigation.css`, `header.css`, `footer.css`  
  - Confirm `<div id="header-container"></div>` + `<div id="footer-container"></div>` injection scripts exist  
  **Status:** Done (#71)

- **Mobile Styling for All Pages**  
  - Verify responsiveness for each top-level page (`index.html`, `about.html`, `services.html`, etc.)  
  - Update sidebars, dropdowns, and form layouts for small screens  
  - Implement submenu collapse/expand behavior on mobile  
  **Status:** Mostly Done (#27, #51); some fixes remain **(??)**

---

## Equipment

- **Add “+ / –” Icon for Equipment List Toggling**  
  - Each category (Cameras, Microphones/Recorders, Lenses, Lighting, Software, Set Pieces, Accessories) should collapse/expand  
  - Use a “+” when collapsed, “–” when expanded  
  **Status:** Done (#37)

- **Add Equipment Inventory List (Admin Section)**  
  - Group items by category  
  - Pull from `equipment.json` (or eventually from SQL)  
  - Two-column (or multi-column) layout, with category headers  
  - Future: allow thumbnail + click-for-more-info per item  
  **Status:** In Progress (#37, #35)

- **Finalize Equipment Integration on All Service Pages**  
  - Ensure each service page (e.g. `videography.html`, `editing.html`, etc.) includes:  
    ```html
    <div id="equipment-list" data-category="…"></div>
    <script src="/js/equipment.js" defer></script>
    ```  
  - Verify `/php/get_equipment.php` and `js/equipment.js` correctly fetch and render  
  **Status:** In Progress (#46) 

- **Add “Equipment” to Admin Dashboard**  
  - Under `/admin/admin.html` → sidebar, add “Manage Equipment”  
  - Link to `/admin/manage_equipment.html` for CRUD operations on `equipment` table  
  **Status:** In Progress (#35)

---

## Admin Dashboard & Backend

- **Expand Admin Dashboard Section**  
  - Include subsections for:  
    - Accounting (#??)  
    - Invoicing (#??)  
    - Equipment management (#37)  
    - Service requests (#47)  
  - Ensure sidebar highlights the “active” page  
  **Status:** In Progress (#35)

- **Remove “ID” Column from Dashboard Tables**  
  - Hide auto-increment `id` column from the UI in all admin tables  
  **Status:** Done (#36, #37, #45, #??)

- **Create SQL Code for Tables**  
  - Define `services`, `pricing`, `equipment`, `testimonials`, etc.  
  - Write schema migrations or DDL scripts  
  **Status:** Done (#34)

- **Website Settings Page (Admin)**  
  - Build UI at `/admin/website_settings.html` to allow admins to:  
    - Update site title, meta description, contact email, social links  
    - Toggle maintenance mode on/off  
    - Change site logo (upload)  
  - Hook up to `website_settings` SQL table (`setting_key`, `setting_value`, `created_at`, `updated_at`)  
  **Status:** In Progress (#??)

- **Admin Access / Authentication**  
  - Implement login functionality for `/admin` area  
  - Protect `/php/*` endpoints behind session or token check  
  **Status:** Backlog (#79)

- **Set Up CI/CD Pipeline**  
  - Automate tests and deploys (e.g., GitHub Actions → S3/EC2)  
  - Ensure environment variables for database, SSH keys, etc. are handled securely  
  **Status:** Backlog (#56)

---

## Portfolio & Gallery

- **Add “Gallery” Under Portfolio Dropdown**  
  - In `header.html`, add link to `/gallery/gallery.html`  
  - Ensure “active” highlight works when viewing gallery  
  **Status:** Done (#30, #48)

- **Portfolio/Gallery Enhancements**  
  - Implement a lightbox sorted by subfolder (`/media/photos/portrait/`, `/media/photos/event/`, etc.)  
  - Future: dynamic folder indexing from backend  
  **Status:** In Progress (#48)

- **Implement Gallery Keyboard & Arrow Navigation**  
  - Allow left/right arrow keys to navigate slides in gallery  
  **Status:** Backlog (#50)

---

## Services Page

- **Services Page UI Changes**  
  - Confirm left sidebar buttons (Photography, Videography, Editing, Other Services, Pricing, Request a Service)  
  - Ensure “active” button stays highlighted  
  - Right sidebar shows equipment list (or link to Equipment page)  
  - Consider removing right sidebar if cluttered  
  **Status:** In Progress (#46)

- **Update `/services/pricing.html`**  
  - Paste in revised markup (including left/right sidebars)  
  - Adjust asset paths (`../css`, `../js`)  
  - Verify `<div id="pricing-container">` is present for dynamic injection **(??)**  
  - Ensure header/footer injection uses `fetch('../header.html')` and `fetch('../footer.html')`  
  **Status:** In Progress (#85, #90)

- **Embed Pricing in Services Dashboard**  
  - Later: AJAX-load pricing table and call `loadPricing()` after injection  
  **Status:** Backlog (#??)

- **Confirm Pricing Page Integration & Edge Cases**  
  - Verify `/php/get_pricing.php` uses real `pricing × services` join  
  - Test `js/pricing.js` table-based rendering on `pricing.html`  
  **Status:** Done (#49) / In Progress (#85, #86, #89)

---

## Pricing Page

- **Pricing Page Updates**  
  - Move all styling into `pricing.css` (no inline styles)  
  - Create two sections:  
    1. **Package Pricing** (predefined bundles)  
    2. **À La Carte Pricing** (single services with unit rates)  
  - Hook up to `/php/get_pricing.php`  
  **Status:** In Progress (#49, #85, #86, #89)

- **Refine Pricing CSS**  
  - Use zebra-striped table styling for readability  
  - Add hover states, responsive scrolling for narrow viewports  
  **Status:** Done (#90)

- **Fix “undefined” in Name Column**  
  - Update `pricing.js` to unwrap `{ success, data }` and use `item.name`  
  **Status:** Done (#86)

---

## Contact & Service-Request

- **Contact & Service-Request Forms Enhancements**  
  - Add “Subject/Service Type” dropdown (Photography, Videography, Editing, Other Services, General Inquiry)  
  - Add optional fields:  
    - Service Location (text input)  
    - Estimated Duration (text input)  
  - Style checkboxes so label text sits directly right of the checkbox  
  - Validate on frontend (JS) and backend (PHP)  
  **Status:** Done (#47)

- **Fix Service-Request “Thank You” Response**  
  - Ensure form submission returns success message  
  **Status:** Done (#86, #89)

---

## Footer & Navigation

- **Update Footer Links**  
  - Add links: Testimonials, Contact, About (under `/about-us/`), Privacy, Terms & Conditions, Services  
  **Status:** Done (#??)

- **Navigation Menu Fixes**  
  - Ensure active menu highlight is readable (contrast, background)  
  - Ensure dropdown submenus are fully visible (no clipping)  
  - Fix hamburger positioning & functionality on all pages  
  **Status:** Done (#42, #51) / In Progress (#51)  

- **Add “Blog” Link to Header**  
  - Update header navigation to include `/blog.html`  
  **Status:** Done (#78)

---

## Blog & Content

- **Add Blog Post Data to Populate Blog Page**  
  - Ensure `blog.js` fetches from `/php/get_posts.php` (which returns `{ success, data }`)  
  - Dynamically render `<article>` cards  
  **Status:** Done (#44)

- **Blog Pagination & Filtering**  
  - Implement page navigation (Next/Previous) on blog listing  
  - Add client-side search and tag/category filters  
  **Status:** Backlog (#58, #59, #65)

- **RSS Feed for Blog**  
  - Generate `/rss.xml` from posts table or JSON  
  **Status:** Backlog (#64)

- **Blog Categories/Tags**  
  - Allow tagging posts; add filter UI on `/blog.html`  
  **Status:** Backlog (#65)

- **Blog Search & Filtering**  
  - Implement search box that filters posts in real time  
  **Status:** Backlog (#59)

- **Blog Pagination**  
  - Split blog listing into pages of 5–10 posts  
  **Status:** Backlog (#58)

---

## Security & Deployment

- **Allocate & Associate an Elastic IP**  
  - Allocate new Elastic IP in EC2  
  - Associate with instance  
  - Update `EC2_HOST` GitHub secret (or switch to domain)  
  **Status:** Done (#69)

- **Point Custom Domain to EC2**  
  - Create A record for `neilsmith.org` → Elastic IP  
  - Verify DNS propagation  
  **Status:** In Progress (#75)

- **Install & Configure SSL/HTTPS**  
  - Open port 443 (Security Group + UFW)  
  - Run Certbot to obtain Let’s Encrypt certificate  
  - Update Apache/Nginx config to use cert  
  - Test `https://` access  
  **Status:** In Progress (#97)

- **Move Database Credentials Out of Code**  
  - Use environment variables (e.g. `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`)  
  - Update `db_connect.php` to read from `getenv()` or `$_ENV`  
  - Remove hard-coded credentials from version control  
  **Status:** In Progress (#??)

- **Harden Server Access & phpMyAdmin**  
  - Restrict phpMyAdmin by IP or via SSH tunnel  
  - Lock down file permissions (`chmod 600 db_connect.php`, etc.)  
  - Use low-privilege MySQL user for web app  
  **Status:** In Progress (#68)

- **Harden Security & Configuration (App)**  
  - Review `get_pricing.php`, `get_equipment.php`, etc. for SQL injection, XSS  
  - Apply prepared statements in all PHP endpoints  
  - Sanitize user inputs server-side  
  **Status:** In Progress (#55)

---

## Analytics & Performance

- **Optimize Performance & Caching**  
  - Implement HTTP caching for assets (CSS, JS)  
  - Minify JS/CSS, compress images  
  - Add server-side query caching for expensive SQL queries  
  **Status:** Backlog (#54)

- **Analytics Integration**  
  - Add Google Analytics (or similar) to `<head>`  
  - Verify pageview tracking across all routes  
  **Status:** Backlog (#61)

- **Conduct Cross-Browser QA**  
  - Test site on latest Chrome, Firefox, Safari, Edge, and mobile browsers  
  - Fix any rendering/layout issues  
  **Status:** Backlog (#57)

- **Conduct Accessibility Audit**  
  - Run automated tools (Lighthouse, axe) and manual checks (keyboard nav, screen reader)  
  - Fix any issues (alt text, label associations, contrast)  
  **Status:** In Progress (#52)

---

## Error Handling & SEO

- **Custom Error Pages 404 & 500**  
  - Create `/404.html`, `/500.html`, and configure server to use them  
  **Status:** Backlog (#60)

- **Add SEO Metadata & JSON-LD**  
  - For each page, add `<meta name="description">`, `<meta property="og:…">`, structured JSON-LD in `<head>`  
  **Status:** In Progress (#53)

---

## Progressive Web App (Future)

- **PWA Offline Support**  
  - Register Service Worker, precache essential assets (CSS, JS, core HTML)  
  - Provide offline fallback pages  
  **Status:** Backlog (#63)

---

## Future / Lower Priority

- **Ranked-Choice Voting Enhancements (Non-Priority)**  
  - Chart visualizations (Chart.js) for election results  
  - Packaging as a mobile PWA or native app  
  **Status:** Backlog (#??)

- **Any Items Not Listed Above**  
  - If added later, insert here with appropriate status/priority.

---

### Notes on “(??)” Items
- If you’re certain an item is already completed, mark it **(Done)** and remove the “(??)” tag.  
- If you confirm that an item still needs work, replace “(??)” with its current status.  

Use this as your single source of truth for all outstanding work on the NSMG website. Keep it updated as issues are closed or new tasks arise.

# To Do List

## ✔️ Completed
- [x] Scaffold `cypress` folder structure (`cypress/e2e`, `cypress/fixtures`, `cypress/plugins`, `cypress/support`).  
- [x] Create `cypress.json` with proper `baseUrl` and e2e config.  
- [x] Create `cypress/support/index.js` and `cypress/plugins/index.js`.  
- [x] Add a sample spec (`sample_spec.cy.js`) to verify Cypress installation.  
- [x] Save all Cypress config and support files.

## ⏳ Pending

### Cypress Setup
- [ ] Create real Cypress spec files under `cypress/e2e` (with `.cy.js` suffix):
  - `header_navigation.cy.js`
  - `mobile_nav.cy.js`
  - `contact_form.cy.js`
  - `services_dashboard.cy.js`
  - `pricing_table.cy.js`
  - `blog_page.cy.js`
  - `testimonials.cy.js`
  - `pricing_api.cy.js`
  - `equipment_api.cy.js`
  - `blog_api.cy.js`
  - _(optional)_ `a11y_spec.cy.js`  
- [ ] Update `cypress.json` or `cypress.config.js` specPattern to `"cypress/e2e/**/*.cy.js"`.  
- [ ] Run and verify all real Cypress specs against the local server.

### Local Server Setup (XAMPP)
- [ ] Stop Apache in XAMPP Control Panel.  
- [ ] Backup `httpd.conf` and `httpd-vhosts.conf`.  
- [ ] Configure Apache to serve the project:
  - **Option A:** Change `DocumentRoot` to `E:/Website`.  
  - **Option B:** Set up a VirtualHost (`mysite.local`) pointing to `E:/Website`.  
- [ ] _(If Option B)_ Map `mysite.local` → `127.0.0.1` in Windows `hosts` file.  
- [ ] Restart Apache and verify site at `http://localhost/` or `http://mysite.local/`.

### Database Sync
- [ ] Export live MySQL database to `my_live_db.sql` (phpMyAdmin or `mysqldump`).  
- [ ] Create local database `my_live_db` in XAMPP’s phpMyAdmin.  
- [ ] Import the SQL dump into the local database (phpMyAdmin Import or CLI).  
- [ ] Verify tables and data in the local database.  
- [ ] Update `db_connect.php` to use:
  ```php
  $host     = 'localhost';
  $db_name  = 'my_live_db';
  $db_user  = 'root';
  $db_pass  = '';

# ✅ Chat-Based To-Do List — June 7, 2025

---

## ✅ Completed Items

- [x] Installed GitHub CLI (`gh`) and authenticated access.
- [x] Exported all GitHub Issues to CSV using PowerShell and `gh` CLI.
- [x] Converted GitHub issues to Jira-importable CSV format.
- [x] Imported issues into Jira via External System Import.
- [x] Generated new Sprint 2 Testing Issue: NSM-72.
- [x] Converted and matched old GitHub issue numbers with new Jira issue keys.
- [x] Updated `ISSUES.md` to reflect Jira issue keys instead of old GitHub numbers.

---

## 📌 In Progress / Follow-up Items

- [ ] Update `ISSUES.md` with new entries as future Jira issues are added.
- [ ] Begin final QA review of all Sprint 2 issues under NSM-72.
- [ ] Finalize `Sprint 2` Jira issues and update their status once verified.
- [ ] (Optional) Export or sync updated Jira issue keys back into `TODO.md` for alignment with markdown-based tracking.

---

## 🗂 Related Files Created/Updated

- `github_issues.csv` — Original GitHub export
- `jira_issues_ready.csv` — Reformatted for Jira import
- `ISSUES_updated.md` — Rewritten to use NSM Jira keys instead of GitHub numbers

Let me know if you'd like me to:
- Push the updated `ISSUES.md` back to your repository
- Update the main `TODO.md` based on Jira statuses
- Prepare a Sprint 3 Testing issue template

# Homepage Redesign – Consolidated TO DO List

## ✅ Completed

- Decided on a modern homepage structure and user flow
- Created new variable-based color palette for :root (pending full conversion in CSS)
- Built HTML outline for all homepage sections (hero, services, testimonials, portfolio, blog, about, CTA)
- Added homepage-specific section/class names for modular JS and CSS
- Developed `/js/modules/homepage.js` with dynamic content loading for all key homepage sections
- Provided full, modern, variable-based CSS for polished homepage cards (services, testimonials, portfolio, buttons, etc.)
- Established clear plan for modular styling and theming going forward

---

## ⏳ In Progress

- **NSM-75 – Homepage: Services Not Displaying**  
  Debug why homepage services section is not showing content; check JS fetch, backend endpoint, and data mapping.

- Migrate all existing hardcoded colors in CSS (homepage and sitewide) to use the new :root variables for brand, background, text, and button colors.
- Continue testing homepage dynamic JS modules to ensure testimonials, portfolio, and blog posts appear as expected.
- Adjust `/js/modules/homepage.js` and homepage HTML as needed for API/data structure changes.

---

## 🔜 To Do

- Add or update CSS classes (e.g., `.service-card`, `.testimonial-card`, `.portfolio-thumb`) in `/css/homepage.css` to use only color variables.
- Add (or enhance) basic animation/slider controls for the testimonials carousel (optional polish).
- Create fallback/loading state UI for homepage sections while fetch requests are pending.
- Review and update meta description and accessibility tags on homepage for SEO.
- Fully test on mobile—adjust flex/grid settings if needed for services, testimonials, and portfolio sections.
- Prepare for future theming or palette changes by centralizing all color and style variables.

---

## 🗂 Reference Jira/GitHub Issues

- NSM-22: Homepage Content Structure and HTML Layout (Complete)
- NSM-23: Homepage Dynamic Content Modules and Styling (In Progress)
- NSM-75: Homepage: Services Not Displaying (In Progress)

# Website PowerShell Utility Scripts – TO DO List (from Chat)

## ✅ Completed

- [x] Confirmed use of CSS color variables across all CSS files.
- [x] Investigated why hero text color was dark (resolved CSS variable and selector conflict).
- [x] Confirmed `images.css` is not used anywhere in current HTML.
- [x] Created, discussed, and debugged various PowerShell utility scripts:
    - [x] `find-unused-css.ps1`
    - [x] Basic script for printing all HTML files from `/scripts/` folder
    - [x] Confirmed correct way to run PowerShell scripts from project root or `/scripts/`
- [x] Excluded specific folders (`node_modules`, `cypress`, `ranked-choice`, `scripts`) in `find-unused-js.ps1`
- [x] Successfully ran PowerShell scripts with correct relative paths.

---

## 🔲 In Progress / To Do

- [ ] Revisit and debug `count-classes-ids.ps1` script (table of classes/IDs used in HTML/CSS).
- [ ] Add more recommended utility scripts for web project maintenance.
- [ ] Document all custom scripts in a markdown reference for offline use.
- [ ] (Optional) Expand scripts to handle:
    - [ ] Excluding additional folders as needed
    - [ ] Checking JS imports/require statements for extensions and relative paths
    - [ ] Improved accuracy for “used” assets (e.g., referenced only in JS modules)
- [ ] Add more scripts by request (e.g., batch kebab-case renamer, file type audit, modified-in-X-days, etc.).
- [ ] Organize `/scripts/` folder and maintain script usage/readme documentation.

# NSMG Website Troubleshooting & Improvements TO DO (from this Chat)

---

## ✅ Completed

- [x] Verified and fixed Apache/XAMPP virtual host configuration to use `nsmg.local`
- [x] Confirmed `hosts` file entry and tested custom local domain
- [x] Identified missing `/php/get_services.php` file as cause of 404
- [x] Created/updated `get_services.php` to fetch data from MySQL, using `db_connect.php`
- [x] Modified SQL query in `get_services.php` to only show `active` services
- [x] Set default `limit` in `get_services.php` to 10
- [x] Confirmed PHP endpoint returns correct number of items in browser
- [x] Located hardcoded limit in homepage JS fetch (`/js/modules/homepage.js`)
- [x] Updated homepage JS fetch to request desired number of services (e.g. 10)
- [x] Verified that increasing the limit in JS correctly displays more services on the homepage

---

## ⏳ In Progress / Outstanding

- [ ] Check for and update similar hardcoded limits in other homepage modules (e.g., testimonials, portfolio, blog, etc.), if needed
- [ ] Create or update `/php/get_testimonials.php` and other missing backend endpoints, as needed
- [ ] Review and refactor JavaScript to avoid hardcoding limits in multiple places (consider using a variable or config)
- [ ] Test all homepage dynamic sections (services, testimonials, portfolio, blog) to ensure they load correct data/amounts
- [ ] Review all AJAX fetch calls and ensure error handling is user-friendly
- [ ] Document database schema and API endpoints for future maintenance
- [ ] Clean up temporary debugging/error reporting lines in production (e.g., `ini_set('display_errors', 1);`)

---

## 📝 Notes

- Default limits can be controlled in both the frontend JS and backend PHP as needed for flexibility.
- Any section still missing or showing incomplete data should be checked for matching endpoint, file path, and database/table data.
- Continue using browser dev tools (Network & Console tabs) for fast troubleshooting.
