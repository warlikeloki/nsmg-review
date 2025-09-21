// /js/modules/wip-offset.js
// Detect the WIP banner height and expose it as a CSS var so the header can offset itself.
// Adds .wip-on to <html> only when a visible banner exists.
// Listens for custom visibility events from wip.js and also watches DOM changes.

(function () {
  const DOC = document.documentElement;

  // Include the actual ID used by your banner script
  const CANDIDATES = [
    '#nsmg-wip-banner', // <- your real banner element
    '#wip-banner',
    '.wip-banner',
    '.wip-notice',
    '.wip',
    '[data-wip="banner"]'
  ];

  function getBanner() {
    for (const sel of CANDIDATES) {
      const el = document.querySelector(sel);
      if (el && el.getBoundingClientRect().height > 0 && getComputedStyle(el).display !== 'none') {
        return el;
      }
    }
    return null;
  }

  let rafId = 0;
  const apply = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const banner = getBanner();
      const h = banner ? Math.ceil(banner.getBoundingClientRect().height) : 0;
      DOC.style.setProperty('--wip-h', `${h}px`);
      DOC.classList.toggle('wip-on', h > 0);

      // Ask sticky-header spacer to re-measure
      window.dispatchEvent(new Event('resize'));
    });
  };

  // Run on readiness + load + resize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  } else {
    apply();
  }
  window.addEventListener('load', apply, { once: true });
  window.addEventListener('resize', apply);

  // React to your wip.js show/hide events
  window.addEventListener('nsmg:wip:shown', apply);
  window.addEventListener('nsmg:wip:hidden', apply);

  // Also observe DOM mutations near the top for robustness
  const mo = new MutationObserver(apply);
  mo.observe(document.body, { childList: true, subtree: true, attributes: true });
})();
