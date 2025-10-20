/* /js/pages/services.js
   Zero-invasion Services loader:
   - Injects fetched fragment into #service-mount (inside #services-content)
   - Executes fragment scripts with a temporary <base> for correct relative URLs
   - Never creates new sections or headings
   - Activates features ONLY if their hooks exist in the fragment:
       * #equipment-list          -> import('/js/modules/equipment.js') and run with the correct category
       * #other-services-list     -> fetch('/php/get_other_services.php') and render collapsible cards (same classes)
       * #packages-body/#ala-carte-body -> import('/js/modules/pricing.js') then loadPricing() (favor embed parity)
   - Singleton guard + in-flight guard to prevent double-loading
*/

(() => {
  if (window.__NSM_SERVICES_READY__) return;
  window.__NSM_SERVICES_READY__ = true;

  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch {}

  const MAIN_ID   = 'services-content';
  const DRAWER_ID = 'services-drawer';
  const TOGGLE_ID = 'services-toggle';

  let inFlight = false;
  let currentKey = null;

  const SERVICE_CANDIDATES = {
    photography:      ['services/photography.html','./services/photography.html'],
    videography:      ['services/videography.html','./services/videography.html'],
    editing:          ['services/editing.html','./services/editing.html'],
    'other-services': ['services/other-services.html','./services/other-services.html'],
    // Prefer the same markup as Pricing page for consistency:
    pricing: [
      '/pricing.html?embed=1','pricing.html?embed=1','./pricing.html?embed=1',
      '/pricing-dashboard.html','pricing-dashboard.html','./pricing-dashboard.html',
      'services/pricing.html?embed=1','./services/pricing.html?embed=1',
      'services/pricing.html','./services/pricing.html'
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

  // Main/root
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

  // -------- fragment fetch / parse / script exec ----------
  async function fetchFirstOk(candidates) {
    const errors = [];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { credentials: 'same-origin', cache: 'no-cache' });
        if (res.ok) {
          const text = await res.text();
          console.info('[services] Loaded fragment from:', url);
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

    // Collect scripts before sanitizing
    const rawScripts = Array.from(node.querySelectorAll('script'));

    // Remove outer chrome and in-fragment scripts; we’ll execute scripts ourselves
    node.querySelectorAll('#header-container, #site-header, header, #footer-container, footer, .sidebar').forEach(el => el.remove());
    node.querySelectorAll('script').forEach(el => el.remove());

    const scripts = rawScripts.map(s => {
      const type = (s.getAttribute('type') || '').trim();
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

  function interceptLocalAnchors(scope) {
    scope.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        if (a.dataset.allowHash === 'true') return;
        e.preventDefault();
        e.stopPropagation();
      }, { passive: false });
    });
  }

  // -------- activators (only when hooks exist in the fragment) --------
  async function activateEquipmentIfPresent() {
  const list = mount.querySelector('#equipment-list');
  if (!list) return;

  // SIMPLIFIED: Just read from the element itself
  let category = list.dataset.category || list.dataset.categoryFilter || '';
  
  // Fallback: infer from active button
  if (!category) {
    const activeBtn = document.querySelector('#services-nav .admin-button[aria-current="true"]');
    const btnService = activeBtn?.getAttribute('data-service');
    // Map button names to category values
    const categoryMap = { 
      'photography': 'photography', 
      'videography': 'videography', 
      'editing': 'editing' 
    };
    category = categoryMap[btnService] || '';
  }

  console.log('[services] Equipment category:', category); // DEBUG

  try {
    const mod = await import('/js/modules/equipment.js');
    if (mod?.NSM?.equipment?.renderInto) {
      await mod.NSM.equipment.renderInto(list, { category });
    }
  } catch (e) {
    console.error('[services] equipment activation failed:', e);
  }
}

  async function activatePricingIfPresent() {
    const hasPricing = mount.querySelector('#packages-body, #ala-carte-body');
    if (!hasPricing) return;
    try {
      const mod = await import('/js/modules/pricing.js');
      if (mod?.loadPricing) {
        await mod.loadPricing();
      } else if (window.loadPricing) {
        await window.loadPricing();
      }
    } catch (e) {
      console.error('[services] pricing activation failed:', e);
    }
  }

  async function activateOtherServicesIfPresent() {
    const container = mount.querySelector('#other-services-list');
    if (!container) return;

    container.innerHTML = '<p>Loading other services…</p>';

    try {
      const res = await fetch('/php/get_other_services.php', {
        cache: 'no-cache',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const rows = Array.isArray(payload) ? payload : (payload?.data || []);
      renderOtherServicesAsCollapsible(container, rows);
    } catch (e) {
      console.error('[services] other services fetch failed:', e);
      container.innerHTML = '<p class="error">Unable to load other services.</p>';
    }
  }

  // Same collapsible UI classes as equipment.js
  function renderOtherServicesAsCollapsible(container, items) {
    if (!Array.isArray(items) || items.length === 0) {
      container.innerHTML = '<p>No other services listed.</p>';
      return;
    }
    const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
    const byName = (a,b) => String(a?.name || a?.title || '').localeCompare(String(b?.name || b?.title || ''), undefined, { sensitivity:'base' });

    const html = items.slice().sort(byName).map((it, idx) => {
      const name = escapeHtml(it.name || it.title || 'Untitled');
      const desc = it.description ? `<p class="eq-desc">${escapeHtml(it.description)}</p>` : '<p class="eq-desc">No description provided.</p>';
      const img  = it.thumbnail_url ? `<img class="eq-thumb" src="${escapeHtml(it.thumbnail_url)}" alt="${name}" loading="lazy" decoding="async">` : '';
      const pid = `os-card-panel-${idx}`;
      const bid = `os-card-toggle-${idx}`;
      return `
        <article class="equip-card">
          <div class="equip-card-hd">
            <button type="button" id="${bid}" class="equip-toggle-mini" aria-expanded="false" aria-controls="${pid}" aria-label="Expand ${name}">+</button>
            <span class="equip-title" title="${name}">${name}</span>
          </div>
          <div id="${pid}" class="equip-panel" role="region" aria-labelledby="${bid}" hidden>
            <div class="equip-panel-inner">
              ${img}
              ${desc}
            </div>
          </div>
        </article>`;
    }).join('');

    container.innerHTML = `<div class="equip-grid">${html}</div>`;

    const toggles = Array.from(container.querySelectorAll('.equip-toggle-mini'));
    const toggle = (btn) => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      if (panel) panel.hidden = expanded;
      btn.textContent = expanded ? '+' : '–';
    };
    toggles.forEach((btn) => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(btn); });
      btn.addEventListener('keydown', (e) => {
        if (!['ArrowUp','ArrowDown','Home','End'].includes(e.key)) return;
        const i = toggles.indexOf(btn);
        let next = i;
        if (e.key === 'ArrowUp')   next = (i - 1 + toggles.length) % toggles.length;
        if (e.key === 'ArrowDown') next = (i + 1) % toggles.length;
        if (e.key === 'Home')      next = 0;
        if (e.key === 'End')       next = toggles.length - 1;
        toggles[next]?.focus();
        e.preventDefault();
      });
    });
  }

  // ---------------- core load -----------------
  async function loadService(key) {
    if (inFlight && key === currentKey) return;
    inFlight = true;
    currentKey = key;

    main.setAttribute('data-loading', 'true');

    try {
      const candidates = SERVICE_CANDIDATES[key] || [];
      const { url, text } = await fetchFirstOk(candidates);
      const { html, scripts, baseHref } = extractFragmentAndScripts(text, key, url);

      mount.innerHTML = html || `<div class="notice error" role="alert"><p>Section loaded but no content matched.</p></div>`;

      setTempBase(baseHref);
      try {
        await executeScriptsSequentially(scripts);
      } finally {
        clearTempBase();
      }

      // Keep navigation friendly within the fragment only
      interceptLocalAnchors(mount);

      const focusTarget = mount.querySelector('h1, h2, [role="heading"], form, section, article, [tabindex]') || mount;
      if (focusTarget) {
        const had = focusTarget.hasAttribute('tabindex');
        if (!had) focusTarget.setAttribute('tabindex', '-1');
        try { focusTarget.focus({ preventScroll: true }); } catch {}
        if (!had) focusTarget.removeAttribute('tabindex');
      }

      // Post-fragment activations (hook-driven only)
      await activateEquipmentIfPresent();
      await activatePricingIfPresent();
      await activateOtherServicesIfPresent();

      closeDrawerIfOpen();
    } catch (err) {
      console.error('[services] load error', err);
      mount.innerHTML = `<div class="notice error" role="alert"><p>Sorry, we couldn’t load that section right now.</p></div>`;
    } finally {
      main.removeAttribute('data-loading');
      inFlight = false;
    }
  }

  // Single click delegation
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.admin-button');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    // mark active for category inference
    document.querySelectorAll('.admin-button').forEach(b => b.removeAttribute('aria-current'));
    btn.setAttribute('aria-current', 'true');

    const key = btn.getAttribute('data-service');
    if (!key) return;
    loadService(key);
  }, { passive: false });
})();
