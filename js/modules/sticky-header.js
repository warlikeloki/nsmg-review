// /js/modules/sticky-header.js
// Computes live header height and exposes it to CSS as --nsm-header-h.
// Also toggles a class when the page is scrolled past the header.

(function () {
  const DOC = document.documentElement;
  let rafId = null;
  let last = 0;

  function px(n) { return `${Math.round(n)}px`; }

  function readHeaderHeight() {
    // Try common header locations created by header injection
    const header =
      document.querySelector("#header-container header") ||
      document.querySelector("header.nav-container") ||
      document.querySelector("header.site-header") ||
      document.querySelector("header");

    if (!header) return 0;

    const rect = header.getBoundingClientRect();
    // If header is position:fixed at top, its height is rect.height.
    // If not fixed yet, fall back to computed style to avoid layout shifts.
    const h = rect.height || parseFloat(getComputedStyle(header).height) || 0;
    return Math.max(0, h);
  }

  function apply() {
    rafId = null;
    const h = readHeaderHeight();
    if (!h || Math.abs(h - last) > 0.5) {
      last = h;
      DOC.style.setProperty("--nsm-header-h", px(h || 96)); // sane default
    }
    // Scrolled past header?
    const past = (window.scrollY || window.pageYOffset || 0) > (h || 0);
    DOC.classList.toggle("nsm-scrolled", past);
  }

  function schedule() {
    if (rafId) return;
    rafId = requestAnimationFrame(apply);
  }

  // Recompute on resize/orientation/content changes
  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("orientationchange", schedule, { passive: true });

  // Observe header container mutations (injection happens asynchronously)
  const container = document.getElementById("header-container") || document.body;
  const mo = new MutationObserver(schedule);
  mo.observe(container, { childList: true, subtree: true });

  // Initial run (after DOM ready if needed)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule, { once: true });
  } else {
    schedule();
  }

  // Public hook (optional)
  window.NSM = window.NSM || {};
  window.NSM.refreshHeaderHeight = schedule;
})();
