/**
 * Services page loader
 * - Left-nav buttons (incl. "Pricing") load fragments into #services-content.
 * - Primary path for Pricing is /services/pricing.html; fallback to /pricing.html.
 * - After injecting a fragment, execute any <script> tags contained in it (so its own JS runs).
 * - Resolves relative <script src> against the fragment's URL (so pricing.js loads correctly).
 * - If Pricing scripts still don't populate, try a JSON/PHP fallback renderer.
 * - Removes versioned querystrings when dynamically loading helper scripts.
 * - Hides right sidebar when viewing Pricing; shows it for other sections.
 * - Mobile toggle for the left nav.
 */

(function () {
  const content = document.getElementById('services-content');
  const leftNav = document.getElementById('services-nav');
  const rightSidebar = document.querySelector('.right-sidebar');
  const navButtons = leftNav ? leftNav.querySelectorAll('.admin-button') : [];

  // Screenreader live region
  let live = document.getElementById('sr-live');
  if (!live) {
    live = document.createElement('div');
    live.id = 'sr-live';
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    Object.assign(live.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0,0,0,0)',
      whiteSpace: 'nowrap',
      border: '0'
    });
    document.body.appendChild(live);
  }

  const stripVersion = (s) => (s || '').split('?')[0];

  function ensureModule(src) {
    const cleanSrc = stripVersion(src);
    const found = [...document.scripts].some(s => (s.getAttribute('src') || '') === cleanSrc);
    if (found) return;
    const tag = document.createElement('script');
    tag.src = cleanSrc;
    tag.defer = true; // compatible with existing helpers
    document.body.appendChild(tag);
  }

  function setRightSidebarVisible(visible) {
    if (!rightSidebar) return;
    rightSidebar.hidden = !visible;
    rightSidebar.style.display = visible ? '' : 'none';
    rightSidebar.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function resolveAgainst(baseUrl, maybeRelative) {
    try {
      return new URL(maybeRelative, baseUrl).toString();
    } catch {
      return maybeRelative; // best effort
    }
  }

  function runScriptsFromDoc(doc, baseUrl) {
    const loadedSrcs = new Set(
      [...document.querySelectorAll('script[src]')].map(s => stripVersion(s.getAttribute('src')))
    );

    const fragmentScripts = [...doc.querySelectorAll('script')];
    fragmentScripts.forEach(srcScript => {
      const newScript = document.createElement('script');

      // Keep type/module flags
      if (srcScript.type) newScript.type = srcScript.type;
      if (srcScript.noModule) newScript.noModule = true;
      if (srcScript.async) newScript.async = false; // preserve exec order
      if (srcScript.defer) newScript.defer = false;

      const srcAttr = srcScript.getAttribute('src');
      if (srcAttr) {
        // Resolve relative to the fragment's URL
        const abs = resolveAgainst(baseUrl, stripVersion(srcAttr));

        // Avoid duplicate loads
        if (loadedSrcs.has(abs) || document.querySelector(`script[data-injected-src="${CSS.escape(abs)}"]`)) {
          return;
        }

        newScript.src = abs;
        newScript.dataset.injectedSrc = abs;
      } else {
        // Inline script
        newScript.textContent = srcScript.textContent || '';
      }

      // Append after content so code can find injected nodes
      content.appendChild(newScript);
    });
  }

  function injectHtmlIntoContentAndRunScripts(html, baseUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const main = doc.querySelector('main');
    content.innerHTML = main ? main.innerHTML : html;
    runScriptsFromDoc(doc, baseUrl);
  }

  async function fetchTextWithBase(url) {
    // Attempt root-relative first
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const text = await res.text();
      const baseUrl = new URL(url, window.location.origin).toString();
      return { text, baseUrl };
    } catch {
      // Fallback: relative path (helps VSCode preview / local file servers)
      try {
        const relative = url.startsWith('/') ? url.slice(1) : url;
        const res2 = await fetch(relative, { cache: 'no-store' });
        if (!res2.ok) throw new Error(`${res2.status} ${res2.statusText}`);
        const text2 = await res2.text();
        const baseUrl2 = new URL(relative, window.location.href).toString();
        return { text: text2, baseUrl: baseUrl2 };
      } catch (e2) {
        throw new Error(`Content not found: ${url}`);
      }
    }
  }

  async function tryJson(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  }

  function detectPricingRoot() {
    return (
      content.querySelector('#pricing-root') ||
      content.querySelector('#pricing-container') ||
      content.querySelector('[data-pricing-root]') ||
      content // last resort
    );
  }

  function renderPricingFromJson(root, data) {
    let byCat = {};
    if (Array.isArray(data)) {
      data.forEach(item => {
        const cat = (item.category || 'General').toString();
        (byCat[cat] ||= []).push(item);
      });
    } else if (data && typeof data === 'object') {
      Object.keys(data).forEach(cat => {
        const arr = Array.isArray(data[cat]) ? data[cat] : [data[cat]];
        byCat[cat] = arr;
      });
    } else {
      root.innerHTML = '<p>Unable to display pricing data.</p>';
      return;
    }

    const frag = document.createDocumentFragment();
    Object.keys(byCat).sort().forEach(cat => {
      const section = document.createElement('section');
      section.className = 'pricing-section';

      const h3 = document.createElement('h3');
      h3.textContent = cat;
      section.appendChild(h3);

      const table = document.createElement('table');
      table.className = 'pricing-table';
      const thead = document.createElement('thead');
      thead.innerHTML = '<tr><th>Service</th><th>Description</th><th>Price</th></tr>';
      table.appendChild(thead);
      const tbody = document.createElement('tbody');

      byCat[cat]
        .filter(item => item.visible !== false && item.hidden !== true)
        .forEach(item => {
          const tr = document.createElement('tr');
          const svc = document.createElement('td');
          svc.textContent = item.title || item.name || '—';
          const desc = document.createElement('td');
          desc.textContent = item.description || '';
          const price = document.createElement('td');
          price.textContent = item.price_display || item.price || '';
          tr.appendChild(svc);
          tr.appendChild(desc);
          tr.appendChild(price);
          tbody.appendChild(tr);
        });

      table.appendChild(tbody);
      section.appendChild(table);
      frag.appendChild(section);
    });

    root.innerHTML = '';
    root.appendChild(frag);
  }

  async function tryPricingFallback() {
    const root = detectPricingRoot();
    const candidates = [
      '/php/get_pricing.php?format=json',
      '/php/get_pricing.php',
      '/json/pricing.json'
    ];

    for (const url of candidates) {
      try {
        let data;
        if (url.endsWith('.json') || url.includes('format=json')) {
          data = await tryJson(url);
        } else {
          const { text } = await fetchTextWithBase(url);
          try {
            data = JSON.parse(text);
          } catch {
            // If endpoint returns HTML, inject it directly as a last resort
            root.innerHTML = text;
            return true;
          }
        }
        renderPricingFromJson(root, data);
        return true;
      } catch {
        // try next
      }
    }
    return false;
  }

  async function loadPricing() {
    setRightSidebarVisible(false);

    // Load the pricing fragment and run its own scripts (so SQL-backed PHP path runs)
    let loaded = false;
    try {
      const { text, baseUrl } = await fetchTextWithBase('/services/pricing.html');
      injectHtmlIntoContentAndRunScripts(text, baseUrl);
      loaded = true;
    } catch {
      const { text, baseUrl } = await fetchTextWithBase('/pricing.html');
      injectHtmlIntoContentAndRunScripts(text, baseUrl);
      loaded = true;
    }

    // If fragment scripts didn't populate yet, try fallback after a short delay
    setTimeout(async () => {
      const hasPopulatedPricing =
        content.querySelector('.pricing-table, table.pricing-table, [data-populated="pricing"]');
      if (!hasPopulatedPricing) {
        await tryPricingFallback();
      }
      live.textContent = 'Pricing loaded.';
      content.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
  }

  async function loadGenericService(service) {
    const url = service === 'request-form' ? '/services/request-form.html' : `/services/${service}.html`;
    try {
      const { text, baseUrl } = await fetchTextWithBase(url);
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const main = doc.querySelector('main');
      content.innerHTML = main ? main.innerHTML : '<p>Unable to load content.</p>';

      // Execute any fragment scripts for non-pricing pages too (keeps behavior consistent)
      runScriptsFromDoc(doc, baseUrl);

      // Hydrate helpers (no versioned querystrings)
      if (content.querySelector('#equipment-list')) {
        ensureModule('/js/modules/equipment.js');
        if (typeof window.loadEquipment === 'function') window.loadEquipment();
      }
      if (content.querySelector('#other-services-container')) {
        ensureModule('/js/modules/other-services.js');
      }
      if (service === 'request-form') {
        ensureModule('/js/modules/service-request.js');
      }

      setRightSidebarVisible(true);
      live.textContent = 'Content loaded.';
      content.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error(err);
      content.innerHTML = `<p>Error loading content: ${err.message}</p>`;
      setRightSidebarVisible(true);
    }
  }

  async function loadService(service) {
    if (service === 'pricing') {
      await loadPricing();
    } else {
      await loadGenericService(service);
    }
  }

  // Wire up left-nav buttons
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const service = btn.getAttribute('data-service');
      loadService(service);
    });
  });

  // Mobile left-nav toggle
  const toggleBtn = document.getElementById('services-toggle');
  if (toggleBtn && leftNav) {
    toggleBtn.addEventListener('click', () => {
      const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      const next = !expanded;
      toggleBtn.setAttribute('aria-expanded', String(next));
      leftNav.style.display = next ? '' : 'none';
    });
  }
})();
