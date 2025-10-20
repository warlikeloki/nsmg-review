/* /js/pages/services.js
   Services dashboard loader with:
   - Singleton guard (prevents duplicate init → "loads twice")
   - Debounced navigation (prevents rapid double clicks)
   - Fragment fetch + script execution with temporary <base>
   - MAIN content rendering with smart anchors
   - Equipment load for photo/video/editing via /js/modules/equipment.js
   - "Other Services" data via /php/get_other_services.php
*/

(() => {
  // ---- Singleton guard: prevent duplicate initialization ----
  if (window.__NSM_SERVICES_READY__) return;
  window.__NSM_SERVICES_READY__ = true;

  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch {}

  const MAIN_ID   = 'services-content';
  const DRAWER_ID = 'services-drawer';
  const TOGGLE_ID = 'services-toggle';

  // Debounce state
  let inFlight = false;
  let currentKey = null;

  // Reuse a single dynamic import for equipment.js
  let equipmentModulePromise = null;
  function ensureEquipmentModule() {
    if (!equipmentModulePromise) {
      equipmentModulePromise = import('/js/modules/equipment.js').catch((e) => {
        console.warn('[services] equipment module import failed', e);
        return null;
      });
    }
    return equipmentModulePromise;
  }

  // Candidate URLs per section
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

  // Where inside fetched HTML to extract the useful bit
  const SERVICE_FRAGMENT_SELECTORS = {
    'request-form': ['#request-form','form[action*="request"]','[data-fragment="request-form"]','main','[role="main"]','section[id*="request"]'],
    pricing: ['#pricing-section','#pricing-main','[data-fragment="pricing"]','main','[role="main"]'],
    photography: ['[data-fragment="service"]','main','[role="main"]','article','section'],
    videography: ['[data-fragment="service"]','main','[role="main"]','article','section'],
    editing: ['[data-fragment="service"]','main','[role="main"]','article','section'],
    'other-services': ['[data-fragment="service"]','main','[role="main"]','article','section']
  };

  const SERVICE_TO_EQUIPMENT = {
    photography: 'photography',
    videography: 'videography',
    editing: 'editing'
    // NOTE: other-services uses a different endpoint (get_other_services.php)
  };

  const main = document.getElementById(MAIN_ID);
  if (!main) return;

  // Ensure a stable mount INSIDE main
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

  // ---- Smart anchors inside MAIN (we prefer existing anchors in fragments) ----
  const EQUIP_ID = 'service-equipment-main';
  function findOrCreateAnchor(id, options = {}) {
    // 1) Fragment-provided anchors take precedence
    const existing = mount.querySelector(`[data-anchor="${id}"], #${id}, .${id}`);
    if (existing) return existing;

    // 2) Try to place after the first H2/H1 inside mount
    const after = mount.querySelector(options.afterSel || 'h2, h1, [role="heading"]');
    const el = document.createElement(options.tagName || 'section');
    el.id = id;
    if (options.className) el.className = options.className;
    if (after && after.parentNode) after.insertAdjacentElement('afterend', el);
    else mount.appendChild(el);
    return el;
  }
  function clearAnchor(id) {
    const el = mount.querySelector(`#${id}, [data-anchor="${id}"], .${id}`);
    if (el) el.remove();
  }

  function closeDrawerIfOpen() {
    const drawer = document.getElementById(DRAWER_ID);
    const toggle = document.getElementById(TOGGLE_ID);
    if (drawer && drawer.classList.contains('open')) {
      drawer.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  }

  // ---- Fragment loading helpers ----
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

    // Collect scripts (before stripping)
    const rawScripts = Array.from(node.querySelectorAll('script'));

    // Strip header/footer/sidebars and scripts from injected HTML
    node.querySelectorAll('#header-container, #site-header, header, #footer-container, footer, .sidebar').forEach(el => el.remove());
    node.querySelectorAll('script').forEach(el => el.remove());

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

  function setTempBase(href) {
    const head = document.head || document.getElementsByTagName('head')[0];
    if (!head) return null;
    const existing = document.querySelector('base[data-services-temp-base]');
    if (existing) existing.remove();
    const el = document.createElement('base');
    el.setAttribute('href', href);
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
        if (s.type) el.type = s.type;
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
          document.body.appendChild(el);
          resolve();
        }
      });
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

  // ---- Data renderers ----
  async function renderEquipmentIntoMain(category) {
    const anchor = findOrCreateAnchor(EQUIP_ID, { className: 'equipment-panel equipment-panel--main', tagName: 'section' });
    anchor.innerHTML = `<p>Loading equipment…</p>`;

    const mod = await ensureEquipmentModule();
    if (mod && (mod.NSM?.equipment?.renderInto || window.NSM?.equipment?.renderInto)) {
      const renderInto = mod.NSM?.equipment?.renderInto || window.NSM.equipment.renderInto;
      await renderInto(anchor, { category });
      return;
    }

    // Fallback: minimal list if the module couldn't be imported
    try {
      const res = await fetch(`/php/get_equipment.php?category=${encodeURIComponent(category)}`, { cache: 'no-cache' });
      const payload = await res.json();
      const rows = Array.isArray(payload) ? payload : (payload?.data || []);
      if (!rows.length) {
        anchor.innerHTML = `<p>No equipment found for ${escapeHtml(category)}.</p>`;
        return;
      }
      anchor.innerHTML = `<h2>Equipment — ${escapeHtml(capitalize(category))}</h2><ul>` +
        rows.map(r => `<li>${escapeHtml(r.name || 'Unnamed')}</li>`).join('') + `</ul>`;
    } catch (e) {
      console.error('[services] equipment fallback failed', e);
      anchor.innerHTML = `<p class="error">Could not load equipment.</p>`;
    }
  }

  async function renderOtherServicesIntoMain() {
    // Create/find an anchor separate from equipment
    const OTHER_ID = 'other-services-main';
    const anchor = findOrCreateAnchor(OTHER_ID, { className: 'other-services-panel', tagName: 'section' });
    anchor.innerHTML = `<p>Loading other services…</p>`;

    try {
      const res = await fetch('/php/get_other_services.php', { cache: 'no-cache', headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const rows = Array.isArray(payload) ? payload : (payload?.data || []);
      if (!rows.length) {
        anchor.innerHTML = `<p>No other services listed.</p>`;
        return;
      }
      // Simple render: title + description list
      anchor.innerHTML = `
        <h2>Other Services</h2>
        <ul class="other-services-list">
          ${rows.map(it => `
            <li class="other-service-item">
              <div class="other-service-title">${escapeHtml(it.name || it.title || 'Untitled')}</div>
              ${it.description ? `<div class="other-service-desc">${escapeHtml(it.description)}</div>` : ''}
            </li>
          `).join('')}
        </ul>
      `;
    } catch (e) {
      console.error('[services] get_other_services failed', e);
      anchor.innerHTML = `<p class="error">Unable to load other services.</p>`;
    }
  }

  // ---- Core loader ----
  async function loadService(key) {
    // Debounce: ignore if same key still in-flight
    if (inFlight && key === currentKey) return;
    inFlight = true;
    currentKey = key;

    // Always clear section-specific anchors before loading new content
    clearAnchor(EQUIP_ID);
    clearAnchor('other-services-main');

    main.setAttribute('data-loading', 'true');

    try {
      const { url, text } = await fetchFirstOk(SERVICE_CANDIDATES[key] || []);
      const { html, scripts, baseHref } = extractFragmentAndScripts(text, key, url);

      // Replace the main mount content with the fragment
      mount.innerHTML = html || `<div class="notice error" role="alert"><p>Section loaded but no content matched.</p></div>`;

      // Execute any inline/external scripts from the fragment with corrected <base>
      setTempBase(baseHref);
      try {
        await executeScriptsSequentially(scripts);
      } finally {
        clearTempBase();
      }

      // Keep hash links from causing page jumps
      interceptLocalAnchors(mount);

      // Focus the new content for a11y
      const focusTarget = mount.querySelector('h1, h2, [role="heading"], form, section, article, [tabindex]') || mount;
      if (focusTarget) {
        const had = focusTarget.hasAttribute('tabindex');
        if (!had) focusTarget.setAttribute('tabindex', '-1');
        try { focusTarget.focus({ preventScroll: true }); } catch {}
        if (!had) focusTarget.removeAttribute('tabindex');
      }

      // Post-fragment data rendering per section
      if (key === 'pricing' || key === 'request-form') {
        // No extra data, anchors already cleared
      } else if (key === 'other-services') {
        await renderOtherServicesIntoMain();
      } else if (SERVICE_TO_EQUIPMENT[key]) {
        await renderEquipmentIntoMain(SERVICE_TO_EQUIPMENT[key]);
      }

      closeDrawerIfOpen();
    } catch (err) {
      console.error('[services] load error', err);
      mount.innerHTML = `<div class="notice error" role="alert"><p>Sorry, we couldn’t load that section right now.</p></div>`;
    } finally {
      main.removeAttribute('data-loading');
      inFlight = false;
    }
  }

  // ---- Click delegation (bound once thanks to singleton guard) ----
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.admin-button');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const key = btn.getAttribute('data-service');
    if (!key) return;
    loadService(key);
  }, { passive: false });

  // Prevent hash-jump globally
  interceptLocalAnchors(document);

  // ---- Small utils ----
  function capitalize(s){ return typeof s === 'string' && s ? s[0].toUpperCase()+s.slice(1) : s; }
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (ch) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }
})();
