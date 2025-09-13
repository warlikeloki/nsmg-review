/**
 * NSM-20: Embed Pricing in Services dashboard (no right sidebar required).
 * - Adds a "Pricing" control to the left nav if missing.
 * - Injects /pricing.html into the main content area via same-origin iframe.
 * - If a right sidebar exists, hides it while Pricing is active (no-op if absent).
 * - Preserves no-JS fallback (href="/pricing.html").
 * - Announces changes via an ARIA live region.
 */

(function () {
  // Utility: add a simple visually-hidden style once (no CSS edits needed)
  (function ensureVisuallyHidden() {
    if (document.getElementById("nsmg-visually-hidden-style")) return;
    const style = document.createElement("style");
    style.id = "nsmg-visually-hidden-style";
    style.textContent = `
      .visually-hidden {
        position: absolute !important;
        width: 1px; height: 1px; padding: 0; margin: -1px;
        overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
      }
    `;
    document.head.appendChild(style);
  })();

  // Try to locate typical containers in Services dashboard
  const leftNav = document.querySelector(
    'aside.left-sidebar, #left-sidebar, aside[aria-label="Services Navigation"], nav#services-nav, aside'
  );
  const main = document.querySelector(
    '#services-main, .services-main, main#main, main.services, main, .main-content, .dashboard-main'
  );
  const rightSidebar = document.querySelector(
    '.right-sidebar, #right-sidebar, aside.right-sidebar'
  ); // may be null (thatâ€™s OK)

  if (!leftNav || !main) {
    // Can't initialize without a left nav and a main content container
    return;
  }

  // Find existing Pricing control; if absent, create one
  let pricingCtrl = leftNav.querySelector(
    '[data-dashboard-link="pricing"], #nav-pricing, a[href$="/pricing.html"], a[href$="pricing.html"], button[data-action="pricing"]'
  );

  if (!pricingCtrl) {
    // Create a link (no-JS fallback), then JS intercepts clicks for inline view
    pricingCtrl = document.createElement('a');
    pricingCtrl.id = 'nav-pricing';
    pricingCtrl.setAttribute('data-dashboard-link', 'pricing');
    pricingCtrl.href = '/pricing.html';
    pricingCtrl.textContent = 'Pricing';
    pricingCtrl.setAttribute('role', 'link');
    pricingCtrl.style.display = 'block';
    pricingCtrl.style.cursor = 'pointer';
    pricingCtrl.style.padding = '0.5rem 0.75rem';

    // Insert near the end of the left nav
    // Prefer a list/menu inside left sidebar, else append directly
    const list = leftNav.querySelector('ul, ol, nav') || leftNav;
    list.appendChild(pricingCtrl);
  }

  // Live region for SR announcement
  let live = document.getElementById('sr-live');
  if (!live) {
    live = document.createElement('div');
    live.id = 'sr-live';
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    live.className = 'visually-hidden';
    document.body.appendChild(live);
  }

  function showRightSidebar(show) {
    if (!rightSidebar) return; // no-op if not present
    rightSidebar.style.display = show ? '' : 'none';
    rightSidebar.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  function clearMain() {
    // Preserve container but clear its children
    while (main.firstChild) main.removeChild(main.firstChild);
  }

  function stripChromeAndResize(iframe) {
    function resize() {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;

        // Hide header/footer inside the iframe to avoid nested chrome
        const header = doc.querySelector('#header-container, header');
        const footer = doc.querySelector('#footer-container, footer');
        if (header) header.style.display = 'none';
        if (footer) footer.style.display = 'none';

        // Resize height to content
        const body = doc.body, html = doc.documentElement;
        const h = Math.max(
          body.scrollHeight, body.offsetHeight,
          html.clientHeight, html.scrollHeight, html.offsetHeight
        );
        iframe.style.height = (h + 20) + 'px';
      } catch (e) {
        // Same-origin expected; ignore just in case
      }
    }
    iframe.addEventListener('load', resize, { once: true });
    // Re-run after assets settle
    setTimeout(resize, 600);
    setTimeout(resize, 1200);
  }

  function mountPricing() {
    clearMain();

    const region = document.createElement('section');
    region.setAttribute('role', 'region');
    region.setAttribute('aria-label', 'Pricing Content');

    const iframe = document.createElement('iframe');
    iframe.title = 'Pricing';
    iframe.src = '/pricing.html';
    iframe.style.width = '100%';
    iframe.style.border = '0';
    iframe.setAttribute('loading', 'lazy');

    region.appendChild(iframe);
    main.appendChild(region);

    stripChromeAndResize(iframe);
    showRightSidebar(false);
    live.textContent = 'Pricing loaded.';
  }

  // Intercept clicks (respect Ctrl/Cmd/Shift/Alt for fallback)
  pricingCtrl.addEventListener('click', (ev) => {
    const isModified = ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey || ev.button === 1;
    if (pricingCtrl.tagName === 'A' && isModified) return; // open in new tab as usual

    ev.preventDefault();
    mountPricing();

    // Set active class
    [...leftNav.querySelectorAll('.active')].forEach(el => el.classList.remove('active'));
    pricingCtrl.classList.add('active');

    // Restore sidebar when navigating to other sections
    if (!leftNav._nsmg_navBound) {
      leftNav.addEventListener('click', (e) => {
        const t = e.target.closest('a,button');
        if (!t || t === pricingCtrl) return;
        showRightSidebar(true);
      });
      leftNav._nsmg_navBound = true;
    }
  }, { passive: false });
})();
