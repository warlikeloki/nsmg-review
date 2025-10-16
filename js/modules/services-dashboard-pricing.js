/**
 * NSM-20 + NSM-176: Embed Pricing in Services dashboard
 * - NSM-20: initial inline Pricing iframe integration.
 * - NSM-176: add ?embed=1 query to hide sidebars/header/footer from the embedded pricing page.
 *   (embed mode handled by pricing.html + pricing.css)
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

  // Locate dashboard containers
  const leftNav = document.querySelector(
    'aside.left-sidebar, #left-sidebar, aside[aria-label="Services Navigation"], nav#services-nav, aside'
  );
  const main = document.querySelector(
    '#services-main, .services-main, main#main, main.services, main, .main-content, .dashboard-main'
  );
  const rightSidebar = document.querySelector(
    '.right-sidebar, #right-sidebar, aside.right-sidebar'
  );

  if (!leftNav || !main) return;

  // Ensure there's a "Pricing" control
  let pricingCtrl = leftNav.querySelector(
    '[data-dashboard-link="pricing"], #nav-pricing, a[href$="/pricing.html"], a[href$="pricing.html"], button[data-action="pricing"]'
  );

  if (!pricingCtrl) {
    pricingCtrl = document.createElement('a');
    pricingCtrl.id = 'nav-pricing';
    pricingCtrl.setAttribute('data-dashboard-link', 'pricing');
    pricingCtrl.href = '/services/pricing.html';
    pricingCtrl.textContent = 'Pricing';
    pricingCtrl.setAttribute('role', 'link');
    pricingCtrl.style.display = 'block';
    pricingCtrl.style.cursor = 'pointer';
    pricingCtrl.style.padding = '0.5rem 0.75rem';

    const list = leftNav.querySelector('ul, ol, nav') || leftNav;
    list.appendChild(pricingCtrl);
  }

  // Live region for screen readers
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
    if (!rightSidebar) return;
    rightSidebar.style.display = show ? '' : 'none';
    rightSidebar.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  function clearMain() {
    while (main.firstChild) main.removeChild(main.firstChild);
  }

  // Resize iframe dynamically to match pricing content
  function stripChromeAndResize(iframe) {
    function resize() {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;

        // NSM-176: header/footer hidden by embed mode, so no need to override here.
        // Retain resizing behavior only.
        const body = doc.body, html = doc.documentElement;
        const h = Math.max(
          body.scrollHeight, body.offsetHeight,
          html.clientHeight, html.scrollHeight, html.offsetHeight
        );
        iframe.style.height = (h + 20) + 'px';
      } catch (e) {
        // Same-origin expected; ignore otherwise
      }
    }
    iframe.addEventListener('load', resize, { once: true });
    setTimeout(resize, 600);
    setTimeout(resize, 1200);
  }

  // Mount the embedded Pricing iframe
  function mountPricing() {
    clearMain();

    const region = document.createElement('section');
    region.setAttribute('role', 'region');
    region.setAttribute('aria-label', 'Pricing Content');

    const iframe = document.createElement('iframe');
    iframe.title = 'Pricing';
    // NSM-176: Add embed=1 query for embed mode
    iframe.src = '/services/pricing.html?embed=1';
    iframe.style.width = '100%';
    iframe.style.border = '0';
    iframe.setAttribute('loading', 'lazy');

    region.appendChild(iframe);
    main.appendChild(region);

    stripChromeAndResize(iframe);
    showRightSidebar(false);
    live.textContent = 'Pricing loaded.';
  }

  // Intercept clicks to load inline Pricing
  pricingCtrl.addEventListener('click', (ev) => {
    const isModified = ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey || ev.button === 1;
    if (pricingCtrl.tagName === 'A' && isModified) return; // open in new tab if requested

    ev.preventDefault();
    mountPricing();

    // Mark active item
    [...leftNav.querySelectorAll('.active')].forEach(el => el.classList.remove('active'));
    pricingCtrl.classList.add('active');

    // Restore sidebar when leaving Pricing
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
