// /js/main.js
// Site bootstrap: load header/footer, enhance nav & accordions, small a11y helpers.

(() => {
  // Safe DOM helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  async function loadPartial(url, containerSelector) {
    const container = $(containerSelector);
    if (!container) return;

    try {
      const res = await fetch(url, { credentials: "same-origin" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const html = await res.text();
      container.innerHTML = html;
      // After inject, update active nav highlighting
      if (containerSelector === "#header-container") {
        setActiveNav();
      }
    } catch (err) {
      // Minimal fallback so the page isn't blank if fetch fails
      if (containerSelector === "#header-container") {
        container.innerHTML = `
          <header class="site-header">
            <div class="container">
              <a href="/" class="logo">Neil Smith Media Group</a>
              <nav aria-label="Primary"><a href="/">Home</a></nav>
            </div>
          </header>`;
      } else if (containerSelector === "#footer-container") {
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
    const path = location.pathname.replace(/\/+$/, "") || "/";
    const links = $$("#header-container nav a[href]");
    links.forEach(a => {
      try {
        const href = new URL(a.href);
        const hrefPath = href.pathname.replace(/\/+$/, "") || "/";
        if (hrefPath === path) {
          a.setAttribute("aria-current", "page");
        } else {
          a.removeAttribute("aria-current");
        }
      } catch { /* ignore */ }
    });
  }

  // Accessible accordion for "Our Services"
  function enhanceServicesAccordion() {
    const toggles = $$(".services-accordion .accordion-toggle");
    if (!toggles.length) return;

    // Ensure ARIA state is synced to DOM
    toggles.forEach(btn => {
      const controlsId = btn.getAttribute("aria-controls");
      const panel = controlsId ? document.getElementById(controlsId) : null;
      const expanded = btn.getAttribute("aria-expanded") === "true";
      if (panel) panel.hidden = !expanded;

      btn.addEventListener("click", () => {
        const isExpanded = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!isExpanded));
        if (panel) panel.hidden = isExpanded;
      });

      // Keyboard support: Up/Down cycle, Home/End jump
      btn.addEventListener("keydown", (e) => {
        const keys = ["ArrowUp", "ArrowDown", "Home", "End"];
        if (!keys.includes(e.key)) return;

        const all = toggles;
        const idx = all.indexOf(btn);
        let nextIdx = idx;

        if (e.key === "ArrowUp") nextIdx = (idx - 1 + all.length) % all.length;
        if (e.key === "ArrowDown") nextIdx = (idx + 1) % all.length;
        if (e.key === "Home") nextIdx = 0;
        if (e.key === "End") nextIdx = all.length - 1;

        all[nextIdx]?.focus();
        e.preventDefault();
      });
    });
  }

  // Basic lazy enhancements
  function enhanceLazyMedia() {
    // Add decoding async to images that don't have it
    $$("img:not([decoding])").forEach(img => img.setAttribute("decoding", "async"));
    // Ensure non-hero images lazy-load
    $$('.homepage-section img:not([loading])').forEach(img => img.setAttribute("loading", "lazy"));
  }

  function initSkipLink() {
    // If there’s no #main, but #homepage exists, alias it
    if (!$("#main") && $("#homepage")) {
      $("#homepage").setAttribute("id", "main");
    }
  }

  async function start() {
    initSkipLink();
    await Promise.all([
      loadPartial("/header.html", "#header-container"),
      loadPartial("/footer.html", "#footer-container")
    ]);
    enhanceServicesAccordion();
    enhanceLazyMedia();
  }

  // Run on DOM ready (defer is set in HTML)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
