/* /js/pages/services.js
   Services dashboard loader — no-scroll, fragment-only content, and script execution.

   What this does:
   - Prevents scroll jumps (no location.hash changes; focus with preventScroll).
   - Loads only the meaningful fragment from target pages (not the whole doc).
   - Extracts and EXECUTES inline and external <script> tags found in the fragment,
     resolving relative paths against the fetched page’s URL so SQL/data JS runs.
   - Tries multiple candidate URLs (esp. Pricing) until one works; logs which matched.
*/

(() => {
  // Safety: avoid browser auto scroll restoration on history nav
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch {}

  const MAIN_ID   = 'services-content'; // <main id="services-content">
  const DRAWER_ID = 'services-drawer';
  const TOGGLE_ID = 'services-toggle';

  // Candidate URL lists per service (RELATIVE first for Live Preview + subfolder hosting)
  const SERVICE_CANDIDATES = {
    photography:     ['services/photography.html', './services/photography.html'],
    videography:     ['services/videography.html', './services/videography.html'],
    editing:         ['services/editing.html', './services/editing.html'],
    'other-services':['services/other-services.html', './services/other-services.html'],
    pricing: [
      // Best inside dashboard: embedded pricing at site root
      'pricing.html?embed=1',
      './pricing.html?embed=1',
      // Optional dashboard file if present
      'pricing-dashboard.html',
      './pricing-dashboard.html',
      // Service subpath fallbacks
      'services/pricing.html?embed=1',
      './services/pricing.html?embed=1',
      'services/pricing.html',
      './services/pricing.html',
      // Absolute last-resort (works on real server)
      '/pricing.html?embed=1',
      '/pricing-dashboard.html'
    ],
    'request-form':  ['services/request-form.html', './services/request-form.html', 'services/request.html', './services/request.html']
  };

  // Fine-grained fragment selectors per service (tried in order)
  const SERVICE_FRAGMENT_SELECTORS = {
    'request-form': ['#request-form','form[action*="request"]','[data-fragment="request-form"]','main','[role="main"]','section[id*="request"]'],
    pricing: ['#pricing-section','#pricing-main','[data-fragment="pricing"]','main','[role="main"]'],
    photography:     ['[data-fragment="service"]','main','[role="main"]','article','section'],
    videography:     ['[data-fragment="service"]','main','[role="main"]','article','section'],
    editing:         ['[data-fragment="service"]','main','[role="main"]','article','section'],
    'other-services':['[data-fragment="service"]','main','[role="main"]','article','section']
  };

  const main = document.getElementById(MAIN_ID);
  if (!main) return;

  // Ensure a mount node exists
  let mount = main.querySelector('#service-mount');
  if (!mount) {
    mount = document.createElement('div');
    mount.id = 'service-mount';
    const placeholder = document.getElementById('service-placeholder');
    if (placeholder && placeholder.parentNode === main) {
      placeholder.insertAdjacentElement('afterend', mount);
    } else {
      main.appendChild(mount);
    }
  }

  function closeDrawerIfOpen() {
    const drawer = document.getElementById(DRAWER_ID);
    const toggle = document.getElementById(TOGGLE_ID);
    if (drawer && drawer.classList.contains('open')) {
      drawer.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  }

  // Try candidates in order until one returns 200
  async function fetchFirstOk(candidates) {
    const errors = [];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { credentials: 'same-origin', cache: 'no-cache' });
        if (res.ok) {
          const text = await res.text();
          console.info(`[services] Loaded fragment from: ${url}`);
          return { url, text };
        }
        errors.push({ url, status: res.status });
      } catch (e) {
        errors.push({ url, status: 'network', err: String(e) });
      }
    }
    console.error('[services] All candidates failed:', errors);
    throw new Error('All candidate URLs failed to load.');
  }

  // Parse HTML and return { html: fragmentHTML, scripts: [ScriptDescriptor...] }
  function extractFragmentAndScripts(html, serviceKey, fetchedUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const serviceSelectors = SERVICE_FRAGMENT_SELECTORS[serviceKey] || [];
    const generalSelectors = ['[data-fragment="content"]','main','[role="main"]','#content','#page','article','section'];
    const candidates = [...serviceSelectors, ...generalSelectors];

    let node = null;
    for (const sel of candidates) {
      const found = doc.querySelector(sel);
      if (found) { node = found.cloneNode(true); break; }
    }
    if (!node) node = doc.body.cloneNode(true);

    // Collect scripts BEFORE we remove anything; we need to replay them later
    const rawScripts = Array.from(node.querySelectorAll('script'));

    // Scrub things we never want inside dashboard (header/footer/sidebars)
    node.querySelectorAll('#header-container, #site-header, header, #footer-container, footer, .sidebar').forEach(el => el.remove());
    // Remove script elements from the HTML we’ll inject; we’ll re-execute them manually
    node.querySelectorAll('script').forEach(el => el.remove());
    // Optional: strip <link rel="stylesheet"> inside fragments to avoid dup CSS (keep site globals)
    // node.querySelectorAll('link[rel="stylesheet"]').forEach(el => el.remove());

    // Build a list of script descriptors with resolved src URLs
    const base = new URL(fetchedUrl, location.href);
    const scripts = rawScripts.map(s => {
      const type = (s.getAttribute('type') || '').trim(); // could be '' or 'module'
      const src  = s.getAttribute('src');
      const asyncAttr = s.hasAttribute('async');
      const deferAttr = s.hasAttribute('defer');
      const nomodule = s.hasAttribute('nomodule');
      const text = src ? '' : s.textContent || '';
      let resolvedSrc = '';
      if (src) {
        try { resolvedSrc = new URL(src, base).href; } catch { resolvedSrc = src; }
      }
      return { type, src: resolvedSrc, async: asyncAttr, defer: deferAttr, nomodule, text };
    });

    return { html: node.innerHTML.trim(), scripts };
  }

  // After injecting fragment HTML, execute its scripts in order.
  // For external scripts, we create <script> with resolved src (respecting type/async/defer).
  // For inline scripts, we inject textContent. Execution order: original DOM order.
  async function executeScriptsSequentially(scripts) {
    for (const s of scripts) {
      // Skip empty/no-op
      if (!s.src && !s.text) continue;

      await new Promise((resolve) => {
        const el = document.createElement('script');
        if (s.type) el.type = s.type;             // e.g., 'module'
        if (s.nomodule) el.noModule = true;
        // Prefer synchronous order unless original had async/defer
        if (s.async) el.async = true;
        if (s.defer) el.defer = true;

        if (s.src) {
          el.src = s.src;
          el.onload = () => resolve();
          el.onerror = () => {
            console.error('[services] Failed to load script:', s.src);
            resolve(); // continue with others
          };
          // Append to mount to keep scope close; head would also work.
          document.head.appendChild(el);
        } else {
          el.textContent = s.text;
          // Inline scripts execute upon insertion
          document.body.appendChild(el);
          resolve();
        }
      });
    }
  }

  // Load a service fragment into the mount and run its scripts
  async function loadService(key) {
    const candidates = SERVICE_CANDIDATES[key];
    if (!candidates || !candidates.length) return;

    main.setAttribute('data-loading', 'true');

    try {
      const { url, text } = await fetchFirstOk(candidates);
      const { html, scripts } = extractFragmentAndScripts(text, key, url);

      // Inject HTML
      mount.innerHTML = html || `
        <div class="notice error" role="alert"><p>Section loaded but no content matched.</p></div>
      `;

      // Execute any scripts present in the fragment so data loaders (SQL-backed) can run
      await executeScriptsSequentially(scripts);

      // Accessibility: focus first meaningful element without scrolling
      const focusTarget =
        mount.querySelector('h1, h2, [role="heading"], form, section, article, [tabindex]') || mount;
      if (focusTarget) {
        const hadTabIndex = focusTarget.hasAttribute('tabindex');
        if (!hadTabIndex) focusTarget.setAttribute('tabindex', '-1');
        try { focusTarget.focus({ preventScroll: true }); } catch {}
        if (!hadTabIndex) focusTarget.removeAttribute('tabindex');
      }

      // Intercept in-fragment hash links so they don't yank the page
      interceptLocalAnchors(mount);

      // Close the drawer on mobile — without changing scroll position
      closeDrawerIfOpen();
    } catch (err) {
      console.error(err);
      mount.innerHTML = `
        <div class="notice error" role="alert">
          <p>Sorry, we couldn’t load that section right now.</p>
        </div>`;
    } finally {
      main.removeAttribute('data-loading');
    }
  }

  // Intercept anchors pointing to #hash within the same page to prevent sudden jumps
  function interceptLocalAnchors(scope = document) {
    scope.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        if (a.dataset.allowHash === 'true') return; // opt-out when explicitly allowed
        e.preventDefault();
        e.stopPropagation();
      }, { passive: false });
    });
  }

  // Optional controlled scroll helper (unused by default)
  function smoothScrollIntoView(el) {
    const headerHeight = getHeaderHeight();
    const rect = el.getBoundingClientRect();
    const absoluteTop = window.pageYOffset + rect.top - headerHeight;
    window.scrollTo({ top: absoluteTop, behavior: 'smooth' });
  }
  function getHeaderHeight() {
    const hdr = document.getElementById('site-header');
    if (hdr) return hdr.offsetHeight || 0;
    const cssVar = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
    const parsed = parseInt(cssVar, 10);
    return Number.isFinite(parsed) ? parsed : 80;
  }

  // Global click handler for dashboard buttons — zero scroll, stable focus
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.admin-button');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const key = btn.getAttribute('data-service');
    if (!key) return;
    loadService(key);
  }, { passive: false });

  // Harden existing anchors against accidental jumps
  interceptLocalAnchors(document);

  // Optional default on page load:
  // loadService('photography');
})();
