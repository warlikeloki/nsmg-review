// /js/main.js
// Site bootstrap: load header/footer, enhance nav & accordions, small a11y helpers.

(() => {
  // Safe DOM helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Ensure standard containers exist (prevents blank pages if markup was missing)
  function ensureContainer(id, position = 'start') {
    if (document.getElementById(id)) return;
    const div = document.createElement('div');
    div.id = id;
    position === 'start' ? document.body.prepend(div) : document.body.append(div);
  }

  async function loadPartial(url, containerSelector) {
    const container = $(containerSelector);
    if (!container) return;

    try {
      const res = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const html = await res.text();
      container.innerHTML = html;
      if (containerSelector === '#header-container') setActiveNav();
    } catch (err) {
      if (containerSelector === '#header-container') {
        container.innerHTML = `
          <header class="site-header">
            <div class="container">
              <a href="/" class="logo">Neil Smith Media Group</a>
              <nav aria-label="Primary"><a href="/">Home</a></nav>
            </div>
          </header>`;
      } else if (containerSelector === '#footer-container') {
        container.innerHTML = `
          <footer class="site-footer">
            <div class="container">
              <p>&copy; ${new Date().getFullYear()} Neil Smith Media Group</p>
            </div>
          </footer>`;
      }
      console.error(`Failed to load ${url}:`, err);
    }
  }

  function setActiveNav() {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    const links = $$('#header-container nav a[href]');
    links.forEach(a => {
      try {
        const href = new URL(a.href);
        const hrefPath = href.pathname.replace(/\/+$/, '') || '/';
        if (hrefPath === path) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      } catch { /* ignore */ }
    });
  }

  // Accessible accordion for "Our Services"
  function enhanceServicesAccordion() {
    const toggles = $$('.services-accordion .accordion-toggle');
    if (!toggles.length) return;

    toggles.forEach(btn => {
      const controlsId = btn.getAttribute('aria-controls');
      const panel = controlsId ? document.getElementById(controlsId) : null;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      if (panel) panel.hidden = !expanded;

      btn.addEventListener('click', () => {
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!isExpanded));
        if (panel) panel.hidden = isExpanded;
      });

      btn.addEventListener('keydown', (e) => {
        const keys = ['ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (!keys.includes(e.key)) return;

        const all = toggles;
        const idx = all.indexOf(btn);
        let nextIdx = idx;

        if (e.key === 'ArrowUp') nextIdx = (idx - 1 + all.length) % all.length;
        if (e.key === 'ArrowDown') nextIdx = (idx + 1) % all.length;
        if (e.key === 'Home') nextIdx = 0;
        if (e.key === 'End') nextIdx = all.length - 1;

        if (all[nextIdx]) all[nextIdx].focus();
        e.preventDefault();
      });
    });
  }

  // Basic lazy enhancements
  function enhanceLazyMedia() {
    $$('img:not([decoding])').forEach(img => img.setAttribute('decoding', 'async'));
    $$('.homepage-section img:not([loading])').forEach(img => img.setAttribute('loading', 'lazy'));
  }

  async function autoInitModules() {
    const has = sel => !!document.querySelector(sel);
    if (document.getElementById('homepage')) { try { await import('/js/modules/homepage.js'); } catch {} }
    if (document.getElementById('blog-posts-container')) { try { await import('/js/modules/blog.js'); } catch {} }
    if (document.getElementById('blog-post-content')) { try { await import('/js/modules/blog-post.js'); } catch {} }
    if (document.getElementById('testimonials-container') || document.getElementById('homepage-testimonials-container') || has('.testimonials-slider')) { try { await import('/js/modules/testimonials.js'); } catch {} }
    if (document.getElementById('equipment-list')) {
      try {
        await import('/js/modules/equipment.js');
        if (typeof window.loadEquipment === 'function') window.loadEquipment();
      } catch {}
    }
    if (document.getElementById('packages-body') || document.getElementById('ala-carte-body')) {
      try {
        const mod = await import('/js/modules/pricing.js');
        if (mod && typeof mod.loadPricing === 'function') mod.loadPricing();
      } catch {}
    }
    if (document.getElementById('contact-form')) { try { await import('/js/modules/contact.js'); } catch {} }
    if (document.getElementById('other-services-container')) { try { await import('/js/modules/other-services.js'); } catch {} }
    if (document.getElementById('services-toggle') && document.getElementById('services-nav')) { try { await import('/js/modules/services-nav.js'); } catch {} }
    if (has('.filter-buttons')) { try { await import('/js/modules/portfolio.js'); } catch {} }
  }

  function initSkipLink() {
    if (!$('#main') && $('#homepage')) {
      $('#homepage').setAttribute('id', 'main');
    }
  }

  async function start() {
    initSkipLink();

    // Ensure containers exist even if markup is missing
    ensureContainer('header-container', 'start');
    ensureContainer('footer-container', 'end');

    // Load header & footer (no stray version tokens)
    await Promise.all([
      loadPartial('/header.html', '#header-container'),
      loadPartial('/footer.html', '#footer-container')
    ]);

    // Init mobile navigation right after header/footer injection
    try {
      await import('/js/modules/navigation.js');
      if (window.NSM?.navigation && typeof window.NSM.navigation.init === 'function') {
        window.NSM.navigation.init({
          navSelector: '.nav-menu, #primary-nav',
          openClassOnNav: 'open',
          injectBackdrop: false
        });
      }
    } catch (e) {
      console.error('Failed to init navigation module:', e);
    }

    // NEW: WIP banner offset -> sets --wip-h and .wip-on if banner is visible
    try { await import('/js/modules/wip-offset.js'); } catch {}

    // Sticky header spacer auto-measure (loop-free version you adopted)
    try { await import('/js/modules/sticky-header.js'); } catch {}

    // NEW: initialize site settings (renders service region + JSON-LD)
    try {
      const mod = await import('/js/modules/site-settings.js');
      if (mod?.initSiteSettings) await mod.initSiteSettings();
    } catch (e) {
      console.error('Failed to init site settings:', e);
    }

    enhanceServicesAccordion();
    enhanceLazyMedia();
    await autoInitModules();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
