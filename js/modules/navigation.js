/*!
 * NSMG Navigation Module
 * Solves: NSM-103, NSM-104, NSM-35
 * Usage (after header/footer injection):
 *   await import('/js/modules/navigation.js');
 *   window.NSM.navigation.init({
 *     headerSelector: "#header-container header, header.site-header, header[role='banner'], header",
 *     toggleSelector: "[data-nav-toggle], [data-dashboard-toggle], button[aria-controls], .nav-toggle, .hamburger, .menu-toggle",
 *     navSelector: "#primary-nav, .nav-menu, nav[aria-label='Primary'], nav.primary-nav, header nav, nav",
 *     submenuSelector: "ul, .submenu, [role='menu']",
 *     openClassOnHtml: "nav-open",
 *     openClassOnNav: "open",
 *     expandedClass: "is-expanded",
 *     desktopWidth: 1024,
 *     injectBackdrop: true,
 *     backdropId: "nsm-nav-backdrop",
 *     debug: false
 *   });
 */
(function(root){
  "use strict";

  var DEFAULTS = {
    headerSelector: "header",
    toggleSelector: "[data-nav-toggle], .nav-toggle",
    navSelector: "nav",
    submenuSelector: "ul, .submenu, [role='menu']",
    openClassOnHtml: "nav-open",
    openClassOnNav: "open",
    expandedClass: "is-expanded",
    desktopWidth: 1024,
    injectBackdrop: true,
    backdropId: "nsm-nav-backdrop",
    debug: false
  };

  var state = { CFG: DEFAULTS, ready:false, backdrop:null };

  function merge(a,b){ var o={},k; for(k in a) o[k]=a[k]; for(k in b||{}) o[k]=b[k]; return o; }
  function log(){ if(!state.CFG.debug) return; try{ console.log.apply(console, arguments); }catch(e){} }
  function isMobile(){ return (window.matchMedia ? window.matchMedia("(max-width:"+ (state.CFG.desktopWidth-1) +"px)").matches : (window.innerWidth < state.CFG.desktopWidth)); }

  function ensureBackdrop(){
    if(!state.CFG.injectBackdrop) return null;
    var id = state.CFG.backdropId;
    var el = document.getElementById(id);
    if (el) return el;
    el = document.createElement("div");
    el.id = id;
    el.setAttribute("aria-hidden","true");
    el.style.cssText = "position:fixed;inset:0;display:none;background:rgba(0,0,0,.35);";
    document.body.appendChild(el);
    return el;
  }

  function isOpen(){
    var cls = state.CFG.openClassOnHtml;
    return document.documentElement.classList.contains(cls) || document.body.classList.contains(cls);
  }
  function openNav(nav){
    var cls = state.CFG.openClassOnHtml;
    document.documentElement.classList.add(cls);
    document.body.classList.add(cls);
    if (nav) {
      nav.classList.add(state.CFG.openClassOnNav);
      nav.removeAttribute("hidden");
      if (nav.style.display === "none") nav.style.display = "";
    }
    if (state.backdrop){ state.backdrop.style.display = "block"; }
    lockScroll(true);
  }
  function closeNav(nav){
    var cls = state.CFG.openClassOnHtml;
    document.documentElement.classList.remove(cls);
    document.body.classList.remove(cls);
    if (nav) nav.classList.remove(state.CFG.openClassOnNav);
    if (state.backdrop){ state.backdrop.style.display = "none"; }
    lockScroll(false);
  }
  function lockScroll(lock){
    if (lock){
      if (!document.documentElement.style.getPropertyValue("--nsm-scroll-lock")){
        var scrollBarComp = window.innerWidth - document.documentElement.clientWidth;
        document.documentElement.style.setProperty("--nsm-scroll-lock", "1");
        document.documentElement.style.setProperty("--nsm-scrollbar-comp", scrollBarComp + "px");
        document.body.style.overflow = "hidden";
        document.body.style.paddingRight = scrollBarComp ? (scrollBarComp + "px") : "";
      }
    } else {
      document.documentElement.style.removeProperty("--nsm-scroll-lock");
      document.documentElement.style.removeProperty("--nsm-scrollbar-comp");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
  }

  function findNavForToggle(toggle){
    if (!toggle) return document.querySelector(state.CFG.navSelector);
    // aria-controls or data-target by id
    var id = toggle.getAttribute("aria-controls") || toggle.getAttribute("data-target") || toggle.getAttribute("data-controls");
    if (id) {
      if (id.charAt(0) === "#") id = id.slice(1);
      var byId = document.getElementById(id);
      if (byId) return byId;
    }
    // closest header's nav
    var header = toggle.closest(state.CFG.headerSelector);
    if (header) {
      var navInHeader = header.querySelector(state.CFG.navSelector);
      if (navInHeader) return navInHeader;
    }
    // fallback: first matching nav
    return document.querySelector(state.CFG.navSelector);
  }

  function handleToggleClick(e){
    var toggle = e.currentTarget;
    var nav = findNavForToggle(toggle);
    if (!nav) return;

    e.preventDefault();
    if (isOpen()) closeNav(nav); else openNav(nav);
  }

  // Submenu logic:
  //  - First tap on parent link when collapsed (mobile) -> expand, prevent navigation
  //  - Second tap while expanded -> follow link
  //  - Tapping the same parent again with submenu open and not intending to navigate -> collapse (NSM-35)
  function bindSubmenus(rootEl){
    rootEl = rootEl || document;
    var parents = rootEl.querySelectorAll(state.CFG.navSelector + " li");
    parents.forEach(function(li){
      // a parent if it has a submenu element
      var submenu = li.querySelector(":scope > " + state.CFG.submenuSelector);
      var link = li.querySelector(":scope > a[href]");
      if (!submenu || !link) return;

      // mark as expandable for a11y
      link.setAttribute("aria-haspopup","true");
      link.setAttribute("aria-expanded","false");

      // store timer for single->double tap window
      var tapTimer = null;

      function expand(){
        li.classList.add(state.CFG.expandedClass);
        link.setAttribute("aria-expanded","true");
        submenu.hidden = false;
      }
      function collapse(){
        li.classList.remove(state.CFG.expandedClass);
        link.setAttribute("aria-expanded","false");
        submenu.hidden = true;
      }
      // Start collapsed in DOM (doesn't override CSS on desktop)
      submenu.hidden = true;

      function onLinkActivate(ev){
        if (!isMobile()) return; // desktop: default behavior
        var isExpanded = li.classList.contains(state.CFG.expandedClass);

        if (!isExpanded){
          // First tap -> expand instead of navigate
          ev.preventDefault();
          expand();
          // set a short window where a second tap will navigate
          if (tapTimer) clearTimeout(tapTimer);
          tapTimer = setTimeout(function(){ tapTimer = null; }, 800);
          return;
        }

        // Already expanded:
        if (tapTimer){
          // second tap inside window -> allow navigation (do nothing)
          return;
        } else {
          // NSM-35: tapping same parent again (after window) should collapse
          ev.preventDefault();
          collapse();
        }
      }

      link.addEventListener("click", onLinkActivate);
      link.addEventListener("touchend", function(ev){
        // unify with click; on iOS sometimes only touchend fires on fast taps
        onLinkActivate(ev);
      }, {passive:false});
    });
  }

  function bindBackdrop(){
    state.backdrop = ensureBackdrop();
    if (!state.backdrop) return;
    state.backdrop.addEventListener("click", function(){
      var nav = document.querySelector(state.CFG.navSelector);
      if (isOpen() && nav) closeNav(nav);
    });
  }

  // Auto-close drawer after any link click inside nav (let the navigation happen)
  function bindAutoCloseOnLink(){
    document.addEventListener("click", function(e){
      var nav = e.target.closest(state.CFG.navSelector);
      if (!nav) return;
      var link = e.target.closest("a[href]");
      if (!link) return;
      setTimeout(function(){ if (isOpen()) closeNav(nav); }, 0);
    }, true);
  }

  // Services dashboard hamburger (NSM-104)
  // Works for elements annotated with [data-dashboard-toggle]
  function bindDashboardHamburger(){
    var toggles = document.querySelectorAll("[data-dashboard-toggle]");
    toggles.forEach(function(btn){
      btn.addEventListener("click", function(e){
        var nav = findNavForToggle(btn);
        if (!nav) return;
        e.preventDefault();
        nav.classList.toggle(state.CFG.openClassOnNav);
      });
    });
  }

  function bindGlobalToggles(){
    var toggles = document.querySelectorAll(state.CFG.toggleSelector);
    toggles.forEach(function(t){
      t.addEventListener("click", handleToggleClick);
    });
  }

  function init(cfg){
    if (state.ready) return;
    state.CFG = merge(DEFAULTS, cfg||{});
    state.backdrop = ensureBackdrop();
    bindBackdrop();
    bindGlobalToggles();
    bindDashboardHamburger();
    bindSubmenus(document);
    bindAutoCloseOnLink();
    state.ready = true;
    log("[navigation] initialized", state.CFG);
  }

  root.NSM = root.NSM || {};
  root.NSM.navigation = { init: init };

})(window);
