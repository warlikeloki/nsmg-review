/**
 * Services page loader
 * - Left-nav buttons load fragments into #services-content (Photography, Videography, Editing, Other, Request).
 * - Pricing loads as an iframe of /services/pricing.html to ensure the same SQL-backed behavior as the standalone page.
 * - Hides right sidebar while Pricing is visible; restores for other sections.
 * - Removes versioned querystrings when loading helper scripts (VS Code preview safe).
 * - Mobile toggle for left nav.
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
    tag.defer = true; // keep compatible with existing helpers
    document.body.appendChild(tag);
  }

  function setRightSidebarVisible(visible) {
    if (!rightSidebar) return;
    rightSidebar.hidden = !visible;
    rightSidebar.style.display = visible ? '' : 'none';
    rightSidebar.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function injectFragment(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const main = doc.querySelector('main');
    content.innerHTML = main ? main.innerHTML : '<p>Unable to load content.</p>';
  }

  async function fetchText(url) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.text();
    } catch {
      try {
        const rel = url.startsWith('/') ? url.slice(1) : url;
        const res2 = await fetch(rel, { cache: 'no-store' });
        if (!res2.ok) throw new Error(`${res2.status} ${res2.statusText}`);
        return await res2.text();
      } catch (e2) {
        throw new Error(`Content not found: ${url}`);
      }
    }
  }

  async function loadGenericService(service) {
    const url = service === 'request-form' ? '/services/request-form.html' : `/services/${service}.html`;
    try {
      const html = await fetchText(url);
      injectFragment(html);

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

  // -------- Pricing via iframe (SQL-backed parity with standalone page) --------
  function autoResizeAndStrip(iframe) {
    function resize() {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;

        // Remove header/footer inside the iframe to avoid nested chrome
        const header = doc.querySelector('#header-container, header');
        const footer = doc.querySelector('#footer-container, footer');
        if (header) header.style.display = 'none';
        if (footer) footer.style.display = 'none';

        // Resize to content height
        const body = doc.body, html = doc.documentElement;
        const h = Math.max(
          body.scrollHeight, body.offsetHeight,
          html.clientHeight, html.scrollHeight, html.offsetHeight
        );
        iframe.style.height = (h + 20) + 'px';
      } catch {
        /* ignore cross-origin (should be same-origin) */
      }
    }

    iframe.addEventListener('load', () => {
      resize();
      // In case assets load later
      setTimeout(resize, 400);
      setTimeout(resize, 1000);
    });
  }

  function mountPricingIframe(src) {
    // Clear and mount
    content.innerHTML = '';
    const region = document.createElement('section');
    region.setAttribute('role', 'region');
    region.setAttribute('aria-label', 'Pricing');

    const iframe = document.createElement('iframe');
    iframe.title = 'Pricing';
    iframe.src = src;
    iframe.style.width = '100%';
    iframe.style.border = '0';
    iframe.setAttribute('loading', 'eager'); // this is the main content

    region.appendChild(iframe);
    content.appendChild(region);

    autoResizeAndStrip(iframe);
    setRightSidebarVisible(false);

    // Fallback: if /services/pricing.html fails to load, swap to /pricing.html
    iframe.addEventListener('error', () => {
      if (iframe.src.endsWith('/services/pricing.html')) {
        iframe.src = '/pricing.html';
      }
    });

    // Accessibility cue
    iframe.addEventListener('load', () => {
      live.textContent = 'Pricing loaded.';
      content.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  async function loadPricing() {
    // Prefer the services-fragment page first
    mountPricingIframe('/services/pricing.html');
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
