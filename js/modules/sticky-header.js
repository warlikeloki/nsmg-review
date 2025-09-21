// /js/modules/sticky-header.js
// Loop-free header spacer: no CSS var writes, no ResizeObserver.
(function () {
  const header = document.getElementById('site-header');
  const spacer = document.getElementById('header-spacer');
  if (!header || !spacer) return;

  let rafId = 0;
  const apply = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const h = Math.ceil(header.getBoundingClientRect().height || 0);
      if (h > 0) spacer.style.height = `${h}px`;
    });
  };

  window.addEventListener('load', apply, { once: true });
  window.addEventListener('resize', apply);
  apply();
})();
