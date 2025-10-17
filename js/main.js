// /js/main.js
// Hybrid approach:
// 1) If a page already fetched header/footer inline, we use it.
// 2) If not present after a short wait, we inject them as a fallback (page-only).
// Robust hamburger fallback so the menu opens even if the module isn't ready.

(() => {
  // ---------- Helpers ----------
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function waitFor(selector, { timeout = 2500, root = document } = {}) {
    return new Promise((resolve, reject) => {
      const start = performance.now();
      (function tick(){
        const el = root.querySelector(selector);
        if (el) return resolve(el);
        if (performance.now() - start > timeout) return reject(new Error("waitFor timeout: " + selector));
        requestAnimationFrame(tick);
      })();
    });
  }

  function ensureViewportMeta() {
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
  }

  function installNavMobileClass() {
    const MOBILE_MAX = 1050; // buffer above 1023 for scrollbar/zoom jitter
    function setNavMobile() {
      document.documentElement.classList.toggle("nav-mobile", window.innerWidth <= MOBILE_MAX);
    }
    setNavMobile();
    window.addEventListener("resize", setNavMobile, { passive: true });
    window.addEventListener("orientationchange", setNavMobile, { passive: true });
  }

  function setActiveNav() {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    $$("#header-container nav a[href], header nav a[href]").forEach(a => {
      try {
        const hrefPath = new URL(a.href, location.origin).pathname.replace(/\/+$/, "") || "/";
        if (hrefPath === path) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      } catch {}
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
    const res = await fetch(url, { credentials: "same-origin", cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    container.innerHTML = await res.text();
  }

  // --------- Fallback so hamburger always works ---------
  function attachHamburgerFallback() {
    document.addEventListener("click", (e) => {
      if (window.__NSM_NAV_READY === true) return; // real module owns it

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

  // --------- Ensure we HAVE a header/footer (use inline if present; inject if missing) ---------
  async function ensureHeaderAndFooter() {
    // Make sure containers exist in case we need to inject
    ensureContainer("header-container", "start");
    ensureContainer("footer-container", "end");

    // If header already present (inline fetch or hardcoded), we're done.
    const foundHeader = document.querySelector("#header-container header, header.nav-container, header.site-header");
    if (foundHeader) return "existing";

    // Give inline fetch a moment to populate
    try {
      await waitFor("#header-container header, header.nav-container, header.site-header", { timeout: 2500 });
      return "inline";
    } catch {
      // Still no header — inject as a fallback for this page only
      try {
        await loadPartial("/header.html", "#header-container");
      } catch (e) {
        console.error("[NSMG] Failed to inject header.html:", e);
      }
      try {
        await loadPartial("/footer.html", "#footer-container");
      } catch (e) {
        console.error("[NSMG] Failed to inject footer.html:", e);
      }
      return "injected";
    }
  }

  // --------- Initialize navigation after header is confirmed ---------
  async function initNavigation() {
    // Wait for header (whether inline or injected)
    const mode = await ensureHeaderAndFooter();

    // Now ensure the UL menu exists
    await waitFor("#nav-menu", { timeout: 4000 }).catch(() => {
      console.warn("[NSMG] #nav-menu not found; hamburger fallback will still work if aria-controls points to the right id.");
    });

    setActiveNav();
    installNavMobileClass();
    attachHamburgerFallback();

    // Try to enable the full navigation module (submenu tap logic)
    try {
      const mod = await import("/js/modules/navigation.js");
      if (window.NSM?.navigation && typeof window.NSM.navigation.init === "function") {
        window.NSM.navigation.init({
          headerSelector: "#header-container header, header.nav-container, header.site-header",
          navSelector: "#nav-menu",
          toggleSelector: "[data-nav-toggle], .hamburger, [aria-controls='nav-menu']",
          openClassOnNav: "open",
          desktopWidth: 1024,
          injectBackdrop: true,
          debug: false
        });
        window.__NSM_NAV_READY = true; // silence fallback
        // console.info(`[NSMG] navigation initialized (${mode})`);
      }
    } catch (err) {
      console.warn("[NSMG] navigation module import failed; using fallback only.", err);
    }
  }

  // --------- Page feature modules (unchanged logic) ---------
  async function autoInitModules() {
    const has = (sel) => !!document.querySelector(sel);

    if (document.getElementById("homepage"))                 { try { await import("/js/modules/homepage.js"); } catch {} }
    if (document.getElementById("blog-posts-container"))     { try { await import("/js/modules/blog.js"); } catch {} }
    if (document.getElementById("blog-post-content"))        { try { await import("/js/modules/blog-post.js"); } catch {} }

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

    if (document.getElementById("contact-form"))             { try { await import("/js/modules/contact.js"); } catch {} }
    if (document.getElementById("other-services-container")) { try { await import("/js/modules/other-services.js"); } catch {} }
    if (document.getElementById("services-toggle") && document.getElementById("services-nav")) {
      try { await import("/js/modules/services-nav.js"); } catch {}
    }
    if (has(".filter-buttons"))                              { try { await import("/js/modules/portfolio.js"); } catch {} }
  }

  // --------- Boot ---------
  async function start() {
    ensureViewportMeta();

    try { await initNavigation(); } catch (e) {
      console.error("Nav init error:", e);
    }

    // Sticky header / WIP offset / site settings AFTER header exists
    try { await import("/js/modules/wip-offset.js"); } catch {}
    try { await import("/js/modules/sticky-header.js"); } catch {}
    try {
      const mod = await import("/js/modules/site-settings.js");
      if (mod?.initSiteSettings) await mod.initSiteSettings();
    } catch (e) { console.error("Failed to init site settings:", e); }

    // Light enhancements
    $$("img:not([decoding])").forEach(img => img.setAttribute("decoding", "async"));
    $$(".homepage-section img:not([loading])").forEach(img => img.setAttribute("loading", "lazy"));

    await autoInitModules();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
