/* /js/pages/services.js
   Services dashboard loader — fragment-only, script execution, and BASE fix.

   Fixes:
   - Executes scripts found in fetched fragments (modules and classic).
   - Temporarily sets <base> to the fragment's directory so relative fetch()
     calls like 'get_pricing.php' resolve correctly (the core bug).
   - Prevents scroll jumps (no hash changes; focus with preventScroll).
   - Resilient candidate paths (esp. Pricing).
*/

(() => {
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch {}

  const MAIN_ID   = 'services-content';
  const DRAWER_ID = 'services-drawer';
  const TOGGLE_ID = 'services-toggle';

  const SERVICE_CANDIDATES = {
    photography:      ['services/photography.html','./services/photography.html'],
    videography:      ['services/videography.html','./services/videography.html'],
    editing:          ['services/editing.html','./services/editing.html'],
    'other-services': ['services/other-services.html','./services/other-services.html'],
    pricing: [
      'pricing.html?embed=1','./pricing.html?embed=1',
      'pricing-dashboard.html','./pricing-dashboard.html',
      'services/pricing.html?embed=1','./services/pricing.html?embed=1',
      'services/pricing.html','./services/pricing.html',
      '/pricing.html?embed=1','/pricing-dashboard.html'
    ],
    'request-form':   ['services/request-form.html','./services/request-form.html','services/request.html','./services/request.html']
  };

  const SERVICE_FRAGMENT_SELECTORS = {
    'request-form': ['#request-form','form[action*="request"]','[data-fragment="request-form"]','main','[role="main"]','section[id*="request"]'],
    pricing: ['#pricing-section','#pricing-main','[data-fragment="pricing"]','main','[role="main"]'],
    photography: ['[data-fragment="service"]','main','[role="main"]','article','section'],
    videography: ['[data-fragment="service"]','main','[role="main"]','article','section'],
    editing: ['[data-fragment="service"]','main','[role="main"]','article','section'],
    'other-services': ['[data-fragment="service"]','main','[role="main"]','article','section']
  };

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

  function closeDrawerIfOpen() {
    const drawer = document.getElementById(DRAWER_ID);
    const toggle = document.getElementById(TOGGLE_ID);
    if (drawer && drawer.classList.contains('open')) {
      drawer.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  }

  async function fetchFirstOk(candidates) {
    const errors = [];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { credentials: 'same-origin', cache: 'no-cache' });
        if (res.ok) {
          const text = await res.text();
          console.info(`[services] Loaded fragment from: ${url}`);
          return { url: new URL(url, location.href).href, text };
        }
        errors.push({ url, status: res.status });
      } catch (e) {
        errors.push({ url, status: 'network', err: String(e) });
      }
    }
    console.error('[services] All candidates failed:', errors);
    throw new Error('All candidate URLs failed to load.');
  }

  function extractFragmentAndScripts(html, serviceKey, fetchedUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Use <base> from fetched doc if present; otherwise use its directory.
    const baseFromDoc = doc.querySelector('base[href]');
    const fetched = new URL(fetchedUrl);
    const defaultBase = fetched.origin + fetched.pathname.replace(/[^/]+$/, '');
    const effectiveBase = baseFromDoc ? new URL(baseFromDoc.getAttribute('href'), fetched).href : defaultBase;

    const serviceSelectors = SERVICE_FRAGMENT_SELECTORS[serviceKey] || [];
    const generalSelectors = ['[data-fragment="content"]','main','[role="main"]','#content','#page','article','section'];
    const candidates = [...serviceSelectors, ...generalSelectors];

    let node = null;
    for (const sel of candidates) {
      const found = doc.querySelector(sel);
      if (found) { node = found.cloneNode(true); break; }
    }
    if (!node) node = doc.body.cloneNode(true);

    // Collect scripts BEFORE removing them
    const rawScripts = Array.from(node.querySelectorAll('script'));

    // Scrub chrome and scripts from injected HTML (we'll execute scripts separately)
    node.querySelectorAll('#header-container, #site-header, header, #footer-container, footer, .sidebar').forEach(el => el.remove());
    node.querySelectorAll('script').forEach(el => el.remove());

    // Resolve script src against the fetched doc
    const scripts = rawScripts.map(s => {
      const type = (s.getAttribute('type') || '').trim(); // '' or 'module'
      const src  = s.getAttribute('src');
      const asyncAttr = s.hasAttribute('async');
      const deferAttr = s.hasAttribute('defer');
      const nomodule = s.hasAttribute('nomodule');
      const text = src ? '' : (s.textContent || '');
      let resolvedSrc = '';
      if (src) {
        try { resolvedSrc = new URL(src, effectiveBase).href; } catch { resolvedSrc = src; }
      }
      return { type, src: resolvedSrc, async: asyncAttr, defer: deferAttr, nomodule, text };
    });

    return { html: node.innerHTML.trim(), scripts, baseHref: effectiveBase };
  }

  function setTempBase(baseHref) {
    // Insert a temporary <base> so relative fetch() in executed scripts resolve correctly
    const head = document.head || document.getElementsByTagName('head')[0];
    if (!head) return null;
    const existing = document.querySelector('base[data-services-temp-base]');
    if (existing) existing.remove();
    const el = document.createElement('base');
    el.setAttribute('href', baseHref);
    el.setAttribute('data-services-temp-base', 'true');
    head.insertBefore(el, head.firstChild);
    return el;
  }
  function clearTempBase() {
    const el = document.querySelector('base[data-services-temp-base]');
    if (el) el.remove();
  }

  async function executeScriptsSequentially(scripts) {
    for (const s of scripts) {
      if (!s.src && !s.text) continue;
      await new Promise((resolve) => {
        const el = document.createElement('script');
        if (s.type) el.type = s.type;          // 'module' supported
        if (s.nomodule) el.noModule = true;
        if (s.async) el.async = true;
        if (s.defer) el.defer = true;

        if (s.src) {
          el.src = s.src;
          el.onload = () => resolve();
          el.onerror = () => { console.error('[services] Failed script:', s.src); resolve(); };
          document.head.appendChild(el);
        } else {
          el.textContent = s.text;
          document.body.appendChild(el);       // inline executes immediately
          resolve();
        }
      });
    }
  }

  async function loadService(key) {
    const candidates = SERVICE_CANDIDATES[key];
    if (!candidates || !candidates.length) return;

    main.setAttribute('data-loading', 'true');

    try {
      const { url, text } = await fetchFirstOk(candidates);
      const { html, scripts, baseHref } = extractFragmentAndScripts(text, key, url);

      // Inject fragment HTML
      mount.innerHTML = html || `<div class="notice error" role="alert"><p>Section loaded but no content matched.</p></div>`;

      // TEMP <base> so relative fetch/imports inside executed scripts resolve correctly
      const tempBase = setTempBase(baseHref);
      try {
        await executeScriptsSequentially(scripts);
      } finally {
        // Always remove temp base to avoid side effects after the load
        clearTempBase();
      }

      // Focus without scrolling
      const focusTarget = mount.querySelector('h1, h2, [role="heading"], form, section, article, [tabindex]') || mount;
      if (focusTarget) {
        const had = focusTarget.hasAttribute('tabindex');
        if (!had) focusTarget.setAttribute('tabindex', '-1');
        try { focusTarget.focus({ preventScroll: true }); } catch {}
        if (!had) focusTarget.removeAttribute('tabindex');
      }

      // Stop in-fragment hash links from jumping the page
      interceptLocalAnchors(mount);

      closeDrawerIfOpen();
    } catch (err) {
      console.error(err);
      mount.innerHTML = `<div class="notice error" role="alert"><p>Sorry, we couldn’t load that section right now.</p></div>`;
    } finally {
      main.removeAttribute('data-loading');
    }
  }

  function interceptLocalAnchors(scope = document) {
    scope.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        if (a.dataset.allowHash === 'true') return;
        e.preventDefault();
        e.stopPropagation();
      }, { passive: false });
    });
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.admin-button');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const key = btn.getAttribute('data-service');
    if (!key) return;
    loadService(key);
  }, { passive: false });

  interceptLocalAnchors(document);
})();
