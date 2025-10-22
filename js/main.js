// /js/main.js
// Central bootstrap (hardened)

(() => {
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

  function ensureGlobalStylesheets(hrefs = []) {
    const head = document.head || document.getElementsByTagName('head')[0];
    if (!head) return;
    hrefs.forEach((href) => {
      if (!href) return;
      const exists = head.querySelector(`link[rel="stylesheet"][href="${href}"], link[rel="stylesheet"][data-nsm-href="${href}"]`);
      if (exists) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-nsm-href', href);
      head.appendChild(link);
    });
  }

  function installNavMobileClass() {
    const MOBILE_MAX = 1050;
    function setNavMobile() {
      document.documentElement.classList.toggle("nav-mobile", window.innerWidth <= MOBILE_MAX);
    }
    setNavMobile();
    window.addEventListener("resize", setNavMobile, { passive: true });
    window.addEventListener("orientationchange", setNavMobile, { passive: true });
  }

  function ensureContainer(id, position = "start") {
    let el = document.getElementById(id);
    if (el) return el;
    el = document.createElement("div");
    el.id = id;
    if (!document.body) return null;
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

  function attachHamburgerFallback() {
    document.addEventListener("click", (e) => {
      if (window.__NSM_NAV_READY === true) return;

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

  async function ensureHeaderAndFooterInjected() {
    await waitForBody();
    const headerContainer = ensureContainer("header-container", "start");
    const footerContainer = ensureContainer("footer-container", "end");
    if (headerContainer) headerContainer.replaceChildren();
    if (footerContainer) footerContainer.replaceChildren();

    const headerOk = await loadPartial("/header.html", headerContainer);
    const footerOk = await loadPartial("/footer.html", footerContainer);

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

    await waitFor("#header-container header, header.nav-container, header.site-header", { timeout: 8000 });
  }

  async function initNavigation() {
    await ensureHeaderAndFooterInjected();

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

    setActiveNav();
    installNavMobileClass();
    attachHamburgerFallback();

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
        window.__NSM_NAV_READY = true;
      }
    } catch (err) {
      console.warn("[NSMG] navigation module import failed; fallback remains active.", err);
    }
  }

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

    // FIXED: Only auto-call loadEquipment if NOT on services dashboard
    // Services dashboard handles equipment loading via services.js
    const onServicesPage = document.body.classList.contains("services") || 
                           !!document.getElementById("services-content");
    
    if (document.getElementById("equipment-list") && !onServicesPage) {
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

    if (document.getElementById("contact-form")) {
      try {
        const mod = await import("/js/modules/contact.js");
        if (mod?.initContactForm) mod.initContactForm();
      } catch (e) {
        console.error("[NSMG] contact module failed to init:", e);
      }
    }

    if (document.getElementById("service-request-form")) {
      try {
        const mod = await import("/js/modules/service-request.js");
        if (mod?.initServiceRequestForm) mod.initServiceRequestForm();
      } catch (e) {
        console.error("[NSMG] service-request module failed to init:", e);
      }
    }

    // FIXED: Check for both possible IDs
    if (document.getElementById("other-services-list") || document.getElementById("other-services-container")) { 
      console.log('[main.js] Found other-services element, importing module...');
      try { await import("/js/modules/other-services.js"); } catch {} 
    }
    
    if (has(".filter-buttons"))                              { try { await import("/js/modules/portfolio.js"); } catch {} }

    // STRICT Services autoload: only on the Services page
    if (onServicesPage) {
      try {
        const mod = await import("/js/pages/services.js");
        if (typeof mod?.default === "function") { mod.default(); }
        // IIFE fallback: if services.js is self-executing, importing it is sufficient.
      } catch (e) {
        console.error("[NSMG] Failed to load /js/pages/services.js", e);
      }
    }
  }

  async function start() {
    ensureViewportMeta();
    ensureGlobalStylesheets([
      "/css/layout-global.css",
      "/css/home-cta.css"
    ]);

    try { await initNavigation(); } catch (e) {
      console.error("Nav init error:", e);
    }

    try { await import("/js/modules/wip-offset.js"); } catch {}
    try { await import("/js/modules/sticky-header.js"); } catch {}
    try {
      const mod = await import("/js/modules/site-settings.js");
      if (mod?.initSiteSettings) await mod.initSiteSettings();
    } catch (e) { console.error("Failed to init site settings:", e); }

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