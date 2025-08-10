# Dynamic Site Migration Plan (NSMG)
_Last updated: 2025-08-09_

This plan turns the current mostly-static site into a **dynamic, server‑rendered** app with a secure admin, clean URLs, templating, and an API. It’s phased, PowerShell-friendly, and keeps PHP (your current stack) to minimize churn.

---

## Goals
- Server-rendered pages with shared layouts/partials
- Admin CRUD for portfolio, testimonials, blog posts, equipment, accounting
- JSON API for selected data (to power carousels/widgets)
- Proper routing (pretty URLs), security headers, sessions, CSRF
- SEO-safe: canonical URLs, consistent metadata, dynamic sitemap

---

## Architecture (choose one)
**Recommended: Option A (Fastest to Production).**

### Option A — Lightweight PHP microframework + templating (recommended)
- **Framework:** Slim 4 (router, middleware)
- **Templating:** Twig (shared layout, partials)
- **HTTP:** PSR‑7 (slim/psr7)
- **Config:** Dotenv (.env), per-env settings
- **DB:** MySQL (prod), SQLite (dev) via PDO
- **Pros:** Minimal boilerplate, easy migration page-by-page, excellent control
- **Cons:** You wire pieces together (auth, CSRF, etc.)

### Option B — Laravel (batteries included)
- **Pros:** Auth, migrations, Blade, Eloquent, queues, testing
- **Cons:** Heavier; larger leap from current structure

### Option C — Headless API + JS front-end (e.g., Next.js)
- **Pros:** SPA/SSR flexibility
- **Cons:** Two stacks to run/secure; overkill today

> Decision: **Option A** (Slim + Twig). We can pivot later if needs grow.

---

## Directory Layout (proposed)
```
/app
  /Controllers         ← page + admin controllers
  /Domain              ← services/use-cases (business logic)
  /Models              ← DB access (PDO) + repositories
/config
  app.php              ← env-aware config (DB creds, base URL)
/public                ← webroot (only this is exposed)
  .htaccess            ← rewrite to index.php
  index.php            ← bootstrap
/resources
  /views               ← Twig templates
    /layouts           ← base.twig, admin_base.twig
    /partials          ← header.twig, footer.twig, meta.twig
    home.twig, about.twig, privacy.twig, terms.twig, services.twig...
/routes
  web.php              ← public routes
  admin.php            ← admin routes
/scripts               ← utilities (generate-sitemap.js, Export-Jira.ps1)
/storage               ← logs, cache, uploads (not web-accessible)
/vendor                ← composer deps
```

---

## Data Model (initial tables)
Use MySQL (prod) and SQLite (dev). Keep IDs as bigint autoincrement; UTC timestamps.

```sql
-- services
CREATE TABLE services (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) UNIQUE NOT NULL,
  title VARCHAR(160) NOT NULL,
  summary TEXT,
  body MEDIUMTEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- portfolio items
CREATE TABLE portfolio_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(160) UNIQUE NOT NULL,
  description TEXT,
  cover_image VARCHAR(255),
  gallery JSON NULL,
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- testimonials
CREATE TABLE testimonials (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  author VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  rating TINYINT NULL,
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- blog posts (optional to start)
CREATE TABLE posts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(160) UNIQUE NOT NULL,
  excerpt TEXT,
  body MEDIUMTEXT,
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- service requests (contact/quote)
CREATE TABLE service_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NULL,
  service_slug VARCHAR(120) NULL,
  message TEXT NOT NULL,
  status ENUM('new','in_progress','closed') DEFAULT 'new',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- equipment
CREATE TABLE equipment (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  category VARCHAR(120) NULL,
  owner VARCHAR(120) NULL,
  condition VARCHAR(80) NULL,
  retired TINYINT(1) DEFAULT 0,
  last_used DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- accounting entries
CREATE TABLE accounting_entries (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  entry_date DATE NOT NULL,
  type ENUM('income','expense') NOT NULL,
  category VARCHAR(120) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NULL,
  reference VARCHAR(160) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- users (admin auth)
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(180) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','editor') DEFAULT 'admin',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

---

## Routing Map (initial)
- `GET /` → HomeController@index
- `GET /about` → PageController@about
- `GET /privacy` → PageController@privacy
- `GET /terms` → PageController@terms
- `GET /services` → ServicesController@index
- `GET /services/{slug}` → ServicesController@show
- `GET /portfolio` → PortfolioController@index
- `GET /portfolio/{slug}` → PortfolioController@show
- `GET /blog` → BlogController@index
- `GET /blog/{slug}` → BlogController@show
- `GET /testimonials` → TestimonialsController@index

_Admin_
- `GET /admin` (dashboard — gated)
- `GET /admin/login` / `POST /admin/login` / `POST /admin/logout`
- CRUD: `/admin/portfolio`, `/admin/testimonials`, `/admin/services`, `/admin/equipment`, `/admin/accounting`

_API (v1)_
- `GET /api/v1/testimonials`
- `GET /api/v1/portfolio`
- `POST /api/v1/service-requests` (CSRF for browser, token for external if exposed)

---

## Security
- Sessions: `httponly`, `secure` (HTTPS), `SameSite=Lax`; regenerate on login
- CSRF: middleware for `POST/PUT/PATCH/DELETE`
- Headers (via bootstrap or web server):
  - `Content-Security-Policy: default-src 'self'`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: no-referrer-when-downgrade`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Input validation + output escaping
