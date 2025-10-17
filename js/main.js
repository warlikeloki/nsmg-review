// /js/main.js
// Central bootstrap (hardened):
// - Waits for <body>, ensures header/footer containers exist
// - Injects /header.html and /footer.html with safe fallbacks
// - Initializes navigation (with resilient hamburger fallback)
// - Enforces correct mobile viewport and stabilizes mobile layout
// - Conditionally loads /js/modules/* based on DOM markers

(() => {
  // ---------- Tiny helpers ----------
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function waitFor(selector, { timeout = 10000, root = document } = {}) {
    return new Promise((resolve, reject) => {
      const t0 = performance.now();
      (function tick(){
        const el = root.querySelector(selector);
        if (el) return resolve(el);
        if (performance.now() - t0 > timeout) return reject(new Error("waitFor timeout: " + selector));
        requestAnimationFrame(tick);
      })();
    });
  }

  async function waitForBody() {
    if (document.body) return document.body;
    return waitFor("body", { timeout: 15000 });
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

  // JS-stabilized mobile class to avoid breakpoint jitter/scrollbar effects.
  function installNavMobileClass() {
    const MOBILE_MAX = 1050; // buffer above 1023
    function setNavMobile() {
      document.documentElement.classList.toggle("nav-mobile", window.innerWidth <= MOBILE_MAX);
    }
    setNavMobile();
    window.addEventListener("resize", setNavMobile, { passive: true });
    window.addEventListener("orientationchange", setNavMobile, { passive: true });
  }

  // Create or return a container. Requires body to exist.
  function ensureContainer(id, position = "start") {
    let el = document.getElementById(id);
    if (el) return el;
    el = document.createElement("div");
    el.id = id;
    if (!document.body) return null; // should not happen after waitForBody
    if (position === "start") document.body.prepend(el);
    else document.body.append(el);
    return el;
  }

  async function loadPartial(url, container) {
    if (!container) return false;
    try {
      const res = await fetch(url, { credentials: "same-origin", cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const html = await res.text();
      container.innerHTML = html;
      return true;
    } catch (e) {
      console.error(`[NSMG] Failed to load ${url}:`, e);
      return false;
    }
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

  // --------- Resilient fallback so hamburger always works ---------
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

  // --------- Inject header/footer safely (with fallbacks) ---------
  async function ensureHeaderAndFooterInjected() {
    await waitForBody();

    const headerContainer = ensureContainer("header-container", "start");
    const footerContainer = ensureContainer("footer-container", "end");

    // Clear any stale content to avoid duplicates
    if (headerContainer) headerContainer.replaceChildren();
    if (footerContainer) footerContainer.replaceChildren();

    const headerOk = await loadPartial("/header.html", headerContainer);
    const footerOk = await loadPartial("/footer.html", footerContainer);

    // Minimal fallbacks if the partials failed (keeps site usable)
    if (!headerOk && headerContainer) {
      headerContainer.innerHTML = `
        <header id="site-header" class="nav-container" role="banner">
          <div class="container">
            <div class="nav-logo"><a href="/index.html">Neil Smith Media Group</a></div>
            <nav aria-label="Primary">
              <ul class="nav-menu" id="nav-menu">
                <li><a href="/index.html">Home</a></li>
              </ul>
              <button class="hamburger" aria-controls="nav-menu" aria-expanded="false"><span></span><span></span><span></span></button>
            </nav>
          </div>
        </header>`;
    }
    if (!footerOk && footerContainer) {
      footerContainer.innerHTML = `
        <footer class="site-footer">
          <div class="container">
            <p>&copy; ${new Date().getFullYear()} Neil Smith Media Group</p>
          </div>
        </footer>`;
    }

    // Ensure we truly have a header element before proceeding
    await waitFor("#header-container header, header.nav-container, header.site-header", { timeout: 8000 });
  }

  // ------------------ Bootstrap: inject + init nav ------------------
  async function initNavigation() {
    await ensureHeaderAndFooterInjected();

    // Ensure #nav-menu exists; if not, create a tiny one as a last resort
    let navMenu = document.getElementById("nav-menu");
    if (!navMenu) {
      const header = $("#header-container header, header.nav-container, header.site-header");
      if (header) {
        const nav = header.querySelector("nav") || header.appendChild(document.createElement("nav"));
        nav.setAttribute("aria-label", nav.getAttribute("aria-label") || "Primary");
        navMenu = document.createElement("ul");
        navMenu.id = "nav-menu";
        navMenu.className = "nav-menu";
        navMenu.innerHTML = `<li><a href="/index.html">Home</a></li>`;
        nav.appendChild(navMenu);
      }
    }

    // Stabilize layout & make hamburger work regardless of module status.
    setActiveNav();
    installNavMobileClass();
    attachHamburgerFallback();

    // Try to enable the full navigation module (submenu tap logic, ARIA, etc.)
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
        window.__NSM_NAV_READY = true; // fallback steps aside
      }
    } catch (err) {
      console.warn("[NSMG] navigation module import failed; fallback handler remains active.", err);
    }
  }

  // ------------------ Conditional module autoloads ------------------
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

  // ------------------ Boot ------------------
  async function start() {
    ensureViewportMeta();

    try { await initNavigation(); } catch (e) {
      console.error("Nav init error:", e);
    }

    // Stickies & site chrome (after header exists)
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
