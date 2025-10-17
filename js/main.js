// /js/main.js
// Site bootstrap: load header/footer, then init navigation AFTER they exist.
// Also runs existing enhancements and lazy module loads.

(() => {
  // ---------- Tiny DOM helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Wait for an element to exist (with timeout)
  function waitFor(selector, { timeout = 8000, root = document } = {}) {
    return new Promise((resolve, reject) => {
      const start = performance.now();
      const tick = () => {
        const el = root.querySelector(selector);
        if (el) return resolve(el);
        if (performance.now() - start > timeout) {
          return reject(new Error("waitFor timeout: " + selector));
        }
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  // Ensure header/footer mount points exist so pages never go blank
  function ensureContainer(id, position = "start") {
    if (document.getElementById(id)) return;
    const div = document.createElement("div");
    div.id = id;
    position === "start" ? document.body.prepend(div) : document.body.append(div);
  }

  // Fetch & inject a partial
  async function loadPartial(url, containerSelector) {
    const container = $(containerSelector);
    if (!container) return;

    try {
      const res = await fetch(url, { credentials: "same-origin", cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const html = await res.text();
      container.innerHTML = html;
      if (containerSelector === "#header-container") setActiveNav();
    } catch (err) {
      if (containerSelector === "#header-container") {
        container.innerHTML = `
          <header class="site-header" role="banner">
            <div class="container">
              <a href="/" class="logo">Neil Smith Media Group</a>
              <nav id="primary-nav" class="nav-menu" aria-label="Primary"><a href="/">Home</a></nav>
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

  // Highlight the current link
  function setActiveNav() {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    const links = $$("#header-container nav a[href]");
    links.forEach(a => {
      try {
        const href = new URL(a.href);
        const hrefPath = href.pathname.replace(/\/+$/, "") || "/";
        if (hrefPath === path) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      } catch { /* ignore invalid URLs */ }
    });
  }

  // Accessible accordion for "Our Services"
  function enhanceServicesAccordion() {
    const toggles = $$(".services-accordion .accordion-toggle");
    if (!toggles.length) return;

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

        if (all[nextIdx]) all[nextIdx].focus();
        e.preventDefault();
      });
    });
  }

  // Basic lazy enhancements
  function enhanceLazyMedia() {
    $$("img:not([decoding])").forEach(img => img.setAttribute("decoding", "async"));
    $$(".homepage-section img:not([loading])").forEach(img => img.setAttribute("loading", "lazy"));
  }

  // Conditional module autoloads
  async function autoInitModules() {
    const has = sel => !!document.querySelector(sel);

    if (document.getElementById("homepage")) {
      try { await import("/js/modules/homepage.js"); } catch {}
    }
    if (document.getElementById("blog-posts-container")) {
      try { await import("/js/modules/blog.js"); } catch {}
    }
    if (document.getElementById("blog-post-content")) {
      try { await import("/js/modules/blog-post.js"); } catch {}
    }

    // Testimonials
    if (
      document.getElementById("testimonials-container") ||
      document.getElementById("homepage-testimonials-container") ||
      has(".testimonials-slider") ||
      document.getElementById("testimonials-page")
    ) {
      try { await import("/js/modules/testimonials.js"); } catch {}
    }

    if (document.getElementById("equipment-list")) {
      try {
        await import("/js/modules/equipment.js");
        if (typeof window.loadEquipment === "function") window.loadEquipment();
      } catch {}
    }
    if (document.getElementById("packages-body") || document.getElementById("ala-carte-body")) {
      try {
        const mod = await import("/js/modules/pricing.js");
        if (mod && typeof mod.loadPricing === "function") mod.loadPricing();
      } catch {}
    }
    if (document.getElementById("contact-form")) { try { await import("/js/modules/contact.js"); } catch {} }
    if (document.getElementById("other-services-container")) { try { await import("/js/modules/other-services.js"); } catch {} }
    if (document.getElementById("services-toggle") && document.getElementById("services-nav")) {
      try { await import("/js/modules/services-nav.js"); } catch {}
    }
    if (has(".filter-buttons")) { try { await import("/js/modules/portfolio.js"); } catch {} }
  }

  // Skip link target
  function initSkipLink() {
    if (!$("#main") && $("#homepage")) {
      $("#homepage").setAttribute("id", "main");
    }
  }

  // Initialize navigation AFTER header/footer are injected and present
  async function initNavigationAfterHeader() {
    // Ensure we actually have the injected header + nav
    await waitFor("header.site-header, header[role='banner']");
    await waitFor("#primary-nav.nav-menu");

    // Import module and init once
    const mod = await import("/js/modules/navigation.js");
    const api = (window.NSM && window.NSM.navigation) || (mod && mod.default);
    if (api && typeof window.NSM?.navigation?.init === "function") {
      window.NSM.navigation.init({
        headerSelector: "#header-container header",
        navSelector: "#nav-menu",                      // must match your UL id
        toggleSelector: "[data-nav-toggle], .hamburger, [aria-controls='nav-menu']",
        openClassOnNav: "open",
        desktopWidth: 1024
      });

      // console.log("[NSMG] navigation initialized");
    } else {
      console.warn("[NSMG] navigation module not available");
    }
  }

  // ----- Bootstrap -----
  async function start() {
    initSkipLink();

    // Ensure containers exist even if markup is missing
    ensureContainer("header-container", "start");
    ensureContainer("footer-container", "end");

    // Load header & footer
    await Promise.all([
      loadPartial("/header.html", "#header-container"),
      loadPartial("/footer.html", "#footer-container")
    ]);

    // Now that header exists, init navigation safely
    try {
      await initNavigationAfterHeader();
    } catch (e) {
      console.error("Failed to init navigation module:", e);
    }

    // WIP banner offset / Sticky header / Site settings
    try { await import("/js/modules/wip-offset.js"); } catch {}
    try { await import("/js/modules/sticky-header.js"); } catch {}
    try {
      const mod = await import("/js/modules/site-settings.js");
      if (mod?.initSiteSettings) await mod.initSiteSettings();
    } catch (e) {
      console.error("Failed to init site settings:", e);
    }

    // Misc enhancements + conditional modules
    enhanceServicesAccordion();
    enhanceLazyMedia();
    await autoInitModules();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
