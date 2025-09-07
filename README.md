# Neil Smith Media Group — Website

_Updated: 2025-09-07_

Public marketing site with dynamic sections (Services, Blog, Portfolio) and a light PHP backend for data and forms. Front end is **static HTML/CSS/JS** (ES modules). Backend uses **PHP 8+** for endpoints (contact form, utilities). **Jira** is the source of truth for issues/sprints/epics. Deploys via GitHub Actions or cPanel/FTP as needed.

---

## Contents
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Environment & Secrets](#environment--secrets)
- [Contact Flow & Email (NSM-142/145/146/151)](#contact-flow--email-nsm-142145146151)
- [Service Region Messaging (NSM-152)](#service-region-messaging-nsm-152)
- [Sticky Header & WIP Banner (NSM-144/143)](#sticky-header--wip-banner-nsm-144143)
- [Admin Auth (NSM-82)](#admin-auth-nsm-82)
- [Testing & QA](#testing--qa)
- [Issues & Workflow](#issues--workflow)
- [Deployment](#deployment)
- [Maintenance & Ops](#maintenance--ops)
- [Roadmap & Sprints](#roadmap--sprints)
- [Release Checklist](#release-checklist)
- [Contributing](#contributing)
- [License](#license)

---

## Getting Started

### Prerequisites
- [ ] **Git**
- [ ] **PHP 8+** (CLI + server runtime)
- [ ] **Composer** (for `vendor/` dependencies)
- [ ] **VS Code** (recommended) with PHP + Markdown extensions

### Quick start (serve locally)
```powershell
# From repo root
php -S 127.0.0.1:8000 -t .\Website
# Visit http://127.0.0.1:8000
```
> VS Code “Live Server” works for static HTML, but PHP endpoints require the PHP server above.

---

## Project Structure
```
/
├─ Website/
│  ├─ index.html
│  ├─ header.html
│  ├─ footer.html
│  ├─ about-us/              # About, Contact, Privacy, Terms
│  ├─ css/
│  │  ├─ navigation.css
│  │  ├─ homepage.css
│  │  ├─ sticky-header.css   # NSM-144
│  │  └─ wip.css             # NSM-143
│  ├─ js/
│  │  ├─ main.js
│  │  └─ modules/
│  │     ├─ contact.js       # NSM-145/146/151/142
│  │     └─ site-settings.js # NSM-152
│  ├─ json/
│  │  └─ site-settings.json  # NSM-152
│  ├─ php/
│  │  ├─ includes/
│  │  │  ├─ db.php
│  │  │  ├─ util.php
│  │  │  └─ mail.php         # NSM-142 (PHPMailer if available; mails fallback otherwise)
│  │  ├─ geo_access.php      # NSM-152 (US-only stub; off by default)
│  │  └─ submit_contact.php  # NSM-145/146/151/142
│  ├─ 403-us-only.html       # NSM-152 (optional)
│  └─ media/                 # icons/logos/etc. (prefer lowercase paths)
├─ scripts/
│  ├─ Add-StickyHeaderLink.ps1     # NSM-144
│  ├─ Add-SiteSettingsModule.ps1   # NSM-152
│  └─ Build-IssuesFromApi.ps1      # Sync ISSUES.md from Jira (gitignored on deploy)
├─ composer.json
└─ vendor/                   # created by Composer; DEPLOY with site
```

---

## Local Development

### 1) Optional local PHP config
If you need local DB or overrides, create **`Website/php/config.local.php`** (do **not** commit):
```php
<?php
// Example overrides
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'nsmg');
define('DB_USER', 'nsmg');
define('DB_PASS', 'CHANGE_ME');
```

Include it in your PHP entry points if desired:
```php
$local = __DIR__ . '/config.local.php';
if (file_exists($local)) { require_once $local; }
```

### 2) Run a local server
```powershell
php -S 127.0.0.1:8000 -t .\Website
```

### 3) Verify modules
- [ ] Header/footer load (via `main.js`)
- [ ] Contact form posts to `/php/submit_contact.php` and shows success
- [ ] Service region text appears (if enabled in `json/site-settings.json`)

---

## Environment & Secrets
- **Never commit secrets.** Keep SMTP creds and other secrets off git.
- Use `Website/secure-config/config.php` **on the server** for SMTP; block web access with:
  ```
  Website/secure-config/.htaccess
  -------------------------------
  Require all denied
  ```
- **Case-sensitive assets:** Use lowercase paths/filenames under `/media`, `/css`, `/js`.

---

## Contact Flow & Email (NSM-142/145/146/151)

**What’s included**
- **Front-end**: `Website/js/modules/contact.js`
- **Endpoint**: `Website/php/submit_contact.php`
- **DB**: Inserts into `contact_messages` (includes optional `phone`)
- **Meta table**: Auto-creates `contact_messages_meta` (IP, UA, timestamp) for rate-limiting/audit
- **Honeypot**: Hidden `website` field blocks common bots
- **Rate limit**: Default **5 submissions / 10 minutes / IP**
- **Notifications**: `Website/php/includes/mail.php` sends email
  - Uses **PHPMailer** if `vendor/` is present; otherwise falls back to `mail()`
  - Gmail/Workspace SMTP supported via **App Password**

**SMTP (Google Workspace) quick setup**
1. Create **App Password** for `contact@neilsmith.org`  
2. Install PHPMailer:
   ```powershell
   # in repo root
   composer require phpmailer/phpmailer:^6.9
   Test-Path .\vendor\autoload.php
   ```
3. Server-only config: `Website/secure-config/config.php`
   ```php
   <?php
   return ['smtp' => [
     'host' => 'smtp.gmail.com',
     'port' => 465,         // or 587
     'secure' => 'ssl',     // or 'tls' for 587
     'username' => 'contact@neilsmith.org',
     'password' => 'APP_PASSWORD_16_CHARS',
     'from' => 'contact@neilsmith.org',
     'from_name' => 'Neil Smith Media Group',
     'to' => 'contact@neilsmith.org'
   ]];
   ```
4. Deploy **`vendor/`** with the site

**Endpoint smoke test**
```powershell
Invoke-WebRequest -Method POST `
  -Uri "https://neilsmith.org/php/submit_contact.php" `
  -Body @{ name="Readme Test"; email="test@example.com"; category="General"; message="Hello" } `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```

---

## Service Region Messaging (NSM-152)

**Config:** `Website/json/site-settings.json`
```json
{
  "serviceRegion": {
    "enabled": true,
    "text": "Serving: Greater Orlando, FL",
    "country": "US",
    "states": ["FL"],
    "cities": ["Orlando", "Winter Park", "Kissimmee"]
  },
  "accessControl": { "usOnly": false }
}
```

**Module:** `Website/js/modules/site-settings.js`  
- Renders the region text to `#service-region-text` or `[data-service-region]` (falls back to footer if not present)  
- Injects **LocalBusiness** JSON-LD with `areaServed`

**Add to every page (one-time helper)**
```powershell
.\scripts\Add-SiteSettingsModule.ps1 -Root ".\Website" -Backup
```

> US-only access is a **stub** (`php/geo_access.php`) and remains **off** until geo rules are added at the edge.

---

## Sticky Header & WIP Banner (NSM-144/143)

- **Sticky header (desktop/tablet only):** `Website/css/sticky-header.css`
  - Ensure it’s linked on all pages. If not:
    ```powershell
    .\scripts\Add-StickyHeaderLink.ps1 -Root ".\Website" -Backup
    ```
- **WIP banner sizing:** `Website/css/wip.css`
  - Responsive, capped height overlay to avoid page inflation

---

## Admin Auth (NSM-82)

_Tracked work:_ Login, session security (HttpOnly/Secure/SameSite), CSRF tokens for admin endpoints, guard include for `/admin/*` and sensitive `/php/*`. Until NSM-82 is complete, restrict access to admin tools at the host level.

---

## Testing & QA

### High-value manual checks
- [ ] **Contact:** success path, 422 validation, and 429 rate-limit behavior
- [ ] **DB:** rows appear in `contact_messages` and `contact_messages_meta`
- [ ] **Email:** notification arrives (SMTP), Reply-To set to submitter
- [ ] **Service region:** text displays; JSON-LD present; toggle `enabled` to verify hide/show
- [ ] **Sticky header:** sticks on ≥768px; not sticky on mobile
- [ ] **A11y:** labels, focus ring, `aria-live` on form status
- [ ] **Perf:** caches and asset sizes reasonable (see NSM-31 plan)

---

## Issues & Workflow

- **Jira** is the system of record. Create/track work there.
- `ISSUES.md` can be refreshed from Jira:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
  .\scripts\Build-IssuesFromApi.ps1 -ProjectKey "NSM" -OutPath ".\ISSUES.md"
  ```

**Branch & PR**
- Branch: `feat/...`, `fix/...`, `chore/...` + include Jira key (e.g., `feat/service-region-NSM-152`)
- Commit subject: `feat(contact): add SMTP notifications (NSM-142)`
- Link PR to the Jira ticket

---

## Deployment

- **GitHub Actions** (preferred): see workflow under `.github/workflows/*` if present
- **Manual**: upload `Website/` and **`vendor/`** (Composer) to hosting. Ensure `.htaccess` and PHP version 8+.

**Post-deploy quick checks**
```powershell
# Headers (HSTS, etc.)
Invoke-WebRequest https://neilsmith.org/ | Select-Object -ExpandProperty Headers

# Contact POST
Invoke-WebRequest -Method POST `
  -Uri "https://neilsmith.org/php/submit_contact.php" `
  -Body @{ name="Deploy Test"; email="test@example.com"; category="General"; message="Hi" } `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```

---

## Maintenance & Ops

### Email deliverability (Workspace)
- **SPF (root TXT)** — single record:
  ```
  v=spf1 include:_spf.google.com include:websitewelcome.com ~all
  ```
- **DKIM (TXT at `<selector>._domainkey`)** — generate in Google Admin → Gmail → DKIM  
  If HostGator UI truncates the value, paste as **multiple quoted strings** in one TXT record (DNS concatenates).
- **DMARC (TXT at `_dmarc`)** — start monitor mode:
  ```
  v=DMARC1; p=none; rua=mailto:postmaster@neilsmith.org; fo=1
  ```

### Backups / Monitoring (tracked)
- Nightly DB + media backups with retention, restore drill (NSM-122)
- Error tracking (FE + PHP) (NSM-118)
- Broken link checks (NSM-125)

---

## Roadmap & Sprints

- **Sprint 6** (started 2025-09-01)
  - **Done:** NSM-141, NSM-145, NSM-146, NSM-143, NSM-144, NSM-123
  - **In testing:** **NSM-142** (contact hardening + SMTP)
  - **In progress:** **NSM-152** (service region + JSON-LD)
  - **Stretch:** NSM-31 (performance & caching)

---

## Release Checklist

- [ ] CI/build/lint pass (if enabled)
- [ ] Security headers present (NSM-123); HSTS on HTTPS
- [ ] Contact flow: success, DB insert, rate-limit, notification (NSM-145/146/142)
- [ ] Service region displays & JSON-LD valid (NSM-152)
- [ ] Sticky header works on desktop, not on mobile (NSM-144)
- [ ] No console errors; a11y basics pass
- [ ] DNS: SPF single record; DKIM authenticated; DMARC present
- [ ] Vendor deployed (PHPMailer available) and secure-config present on server

---

## Contributing

- Keep filenames/paths **lowercase**
- Avoid inline scripts/styles that future CSP may block
- Add ARIA labels and focus states for interactive elements
- Update this README when you add endpoints or modules

---

## License
MIT © Neil Smith
