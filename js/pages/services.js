/* /js/pages/services.js
   Services dashboard loader — no-scroll, fragment-only content, resilient paths.

   Key features:
   - Prevents jumps: never touches location.hash, focuses with preventScroll.
   - Extracts only the main fragment from fetched pages (no header/footer/scripts).
   - Tries multiple candidate URLs for each service (esp. Pricing) until one works.
   - Console logs which candidate succeeded or why they failed.
*/

(() => {
  // Safety: don't let the browser auto-restore scroll on history navigation
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch {}

  const MAIN_ID = 'services-content'; // <main id="services-content">
  const DRAWER_ID = 'services-drawer';
  const TOGGLE_ID = 'services-toggle';

  // Candidate URL lists per service (RELATIVE paths for Live Preview + prod)
  // Order matters: we'll try each until one returns 200 OK.
  const SERVICE_CANDIDATES = {
    photography: [
      'services/photography.html',
      './services/photography.html'
    ],
    videography: [
      'services/videography.html',
      './services/videography.html'
    ],
    editing: [
      'services/editing.html',
      './services/editing.html'
    ],
    'other-services': [
      'services/other-services.html',
      './services/other-services.html'
    ],
    pricing: [
      // Prefer the self-embedding page to avoid extra chrome
      'pricing.html?embed=1',
      './pricing.html?embed=1',
      // If you kept a dashboard copy:
      'pricing-dashboard.html',
      './pricing-dashboard.html',
      // Fall back to the services subpath (with & without embed)
      'services/pricing.html?embed=1',
      './services/pricing.html?embed=1',
      'services/pricing.html',
      './services/pricing.html',
      // Absolute root as last resort (works on real server)
      '/pricing.html?embed=1',
      '/pricing-dashboard.html'
    ],
    'request-form': [
      'services/request-form.html',
      './services/request-form.html',
      // fallback guesses if the file moves later:
      'services/request.html',
      './services/request.html'
    ]
  };

  // Optional: service-specific fragment selectors for higher precision.
  // We’ll try these first (in order) when extracting content from the fetched document.
  const SERVICE_FRAGMENT_SELECTORS = {
    'request-form': [
      '#request-form',
      'form[action*="request"]',
      '[data-fragment="request-form"]',
      'main',
      '[role="main"]',
      'section[id*="request"]'
    ],
    pricing: [
      '#pricing-section',
      '#pricing-main',
      '[data-fragment="pricing"]',
      'main',
      '[role="main"]'
    ],
    photography: ['[data-fragment="service"]', 'main', '[role="main"]', 'article', 'section'],
    videography: ['[data-fragment="service"]', 'main', '[role="main"]', 'article', 'section'],
    editing: ['[data-fragment="service"]', 'main', '[role="main"]', 'article', 'section'],
    'other-services': ['[data-fragment="service"]', 'main', '[role="main"]', 'article', 'section']
  };

  // Get main container and ensure a mount exists
  const main = document.getElementById(MAIN_ID);
  if (!main) return;

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

  // Optional: prevent layout jank from scroll anchoring on dynamic content
  // mount.style.overflowAnchor = 'none';

  // Close drawer helper (on mobile) without scrolling the page
  function closeDrawerIfOpen() {
    const drawer = document.getElementById(DRAWER_ID);
    const toggle = document.getElementById(TOGGLE_ID);
    if (drawer && drawer.classList.contains('open')) {
      drawer.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  }

  // Try a list of candidate URLs until one succeeds.
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

  // Extract a meaningful fragment from a fetched HTML document
  function extractFragmentFromHTML(html, serviceKey) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Service-specific selectors (priority first)
    const serviceSelectors = SERVICE_FRAGMENT_SELECTORS[serviceKey] || [];

    // General candidates if none matched
    const generalSelectors = [
      '[data-fragment="content"]',
      'main',
      '[role="main"]',
      '#content',
      '#page',
      'article',
      'section'
    ];

    const candidates = [...serviceSelectors, ...generalSelectors];

    let fragment = null;
    for (const sel of candidates) {
      const node = doc.querySelector(sel);
      if (node) { fragment = node.cloneNode(true); break; }
    }

    // If still nothing, fall back to <body> and prune
    if (!fragment) fragment = doc.body.cloneNode(true);

    // Strip header/footer/sidebars/scripts/extra CSS that might be in the fetched doc
    fragment.querySelectorAll('#header-container, #site-header, header, #footer-container, footer, .sidebar, script').forEach(el => el.remove());
    fragment.querySelectorAll('link[rel="stylesheet"]').forEach(el => el.remove());

    return fragment.innerHTML.trim();
  }

  // Load a service fragment into the mount
  async function loadService(key) {
    const candidates = SERVICE_CANDIDATES[key];
    if (!candidates || !candidates.length) return;

    main.setAttribute('data-loading', 'true');

    try {
      const { url, text } = await fetchFirstOk(candidates);
      const fragmentHTML = extractFragmentFromHTML(text, key);

      mount.innerHTML = fragmentHTML || `
        <div class="notice error" role="alert"><p>Section loaded but no content matched.</p></div>
      `;

      // Accessibility: move focus to first meaningful heading without scrolling the page
      const focusTarget =
        mount.querySelector('h1, h2, [role="heading"], form, section, article, [tabindex]') || mount;
      if (focusTarget) {
        const hadTabIndex = focusTarget.hasAttribute('tabindex');
        if (!hadTabIndex) focusTarget.setAttribute('tabindex', '-1');
        try { focusTarget.focus({ preventScroll: true }); } catch {}
        if (!hadTabIndex) focusTarget.removeAttribute('tabindex');
      }

      // Neutralize in-fragment hash links so they can't yank the page
      interceptLocalAnchors(mount);

      // Close the drawer on mobile — no scrolling
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

  // Intercept anchors that point to #hash within the same page to prevent sudden jumps
  function interceptLocalAnchors(scope = document) {
    scope.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        if (a.dataset.allowHash === 'true') return; // opt-out
        e.preventDefault();
        e.stopPropagation();
      }, { passive: false });
    });
  }

  // Optional helper — only use if you WANT a controlled scroll after load
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

  // Global click handler for the admin buttons — zero scroll, precise content
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

  // Optional: choose an initial default (won't scroll the page)
  // loadService('photography');
})();
