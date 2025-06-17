# NSMG Website Consolidated To-Do List

Below is a reviewed and updated to-do list for the Neil Smith Media Group website.  
Items marked **Done** have been completed.  
Items marked **In Progress** are actively being worked on.  
Items marked **Backlog** have not yet been scheduled.  
Only Jira keys (NSM-XX) are shown.

---

## Testimonials

- **Modify Testimonial Cards**  
  - Limit character-count preview (e.g. 120 chars)  
  - Add a “Read More” / “Read Less” toggle button on each card  
  **Status:** Done

- **Homepage Testimonials Slideshow**  
  - Show 5–10 testimonials as a carousel  
  - Include the “Read More” toggle on each slide  
  - Final slide = “View All Testimonials” → `/testimonials.html`  
  **Status:** Done

- **Dynamic Testimonials Page** **(NSM-16)**  
  - Build `/testimonials.html` to show full list of testimonials  
  - Fetch from `/php/get_testimonials.php` or JSON endpoint  
  **Status:** In Progress

- **Fix Testimonials Carousel on Homepage** **(NSM-88)**  
  - Homepage carousel isn’t rendering slides  
  - Investigate JS fetch/data binding  
  **Status:** Backlog

---

## Global Styles & Layout

- **Review All CSS for Global Variables**  
  - Audit `:root { --primary-color; --secondary-color; … }`  
  - Ensure consistent naming and usage  
  **Status:** Done

- **Ensure Shared Header/Footer/Nav on Every Page**  
  - Each `<head>` loads `navigation.css`, `header.css`, `footer.css`  
  - Pages include `<div id="header-container">` + `<div id="footer-container">` injection  
  **Status:** Done

- **Mobile Styling for All Pages** **(NSM-27, NSM-51)**  
  - Responsiveness for sidebars, dropdowns, forms  
  - Submenu collapse/expand behavior  
  **Status:** In Progress

- **Configure Development Cache Control (Local)** **(NSM-90)**  
  - Disable browser cache in DevTools, add `?v=` query strings, or send no-cache headers in PHP  
  **Status:** Backlog

---

## Equipment

- **Add “＋ / －” Icon for Equipment List Toggling**  
  - Collapse/expand each category with “＋”/“－” icons  
  **Status:** Done

- **Add Equipment Inventory List (Admin Section)**  
  - Group items by category (JSON or SQL)  
  - Multi-column layout, category headers  
  - Future: thumbnails + click-for-more info  
  **Status:** In Progress

- **Finalize Equipment Integration on Service Pages**  
  - Include `<div id="equipment-list" data-category="…">` + `/js/equipment.js`  
  - Verify `/php/get_equipment.php` + JS end-to-end  
  **Status:** In Progress

- **Add “Equipment” to Admin Dashboard**  
  - Sidebar link → `/admin/manage_equipment.html` for CRUD  
  **Status:** In Progress

---

## Admin Dashboard & Backend

- **Expand Admin Dashboard Section** **(NSM-39)**  
  - Overview cards & sidebar links for Service Requests, Manage Services, Blog Management, Portfolio Management, Accounting, Invoicing  
  - Highlight active page in sidebar  
  **Status:** In Progress

- **Remove “ID” Column from Dashboard Tables**  
  - Hide auto-increment `id` column in all admin UIs  
  **Status:** Done  
  _Duplicate of same requirement in multiple tasks_

- **Create SQL Code for Tables**  
  - Schema/migrations for `services`, `pricing`, `equipment`, `testimonials`, etc.  
  **Status:** Done

- **Website Settings Page (Admin)** **(NSM-81)**  
  - UI at `/admin/website_settings.html` for title, meta, email, social links, maintenance mode, logo upload  
  - Backed by `website_settings` table  
  **Status:** Backlog

- **Admin Access / Authentication** **(NSM-82)**  
  - Login/session management for `/admin`  
  - Protect `/php/*` endpoints  
  **Status:** In Progress

- **Set Up CI/CD Pipeline** **(NSM-30)**  
  - GitHub Actions workflow: CI (lint/tests), CD (deploy staging)  
  - Secure secrets (DB, SSH, AWS)  
  **Status:** In Progress

---

## Portfolio & Gallery

- **Add “Gallery” Under Portfolio Dropdown**  
  - Header link to `/gallery/gallery.html` + active highlight  
  **Status:** Done

- **Dynamic Portfolio/Gallery Loading** **(NSM-17)**  
  - JSON endpoint + JS render in `/portfolio.html`  
  **Status:** Backlog

- **Implement Gallery Keyboard & Arrow Navigation** **(NSM-32)**  
  - Left/right arrow key support in gallery  
  **Status:** Backlog

- **Integrate Flickr Account with Gallery/Portfolio** **(NSM-86)**  
  - Configure Flickr API, fetch albums, render thumbnails  
  **Status:** Backlog

- **Portfolio/Gallery Enhancements**  
  - Lightbox grouped by subfolder; future dynamic backend indexing  
  **Status:** In Progress

---

## Services Page

- **Services Page UI Changes** **(NSM-46)**  
  - Left sidebar: Photo, Video, Editing, Other, Pricing, Request a Service  
  - Active button styling, right sidebar equipment list  
  **Status:** In Progress

- **Update `/services/pricing.html`** **(NSM-85, NSM-90)**  
  - Revised markup, fix asset paths, ensure dynamic container exists  
  **Status:** In Progress