- Rate-limit login; generic error messages

---

## Migration Strategy (phased)
### Phase 0 — Bootstrap (1–2 days)
- [ ] Add Composer + Slim + Twig skeleton
- [ ] Introduce `/public` webroot + `.htaccess` rewrite
- [ ] Base layout (`base.twig`) + header/footer partials
- [ ] Static pages moved to Twig views

### Phase 1 — Services & Testimonials (2–4 days)
- [ ] DB connection + migrations
- [ ] Services from DB; dynamic anchors for subservices
- [ ] Testimonials list + admin CRUD (basic)

### Phase 2 — Portfolio (3–5 days)
- [ ] Portfolio index + detail pages, responsive images
- [ ] Admin CRUD + media references

### Phase 3 — Contact/Requests (2–3 days)
- [ ] Public form → saves to `service_requests` + optional email
- [ ] Admin view + status updates

### Phase 4 — Admin Hardening (ongoing)
- [ ] Auth, sessions, CSRF, security headers
- [ ] Audit fields (`created_by`, etc.), logs

### Phase 5 — API v1 + Caching (2–3 days)
- [ ] Public GET endpoints for widgets
- [ ] Microcaching of JSON and HTML fragments

### Phase 6 — CI & Deploy
- [ ] Lint + PHP syntax checks on PRs
- [ ] Deploy strategy (rsync/FTP or container) and rollback

---

## Local Dev: Setup (PowerShell)
> Requires PHP 8.2+ and Composer.

```powershell
# From repo root
php -v
composer -V

# Initialize composer (skip if already present)
composer init --no-interaction

# Add minimal deps
composer require slim/slim:^4 slim/psr7:^1 twig/twig:^3 vlucas/phpdotenv:^5

# Create folders
mkdir -Force public, app\Controllers, app\Models, app\Domain, routes, resourcesiews\{layouts,partials}, config, storage\logs

# Start PHP dev server
php -S localhost:8080 -t public
```

Create a `.env` (do not commit):
```
APP_ENV=local
APP_DEBUG=1
BASE_URL=http://localhost:8080

DB_DRIVER=sqlite
DB_PATH=storage/dev.sqlite
# For MySQL (prod)
# DB_DRIVER=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_NAME=nsmg
# DB_USER=nsmg
# DB_PASS=secret
```

---

## Starter Files (drop-in)

### `public/.htaccess`
```apache
Options -Indexes

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Serve existing files directly
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Route everything else to index.php
  RewriteRule ^ index.php [QSA,L]
</IfModule>

Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "DENY"
Header set Referrer-Policy "no-referrer-when-downgrade"
```

### `public/index.php`
```php
<?php
declare(strict_types=1);

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

// Env
$root = dirname(__DIR__);
$dotenvPath = $root;
if (file_exists($dotenvPath . '/.env')) {
  $dotenv = Dotenv\Dotenv::createImmutable($dotenvPath);
  $dotenv->load();
}

// Session
ini_set('session.cookie_httponly', '1');
ini_set('session.use_strict_mode', '1');
if (!headers_sent()) { session_start(); }

$app = AppFactory::create();

// Base path (if in subdir, adjust here)
$app->setBasePath('');

// Error middleware (dev only)
$displayErrorDetails = ($_ENV['APP_DEBUG'] ?? '0') === '1';
$errorMiddleware = $app->addErrorMiddleware($displayErrorDetails, true, true);

// Twig
$twig = new \Twig\Environment(new \Twig\Loader\FilesystemLoader($root . '/resources/views'), [
  'cache' => false,
]);

// Simple container-ish helpers
$container = [
  'view' => $twig,
  'config' => [
    'base_url' => $_ENV['BASE_URL'] ?? '',
  ],
];

// Routes
(require $root . '/routes/web.php')($app, $container);
(require $root . '/routes/admin.php')($app, $container);

// Run
$app->run();
```

