// /js/main.js
// Loads header/footer, then initializes navigation AFTER they exist.
// Adds a resilient fallback click handler for the hamburger so mobile works
// even if the module doesn't attach for any reason.

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function waitFor(selector, { timeout = 8000, root = document } = {}) {
    return new Promise((resolve, reject) => {
      const start = performance.now();
      (function tick(){
        const el = root.querySelector(selector);
        if (el) return resolve(el);
        if (performance.now() - start > timeout) {
          return reject(new Error("waitFor timeout: " + selector));
        }
        requestAnimationFrame(tick);
      })();
    });
  }

  function ensureContainer(id, position = "start") {
    if (document.getElementById(id)) return;
    const div = document.createElement("div");
    div.id = id;
    position === "start" ? document.body.prepend(div) : document.body.append(div);
  }

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
          <header id="site-header" class="nav-container" role="banner">
            <div class="container">
              <div class="nav-logo"><a href="/index.html" class="logo">Neil Smith Media Group</a></div>
              <nav aria-label="Primary">
                <ul class="nav-menu" id="nav-menu"><li><a href="/">Home</a></li></ul>
                <button class="hamburger" aria-controls="nav-menu" aria-expanded="false"><span></span><span></span><span></span></button>
              </nav>
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
        const hrefPath = new URL(a.href).pathname.replace(/\/+$/, "") || "/";
        if (hrefPath === path) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      } catch {}
    });
  }

  // ---- Resilient hamburger fallback (works even if module fails) ----
  function attachHamburgerFallback() {
    // Single delegated listener: covers header hamburger(s)
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".hamburger, [data-nav-toggle]");
      if (!btn) return;

      const targetId = btn.getAttribute("aria-controls") || "nav-menu";
      const menu = document.getElementById(targetId);
      if (!menu) return;

      e.preventDefault();

      const isOpen = menu.classList.toggle("open");
      document.documentElement.classList.toggle("nav-open", isOpen);
      document.body.classList.toggle("nav-open", isOpen);

      // aria-expanded hygiene
      const expanded = String(!!isOpen);
      btn.setAttribute("aria-expanded", expanded);

      // If any link inside the menu is clicked, close it (let navigation occur)
      if (isOpen) {
        const onLink = (evt) => {
          const a = evt.target.closest("a[href]");
          if (!a) return;
          menu.classList.remove("open");
          document.documentElement.classList.remove("nav-open");
          document.body.classList.remove("nav-open");
          btn.setAttribute("aria-expanded", "false");
          menu.removeEventListener("click", onLink, true);
        };
        menu.addEventListener("click", onLink, true);
      }
    }, { passive: false });
  }

  // Accessible accordion for any Services accordions (unchanged)
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

  function enhanceLazyMedia() {
    $$("img:not([decoding])").forEach(img => img.setAttribute("decoding", "async"));
    $$(".homepage-section img:not([loading])").forEach(img => img.setAttribute("loading", "lazy"));
  }

  async function autoInitModules() {
    const has = sel => !!document.querySelector(sel);

    if (document.getElementById("homepage")) { try { await import("/js/modules/homepage.js"); } catch {} }
    if (document.getElementById("blog-posts-container")) { try { await import("/js/modules/blog.js"); } catch {} }
    if (document.getElementById("blog-post-content")) { try { await import("/js/modules/blog-post.js"); } catch {} }

    if (
      document.getElementById("testimonials-container") ||
      document.getElementById("homepage-testimonials-container") ||
      has(".testimonials-slider") ||
      document.getElementById("testimonials-page")
    ) { try { await import("/js/modules/testimonials.js"); } catch {} }

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
      try { await import("/js/modules/services-nav.js"); } catch {} }
    if (has(".filter-buttons")) { try { await import("/js/modules/portfolio.js"); } catch {} }
  }

  function initSkipLink() {
    if (!document.getElementById("main") && document.getElementById("homepage")) {
      document.getElementById("homepage").setAttribute("id", "main");
    }
  }

  async function initNavigationAfterHeader() {
    await waitFor("#header-container header");   // injected header exists
    await waitFor("#nav-menu");                  // YOUR header’s UL

    // Attach resilient fallback first (works even if module import fails)
    attachHamburgerFallback();

    // Then try to import the full module for advanced behavior
    try {
      const mod = await import("/js/modules/navigation.js");
      if (window.NSM?.navigation && typeof window.NSM.navigation.init === "function") {
        window.NSM.navigation.init({
          headerSelector: "#header-container header",
          navSelector: "#nav-menu", // IMPORTANT: your UL id
          toggleSelector: "[data-nav-toggle], .hamburger, [aria-controls='nav-menu']",
          openClassOnNav: "open",
          desktopWidth: 1024,
          injectBackdrop: true,
          debug: false
        });
      }
    } catch (err) {
      console.warn("[NSMG] navigation module import failed; fallback handler is active.", err);
    }
  }

  async function start() {
    initSkipLink();
    ensureContainer("header-container", "start");
    ensureContainer("footer-container", "end");

    await Promise.all([
      loadPartial("/header.html", "#header-container"),
      loadPartial("/footer.html", "#footer-container")
    ]);

    await initNavigationAfterHeader();

    try { await import("/js/modules/wip-offset.js"); } catch {}
    try { await import("/js/modules/sticky-header.js"); } catch {}
    try {
      const mod = await import("/js/modules/site-settings.js");
      if (mod?.initSiteSettings) await mod.initSiteSettings();
    } catch (e) { console.error("Failed to init site settings:", e); }

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