- **Embed Pricing in Services Dashboard** **(NSM-77)**  
  - AJAX-load pricing table via `loadPricing()`  
  **Status:** Backlog

- **Confirm Pricing Integration & Edge Cases**  
  - Verify `/php/get_pricing.php` join logic + JS rendering  
  **Status:** Done

- **Fix “Other Services” Content Loading** **(NSM-87)**  
  - Inject `/services/other-services.html` markup when clicked  
  **Status:** Backlog

---

## Pricing Page

- **Pricing Page Updates** **(NSM-49, NSM-85, NSM-86, NSM-89)**  
  - Move styling into `pricing.css`; Package & À La Carte sections; hook up backend endpoint  
  **Status:** In Progress

- **Refine Pricing CSS**  
  - Zebra-striped tables, hover states, responsive scroll  
  **Status:** Done

- **Fix “undefined” in Name Column**  
  - Correct destructuring in JS  
  **Status:** Done

---

## Contact & Service-Request

- **Enhance Contact & Service-Request Forms** **(NSM-47)**  
  - Service Type dropdown; optional location & duration; styled checkboxes; JS + PHP validation  
  **Status:** Done

- **Fix “Thank You” Response**  
  - Ensure AJAX submit shows success & resets form  
  **Status:** Done

---

## Footer & Navigation

- **Update Footer Links** **(NSM-78)**  
  - Add Testimonials, Contact, About, Privacy, Terms & Conditions, Services  
  **Status:** Done

- **Navigation Menu Fixes** **(NSM-51)**  
  - Contrast, dropdown visibility, mobile positioning  
  **Status:** In Progress

- **Investigate Hamburger Menu Issues on Mobile** **(NSM-91)**  
  - Diagnose intermittent toggle failures  
  **Status:** Backlog

- **Add “Blog” Link to Header** **(NSM-19)**  
  - Nav item → `/blog.html`, active highlight  
  **Status:** Done

---

## Blog & Content

- **Populate Blog Page with Data** **(NSM-44)**  
  - Fetch `/php/get_posts.php`; render `<article>` cards  
  **Status:** Done

- **Blog Pagination & Filtering** **(NSM-40, NSM-41)**  
  - Next/Prev navigation; tag/category filters  
  **Status:** Backlog

- **RSS Feed for Blog** **(NSM-47)**  
  - Generate `/rss.xml` from posts or JSON  
  **Status:** Backlog

- **Blog Categories/Tags** **(NSM-46)**  
  - Tagging UI + filter on `/blog.html`  
  **Status:** Backlog

- **Blog Search & Filtering** **(NSM-41)**  
  - Real-time client-side filter  
  **Status:** Backlog

---

## Security & Deployment

- **Allocate & Associate an Elastic IP**  
  - EC2 Elastic IP → instance; update secrets  
  **Status:** Done

- **Point Custom Domain to EC2**  
  - DNS A record for `neilsmith.org` → Elastic IP  
  **Status:** In Progress

- **Install & Configure SSL/HTTPS**  
  - Certbot, port 443, webserver config  
  **Status:** In Progress

- **Move Database Credentials Out of Code** **(NSM-79)**  
  - Use env vars in `db_connect.php`  
  **Status:** Backlog

- **Harden Server Access & phpMyAdmin** **(NSM-68)**  
  - IP restrictions, permissions, low-priv user  
  **Status:** In Progress

- **Harden App Security & Configuration** **(NSM-55)**  
  - Prepared statements, sanitization (SQLi/XSS)  
  **Status:** In Progress

---

## Analytics & Performance

- **Optimize Performance & Caching** **(NSM-31)**  
  - Minify assets, enable gzip/Brotli, set cache headers, lazy-load images  
  **Status:** In Progress

- **Analytics Integration** **(NSM-43)**  
  - Add tracking (e.g. Google Analytics) to `<head>`  
  **Status:** Backlog

- **Conduct Cross-Browser QA** **(NSM-33)**  
  - Test Chrome, Firefox, Safari, Edge, mobile  
  **Status:** Backlog

- **Conduct Accessibility Audit** **(NSM-14)**  
  - Automated (axe, Lighthouse) + manual checks  
  **Status:** In Progress

---

## Error Handling & SEO

- **Custom Error Pages (404 & 500)**  
  - `/404.html`, `/500.html` + server config  
  **Status:** Done

- **Improve 404 Page Layout & Styling** **(NSM-92)**  
  - Center content, responsive padding, maintain header/footer  
  **Status:** Backlog

- **Add SEO Metadata & JSON-LD** **(NSM-15)**  
  - `<meta name="description">`, OG tags, JSON-LD on all pages  
  **Status:** In Progress

---

## Progressive Web App (Future)

- **PWA Offline Support** **(NSM-45)**  
  - Service Worker precache, offline fallback  
  **Status:** Backlog

---

## Developer Workflow Enhancements

- **Add Dynamic Sidebar Content** **(NSM-89)**  
  - “Book a Call,” recent posts, featured equipment widget in sidebar  
  **Status:** Backlog

---

## Future / Lower Priority

- **Ranked-Choice Voting Enhancements**  
  - Chart visualizations, PWA packaging  
  **Status:** Backlog

---

### Notes on Legacy & Duplicate Items

- The “Remove ‘ID’ Column from Dashboard Tables” requirement appears in multiple tasks (duplicate).  
- All original details are retained for traceability.  
- Remove any remaining “(??)” markers once confirmed and update status accordingly.  