### `routes/web.php`
```php
<?php
declare(strict_types=1);

use Slim\App;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/** @return callable */
return function (App $app, array $c) {
  $view = $c['view'];

  $app->get('/', function (Request $req, Response $res) use ($view) {
    $html = $view->render('home.twig', ['title' => 'Home']);
    $res->getBody()->write($html);
    return $res;
  });

  $app->get('/about', function (Request $req, Response $res) use ($view) {
    $html = $view->render('about.twig', ['title' => 'About']);
    $res->getBody()->write($html);
    return $res;
  });

  $app->get('/privacy', function (Request $req, Response $res) use ($view) {
    $html = $view->render('privacy.twig', ['title' => 'Privacy Policy']);
    $res->getBody()->write($html);
    return $res;
  });

  $app->get('/terms', function (Request $req, Response $res) use ($view) {
    $html = $view->render('terms.twig', ['title' => 'Terms & Conditions']);
    $res->getBody()->write($html);
    return $res;
  });
};
```

### `routes/admin.php` (stub)
```php
<?php
declare(strict_types=1);

use Slim\App;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/** @return callable */
return function (App $app, array $c) {
  $view = $c['view'];

  $app->get('/admin', function (Request $req, Response $res) use ($view) {
    // TODO: gate with session check
    $html = $view->render('admin/dashboard.twig', ['title' => 'Admin']);
    $res->getBody()->write($html);
    return $res;
  });
};
```

### `resources/views/layouts/base.twig`
```twig
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{% if title %}{{ title }} | {% endif %}Neil Smith Media Group</title>
  <meta name="description" content="{% block meta_description %}Photography, videography, and editing services.{% endblock %}">
  <link rel="stylesheet" href="/css/global.css">
  <link rel="stylesheet" href="/css/layout.css">
  <link rel="stylesheet" href="/css/header.css">
  <link rel="stylesheet" href="/css/navigation.css">
  <link rel="stylesheet" href="/css/footer.css">
  <link rel="stylesheet" href="/css/mobile.css">
  {% block head_extra %}{% endblock %}
</head>
<body>
  <a class="skip-link" href="#main">Skip to main content</a>
  {% include 'partials/header.twig' %}
  <main id="main">
    {% block content %}{% endblock %}
  </main>
  {% include 'partials/footer.twig' %}
  <script type="module" src="/js/main.js" defer></script>
</body>
</html>
```

### `resources/views/home.twig`
```twig
{% extends "layouts/base.twig" %}
{% block meta_description %}Your story. Captured. Edited. Delivered.{% endblock %}
{% block content %}
<section id="hero">
  <h1>Your Story.<br/>Captured. Edited. Delivered.</h1>
  <p>Neil Smith Media Group offers photography, videography, and editing services with a focus on creativity and client satisfaction.</p>
  <a href="/services" class="hero-cta">View Our Services</a>
</section>
{% endblock %}
```

> Repeat for `about.twig`, `privacy.twig`, `terms.twig` by porting your existing markup into `{% block content %}`.

---

## CI & Deployment (outline)
- Add a GitHub Action to run `php -l` over all PHP files + lint HTML/CSS/JS
- Optionally build a small Docker image (`php:8.2-apache`), copy `/public` + app, mount `/storage`
- Deploy via rsync/FTP to your host or run the container on a VPS; ensure `.env` is set server-side
- Configure Apache/Nginx to point the webroot at `/public`

---

## Risks & Decisions
- **Framework choice**: Slim is recommended for speed; Laravel is available if you want more batteries later
- **DB**: SQLite for dev (simple), MySQL for prod (scales)
- **Auth**: Start simple (session + password_hash); grow to roles as needed
- **Media**: Store paths in DB, files in `/media`; consider a future object store (S3) if needed

---

## Sprint Checklist (copy/paste to Jira)
- [ ] Phase 0: Bootstrap Slim+Twig, public webroot, base layout, port Home/About/Privacy/Terms
- [ ] Phase 1: Services from DB, testimonials list, admin CRUD for testimonials
- [ ] Phase 2: Portfolio list/detail + admin CRUD
- [ ] Phase 3: Contact & service request intake + admin view
- [ ] Phase 4: Admin auth hardening, CSRF, headers, audit fields
- [ ] Phase 5: API v1 + microcaching
- [ ] Phase 6: CI checks + deployment pipeline