/*! NSM-91: /js/modules/navigation.js (compat module)
 * Use from main.js:  window.NSM.navigation.init();
 * Optional config:   window.NSM.navigation.init({ toggleSelector: "...", navSelector: "...", openClassOnNav: "..." });
 * This does NOT replace your header or CSS. It binds safely to what you already have.
 */
(function (root) {
  "use strict";

  var DEFAULT_CONFIG = {
    headerSelector: "#site-header, header[role='banner'], header.site-header, header",
    toggleSelector: "[data-nav-toggle], button[aria-controls], .nav-toggle, .hamburger, .menu-toggle",
    // If a toggle has [aria-controls], that element wins for navEl
    navSelector: "#primary-nav, nav[aria-label='Primary'], nav.primary-nav, header nav, nav",
    desktopWidth: 1024,
    openClassOnHtml: "nav-open",
    openClassOnNav: "is-open",
    injectBackdrop: true,
    backdropId: "nsm-nav-backdrop",
    bindOnceAttr: "data-nav-bound"
  };

  function mergeConfig(base, extra) {
    var out = {}, k;
    for (k in base) out[k] = base[k];
    if (extra && typeof extra === "object") for (k in extra) out[k] = extra[k];
    return out;
  }

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function ensureBackdrop(CFG) {
    if (!CFG.injectBackdrop) return null;
    var el = document.getElementById(CFG.backdropId);
    if (el) return el;
    el = document.createElement("div");
    el.id = CFG.backdropId;
    el.setAttribute("hidden", "");
    el.style.position = "fixed";
    el.style.inset = "0";
    el.style.background = "rgba(0,0,0,0.35)";
    el.style.zIndex = "1000";
    el.style.pointerEvents = "auto";
    document.body.appendChild(el);
    return el;
  }

  function isOpen(CFG) {
    return document.documentElement.classList.contains(CFG.openClassOnHtml);
  }
  function openNav(CFG, toggle, nav, backdrop) {
    document.documentElement.classList.add(CFG.openClassOnHtml);
    if (nav) nav.classList.add(CFG.openClassOnNav);
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    if (backdrop) backdrop.hidden = false;
  }
  function closeNav(CFG, toggle, nav, backdrop) {
    document.documentElement.classList.remove(CFG.openClassOnHtml);
    if (nav) nav.classList.remove(CFG.openClassOnNav);
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    if (backdrop) backdrop.hidden = true;
  }

  function bindInHeader(CFG, headerEl) {
    if (!headerEl || headerEl.nodeType !== 1) return;

    var toggles = headerEl.querySelectorAll(CFG.toggleSelector);
    if (!toggles.length) return;

    // Find nav element: prefer aria-controls
    var navEl = null;
    for (var i = 0; i < toggles.length; i++) {
      var t = toggles[i];
      if (t.getAttribute(CFG.bindOnceAttr) === "true") continue;
      var targetId = t.getAttribute("aria-controls");
      if (targetId) {
        var maybe = document.getElementById(targetId);
        if (maybe) { navEl = maybe; break; }
      }
    }
    if (!navEl) {
      navEl = headerEl.querySelector(CFG.navSelector) || document.querySelector(CFG.navSelector);
    }
    if (!navEl) return;

    // If first toggle already bound, bail (we assume module-level single binding)
    var first = toggles[0];
    if (first.getAttribute(CFG.bindOnceAttr) === "true") return;

    var backdrop = ensureBackdrop(CFG);

    function toggleHandler(ev) {
      if (ev) ev.preventDefault();
      if (isOpen(CFG)) {
        closeNav(CFG, first, navEl, backdrop);
      } else {
        openNav(CFG, first, navEl, backdrop);
      }
    }

    // Attach to all toggles (click/keyboard)
    var each = toggles.forEach ? toggles.forEach.bind(toggles) : function (fn) { Array.prototype.forEach.call(toggles, fn); };
    each(function (btn) {
      if (btn.getAttribute(CFG.bindOnceAttr) === "true") return;
      btn.addEventListener("click", toggleHandler);
      btn.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleHandler(e); }
      });
      btn.setAttribute(CFG.bindOnceAttr, "true");
      if (!btn.hasAttribute("aria-expanded")) btn.setAttribute("aria-expanded", "false");
    });

    // Close on outside click
    document.addEventListener("pointerdown", function (e) {
      if (!isOpen(CFG)) return;
      var t = e.target;
      if (t.closest(CFG.navSelector) || t.closest(CFG.toggleSelector)) return;
      closeNav(CFG, first, navEl, backdrop);
    });

    // Backdrop click to close
    if (backdrop) {
      backdrop.addEventListener("click", function () { if (isOpen(CFG)) closeNav(CFG, first, navEl, backdrop); });
    }

    // ESC to close
    document.addEventListener("keydown", function (e) {
      if (!isOpen(CFG)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeNav(CFG, first, navEl, backdrop);
      }
    });

    // Reset on desktop
    window.addEventListener("resize", debounce(function () {
      if (window.innerWidth >= CFG.desktopWidth && isOpen(CFG)) {
        closeNav(CFG, first, navEl, backdrop);
      }
    }, 150));
  }

  var _observerAttached = false;

  function init(userConfig) {
    var CFG = mergeConfig(DEFAULT_CONFIG, userConfig);

    // Bind on any present headers immediately
    var headers = document.querySelectorAll(CFG.headerSelector);
    if (headers.length) {
      for (var i = 0; i < headers.length; i++) bindInHeader(CFG, headers[i]);
    }

    // Also observe for injected/changed headers (bind once per module lifetime)
    if (!_observerAttached) {
      var obs = new MutationObserver(function () {
        var hs = document.querySelectorAll(CFG.headerSelector);
        for (var j = 0; j < hs.length; j++) bindInHeader(CFG, hs[j]);
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
      _observerAttached = true;
    }
  }

  // Public API (global namespace, no ESM required)
  root.NSM = root.NSM || {};
  root.NSM.navigation = {
    init: function (cfg) { onReady(function () { init(cfg); }); },
    configure: function (cfg) { init(cfg); } // alias
  };

})(window);
