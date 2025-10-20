/* /js/pages/services.js
   Services dashboard loader — fragment-only, script execution, BASE fix,
   and MAIN-PANE equipment rendering.

   What’s new vs. your version:
   - After a service fragment loads (photography/videography/editing/other-services),
     we fetch `/php/get_equipment.php?category=<mapped>` and render the list
     **INSIDE the main content area** (appended to #service-mount, or into an
     existing anchor #service-equipment-main if present).
   - Pricing and Request Form explicitly **clear** any equipment block.
   - Robust JSON handling ({ok:true,data:[...]} or raw array).
   - Defensive against staging/live path differences; BASE resolution remains.

   Notes:
   - Main content container id is expected to be `services-content` (matches your file).
   - Equipment anchor id inside main is `service-equipment-main` (created if missing).
*/

(() => {
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch {}

  const MAIN_ID   = 'services-content';
  const DRAWER_ID = 'services-drawer';
  const TOGGLE_ID = 'services-toggle';

  // Map button keys to fragment candidates
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

  // Narrow the fragment we inject from the fetched HTML
  const SERVICE_FRAGMENT_SELECTORS = {
    'request-form': ['#request-form','form[action*="request"]','[data-fragment="request-form"]','main','[role="main"]','section[id*="request"]'],
    pricing: ['#pricing-section','#pricing-main','[data-fragment="pricing"]','main','[role="main"]'],
    photography: ['[data-fragment="service"]','main','[role="main"]','article','section'],
    videography: ['[data-fragment="service"]','main','[role="main"]','article','section'],
    editing: ['[data-fragment="service"]','main','[role="main"]','article','section'],
    'other-services': ['[data-fragment="service"]','main','[role="main"]','article','section']
  };

  // Map UI key -> equipment category expected by PHP
  const SERVICE_TO_EQUIPMENT = {
    photography: 'photography',
    videography: 'videography',
    editing: 'editing',
    'other-services': 'other'
  };

  const main = document.getElementById(MAIN_ID);
  if (!main) return;

  // Ensure a mount inside the main content
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

  // --- Equipment anchor management (inside MAIN content) ---
  const EQUIP_ID = 'service-equipment-main';

  function getOrCreateEquipAnchor() {
    let anchor = mount.querySelector('#' + EQUIP_ID);
    if (!anchor) {
      anchor = document.createElement('section');
      anchor.id = EQUIP_ID;
      anchor.className = 'equipment-panel equipment-panel--main';
      mount.appendChild(anchor);
    }
    return anchor;
  }

  function clearEquipment() {
    const anchor = mount.querySelector('#' + EQUIP_ID);
    if (anchor) anchor.remove();
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

    // Determine effective BASE for resolving any <script src> in the fragment
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

  // ------------- Equipment rendering (MAIN content only) -------------
  async function renderEquipmentInMain(serviceKey) {
    const category = SERVICE_TO_EQUIPMENT[serviceKey];
    if (!category) return; // not a service that shows equipment

    const anchor = getOrCreateEquipAnchor();
    anchor.setAttribute('aria-busy', 'true');

    const url = `/php/get_equipment.php?category=${encodeURIComponent(category)}`;
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' }, cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const payload = await res.json();
      const rows = Array.isArray(payload) ? payload : (payload?.data || []);

      if (!rows.length) {
        anchor.innerHTML = `<div class="notice info">No equipment listed for ${escapeHtml(category)} yet.</div>`;
        return;
      }

      // Group by item.category (camera, lens, lighting, etc.)
      const byGroup = groupBy(rows, (r) => (r.category || 'Other'));
      const sections = Object.keys(byGroup).sort().map((group) => {
        const items = byGroup[group].map(renderEquipItem).join('');
        return `
          <section class="equip-group">
            <h3 class="equip-group__title">${escapeHtml(group)}</h3>
            <ul class="equip-list">${items}</ul>
          </section>
        `;
      }).join('');

      anchor.innerHTML = `
        <h2 class="equipment-panel__title">Equipment — ${escapeHtml(capitalize(category))}</h2>
        ${sections}
      `;
    } catch (err) {
      console.error('[services] equipment load failed:', err);
      anchor.innerHTML = `<div class="notice error">Could not load equipment for ${escapeHtml(category)}.</div>`;
    } finally {
      anchor.removeAttribute('aria-busy');
    }
  }

  function renderEquipItem(item) {
    const name = item.name || 'Unnamed';
    const desc = item.description || '';
    const model = item.model ? ` <span class="equip-item__model">(${escapeHtml(item.model)})</span>` : '';
    return `
      <li class="equip-item">
        <div class="equip-item__name">${escapeHtml(name)}${model}</div>
        ${desc ? `<div class="equip-item__desc">${escapeHtml(desc)}</div>` : ''}
      </li>
    `;
  }

  // -------------------- Core load pipeline --------------------
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
      setTempBase(baseHref);
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

      // Inject equipment INSIDE MAIN for service sections; clear for pricing/request
      if (key === 'pricing' || key === 'request-form') {
        clearEquipment();
      } else {
        await renderEquipmentInMain(key);
      }

      closeDrawerIfOpen();
    } catch (err) {
      console.error(err);
      mount.innerHTML = `<div class="notice error" role="alert"><p>Sorry, we couldn’t load that section right now.</p></div>`;
      clearEquipment();
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

  // Delegate clicks from your dashboard buttons (class .admin-button with data-service)
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

  // -------------------- Utilities --------------------
  function groupBy(arr, keyFn) {
    return arr.reduce((acc, it) => {
      const k = keyFn(it);
      (acc[k] ||= []).push(it);
      return acc;
    }, {});
  }

  function capitalize(s){ return typeof s === 'string' && s ? s[0].toUpperCase()+s.slice(1) : s; }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (ch) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }
})();
