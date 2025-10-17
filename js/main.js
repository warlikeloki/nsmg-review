// /js/main.js
// Robust bootstrap: inject header/footer, ensure viewport meta, force a JS mobile mode
// class on small screens, then wire the hamburger with a resilient fallback.
// Keeps your existing module auto-inits intact.

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // --- Viewport + JS-controlled mobile mode (add near the top of main.js) ---
(function ensureViewportMetaAndMobileClass(){
  // Ensure we have a correct mobile viewport meta
  const wanted = "width=device-width, initial-scale=1.0, viewport-fit=cover";
  let tag = document.head.querySelector('meta[name="viewport"]');
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = "viewport";
    tag.content = wanted;
    document.head.appendChild(tag);
  } else if (!/width\s*=\s*device-width/i.test(tag.content)) {
    tag.content = wanted;
  }

  // JS-controlled mobile mode to avoid media-query jitter
  function setNavMobileClass() {
    const MOBILE_MAX = 1050; // buffer above 1023 to absorb scrollbar/zoom jitter
    const isMobile = window.innerWidth <= MOBILE_MAX;
    document.documentElement.classList.toggle("nav-mobile", isMobile);
  }
  setNavMobileClass();
  window.addEventListener("resize", setNavMobileClass, { passive: true });
  window.addEventListener("orientationchange", setNavMobileClass, { passive: true });
})();

  // --- Utilities ---
  function waitFor(selector, { timeout = 8000, root = document } = {}) {
    return new Promise((resolve, reject) => {
      const t0 = performance.now();
      (function tick() {
        const el = root.querySelector(selector);
        if (el) return resolve(el);
        if (performance.now() - t0 > timeout) return reject(new Error("waitFor timeout: " + selector));
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

  function ensureViewportMeta() {
    const head = document.head || document.getElementsByTagName("head")[0];
    let tag = head.querySelector('meta[name="viewport"]');
    const wanted = "width=device-width, initial-scale=1.0, viewport-fit=cover";
    if (!tag) {
      tag = document.createElement("meta");
      tag.name = "viewport";
      tag.content = wanted;
      head.appendChild(tag);
    } else {
      // Fix common bad values (e.g., width=1280)
      if (!/width\s*=\s*device-width/i.test(tag.content)) tag.content = wanted;
    }
  }

  // JS-controlled mobile mode: avoids breakpoint flicker and layout “snapping”
  function setNavMobileClass() {
    const MOBILE_MAX = 1050; // small buffer above 1023 to avoid scrollbar jitter
    const isMobile = window.innerWidth <= MOBILE_MAX;
    document.documentElement.classList.toggle("nav-mobile", isMobile);
  }

  // --- Partials ---
  async function loadPartial(url, containerSelector) {
    const container = $(containerSelector);
    if (!container) return;
    try {
      const res = await fetch(url, { credentials: "same-origin", cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      container.innerHTML = await res.text();
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
    $$("#header-container nav a[href]").forEach(a => {
      try {
        const hrefPath = new URL(a.href).pathname.replace(/\/+$/, "") || "/";
        if (hrefPath === path) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      } catch {}
    });
  }

  // --- Resilient hamburger fallback (works even if module fails) ---
  function attachHamburgerFallback() {
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
      btn.setAttribute("aria-expanded", String(isOpen));

      // Close when a link inside menu is clicked
      const onLink = (evt) => {
        const a = evt.target.closest("a[href]");
        if (!a) return;
        menu.classList.remove("open");
        document.documentElement.classList.remove("nav-open");
        document.body.classList.remove("nav-open");
        btn.setAttribute("aria-expanded", "false");
        menu.removeEventListener("click", onLink, true);
      };
      if (isOpen) menu.addEventListener("click", onLink, true);
    }, { passive: false });
  }

  // --- Optional: your services accordion (unchanged) ---
  function enhanceServicesAccordion() {
    const toggles = $$(".services-accordion .accordion-toggle");
    if (!toggles.length) return;
    toggles.forEach(btn => {
      const pid = btn.getAttribute("aria-controls");
      const panel = pid ? document.getElementById(pid) : null;
      const expanded = btn.getAttribute("aria-expanded") === "true";
      if (panel) panel.hidden = !expanded;

      btn.addEventListener("click", () => {
        const isExpanded = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!isExpanded));
        if (panel) panel.hidden = isExpanded;
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

  async function initNavigationAfterHeader() {
    await waitFor("#header-container header");
    await waitFor("#nav-menu"); // your UL

    // 1) Force correct mobile/desktop mode immediately and on resize
    setNavMobileClass();
    window.addEventListener("resize", setNavMobileClass, { passive: true });
    window.addEventListener("orientationchange", setNavMobileClass, { passive: true });

    // 2) Attach reliable fallback so hamburger always works
    attachHamburgerFallback();

    // 3) Try to activate the full module (submenu tap logic, etc.)
    try {
      const mod = await import("/js/modules/navigation.js");
      if (window.NSM?.navigation && typeof window.NSM.navigation.init === "function") {
        window.NSM.navigation.init({
          headerSelector: "#header-container header",
          navSelector: "#nav-menu",
          toggleSelector: "[data-nav-toggle], .hamburger, [aria-controls='nav-menu']",
          openClassOnNav: "open",
          desktopWidth: 1024,
          injectBackdrop: true,
          debug: false
        });
      }
    } catch (err) {
      console.warn("[NSMG] navigation module import failed; fallback handler remains active.", err);
    }
  }

  // --- Boot ---
  async function start() {
    ensureViewportMeta();         // <- critical for real phones
    ensureContainer("header-container", "start");
    ensureContainer("footer-container", "end");

    await Promise.all([
      loadPartial("/header.html", "#header-container"),
      loadPartial("/footer.html", "#footer-container")
    ]);

    await initNavigationAfterHeader();

    // Other site features
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
