/**
 * Services page loader (replaces old inline script).
 * - Adds behavior for left-nav buttons (including new "Pricing").
 * - Loads fragments into #services-content.
 * - Removes versioned querystrings from module loaders.
 * - Hides right sidebar when viewing Pricing; shows for others.
 * - Provides basic mobile toggle for the left nav.
 */

(function () {
  const content = document.getElementById('services-content');
  const leftNav = document.getElementById('services-nav');
  const rightSidebar = document.querySelector('.right-sidebar');
  const navButtons = leftNav ? leftNav.querySelectorAll('.admin-button') : [];

  // A11y live region (for announcements like "Pricing loaded")
  let live = document.getElementById('sr-live');
  if (!live) {
    live = document.createElement('div');
    live.id = 'sr-live';
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    live.style.position = 'absolute';
    live.style.width = '1px';
    live.style.height = '1px';
    live.style.padding = '0';
    live.style.margin = '-1px';
    live.style.overflow = 'hidden';
    live.style.clip = 'rect(0,0,0,0)';
    live.style.whiteSpace = 'nowrap';
    live.style.border = '0';
    document.body.appendChild(live);
  }

  function ensureModule(src) {
    // Strip any accidental versioning to avoid VS Code preview "not found"
    const cleanSrc = src.split('?')[0];

    // Already loaded?
    const found = [...document.scripts].some(s => (s.getAttribute('src') || '') === cleanSrc);
    if (found) return;

    const s = document.createElement('script');
    s.src = cleanSrc;
    // not using type="module" here to remain compatible with existing non-module scripts
    s.defer = true;
    document.body.appendChild(s);
  }

  function setRightSidebarVisible(visible) {
    if (!rightSidebar) return;
    rightSidebar.hidden = !visible;
    rightSidebar.style.display = visible ? '' : 'none';
    rightSidebar.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function injectHtmlIntoContent(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const main = doc.querySelector('main');
    content.innerHTML = main ? main.innerHTML : '<p>Unable to load content.</p>';
  }

  async function safeFetch(url) {
    // Root-relative first
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.text();
    } catch (e1) {
      // Fallback: relative path (helps some VS Code preview setups)
      try {
        const relative = url.startsWith('/') ? url.slice(1) : url;
        const res2 = await fetch(relative, { cache: 'no-store' });
        if (!res2.ok) throw new Error(`${res2.status} ${res2.statusText}`);
        return await res2.text();
      } catch (e2) {
        throw new Error(`Content not found: ${url}`);
      }
    }
  }

  async function loadService(service) {
    // Determine URL
    let url;
    if (service === 'request-form') {
      url = '/services/request-form.html';
    } else if (service === 'pricing') {
      url = '/services/pricing.html';
    } else {
      url = `/services/${service}.html`;
    }

    try {
      const html = await safeFetch(url);
      injectHtmlIntoContent(html);

      // Hydrate modules for specific fragments (no versioned querystrings)
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

      // Show/hide right sidebar
      setRightSidebarVisible(service !== 'pricing');

      // Announce for screen readers
      const label = service === 'pricing' ? 'Pricing loaded.' : 'Content loaded.';
      live.textContent = label;

      // Scroll to top of content on small screens
      content.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error(err);
      content.innerHTML = `<p>Error loading content: ${err.message}</p>`;
      setRightSidebarVisible(true);
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
