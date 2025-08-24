/*! NSM-91: /js/modules/navigation.js (delegated + safe link navigation)
 * Initialize from main.js *after* header/footer injection:
 *   await import('/js/modules/navigation.js');
 *   window.NSM.navigation.init({
 *     navSelector: '.nav-menu',   // set this to your menu container
 *     openClassOnNav: 'open'      // set to the class your CSS uses to reveal it
 *     // injectBackdrop: true      // default true; set false if you don’t want an overlay
 *   });
 */
(function (root) {
  "use strict";

  var DEFAULT_CONFIG = {
    headerSelector: "#header-container header, #site-header, header.site-header, header[role='banner'], header",
    toggleSelector: "[data-nav-toggle], button[aria-controls], .nav-toggle, .hamburger, .menu-toggle",
    navSelector: "#primary-nav, .nav-menu, nav[aria-label='Primary'], nav.primary-nav, header nav, nav",
    openClassOnHtml: "nav-open",   // added to BOTH <html> and <body>
    openClassOnNav: "open",        // change to match your CSS if different
    desktopWidth: 1024,
    injectBackdrop: true,
    backdropId: "nsm-nav-backdrop",
    debug: false
  };

  function merge(a, b) { var o={},k; for (k in a) o[k]=a[k]; if (b) for (k in b) o[k]=b[k]; return o; }
  function onReady(fn){ if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",fn,{once:true});}else{fn();}}
  function log(){ if(!state.CFG.debug) return; try{console.log.apply(console,arguments);}catch(e){} }

  var state = { CFG: DEFAULT_CONFIG, bound:false, backdrop:null };

  function ensureBackdrop() {
    if (!state.CFG.injectBackdrop) return null;
    var el = document.getElementById(state.CFG.backdropId);
    if (el) return el;
    el = document.createElement("div");
    el.id = state.CFG.backdropId;
    el.setAttribute("hidden", "");
    el.style.position = "fixed";
    el.style.inset = "0";
    el.style.background = "rgba(0,0,0,0.35)";
    el.style.zIndex = "1000";              // keep below most navs; bump your nav z-index if needed
    el.style.pointerEvents = "auto";
    document.body.appendChild(el);
    return el;
  }

  function isOpen() {
    return document.documentElement.classList.contains(state.CFG.openClassOnHtml) ||
           document.body.classList.contains(state.CFG.openClassOnHtml);
  }

  var NAV_OPEN_CLASSES = null;
  function computeNavOpenClasses(){
    if (NAV_OPEN_CLASSES) return NAV_OPEN_CLASSES;
    NAV_OPEN_CLASSES = [state.CFG.openClassOnNav, "is-open", "active", "expanded"]
      .filter(Boolean).filter(function(v,i,a){return a.indexOf(v)===i;});
    return NAV_OPEN_CLASSES;
  }
  function addNavOpenClasses(nav){
    var cls = computeNavOpenClasses();
    for (var i=0;i<cls.length;i++) nav.classList.add(cls[i]);
    if (nav.hasAttribute("hidden")) nav.removeAttribute("hidden");
    if (nav.style && nav.style.display === "none") nav.style.display = "";
  }
  function removeNavOpenClasses(nav){
    var cls = computeNavOpenClasses();
    for (var i=0;i<cls.length;i++) nav.classList.remove(cls[i]);
  }

  function openNav(toggle, nav){
    document.documentElement.classList.add(state.CFG.openClassOnHtml);
    document.body.classList.add(state.CFG.openClassOnHtml);
    addNavOpenClasses(nav);
    if (toggle) toggle.setAttribute("aria-expanded","true");
    if (state.backdrop) state.backdrop.hidden = false;
    log("[NSM-91] openNav");
  }
  function closeNav(toggle, nav){
    document.documentElement.classList.remove(state.CFG.openClassOnHtml);
    document.body.classList.remove(state.CFG.openClassOnHtml);
    removeNavOpenClasses(nav);
    if (toggle) toggle.setAttribute("aria-expanded","false");
    if (state.backdrop) state.backdrop.hidden = true;
    log("[NSM-91] closeNav");
  }

  function closestInHeader(el, sel){
    var header = el.closest(state.CFG.headerSelector);
    return header ? header.querySelector(sel) : null;
  }
  function findNavForToggle(toggle){
    if (!toggle) return null;
    var id = toggle.getAttribute("aria-controls");
    if (id) {
      var t = document.getElementById(id);
      if (t) return t;
    }
    return closestInHeader(toggle, state.CFG.navSelector) || document.querySelector(state.CFG.navSelector);
  }

  function toggleHandler(e){
    if (e.type === "click" && e.button !== 0) return;
    var toggle = e.target.closest(state.CFG.toggleSelector);
    if (!toggle) return;
    var header = toggle.closest(state.CFG.headerSelector);
    if (!header) return;

    var nav = findNavForToggle(toggle);
    if (!nav) { log("[NSM-91] no nav for toggle"); return; }

    e.preventDefault();
    if (isOpen()) closeNav(toggle, nav); else openNav(toggle, nav);
  }

  // Only close on **backdrop click** (no global pointerdown)
  function bindBackdropClose(){
    state.backdrop = ensureBackdrop();
    if (!state.backdrop) return;
    state.backdrop.addEventListener("click", function(){
      var nav = document.querySelector(state.CFG.navSelector);
      if (isOpen() && nav) closeNav(null, nav);
    });
  }

  // Allow link clicks inside the menu to navigate, then close
  function bindNavLinkAutoClose(){
    document.addEventListener("click", function(e){
      var navEl = e.target.closest(state.CFG.navSelector);
      if (!navEl) return;
      var link = e.target.closest("a[href]");
      if (!link) return;
      // Let navigation proceed; close drawer after the click is processed
      setTimeout(function(){ if (isOpen()) closeNav(null, navEl); }, 0);
    }, true); // capture so we schedule close early, but do not prevent default
  }

  function escHandler(e){
    if (!isOpen()) return;
    if (e.key === "Escape") {
      e.preventDefault();
      var nav = document.querySelector(state.CFG.navSelector);
      if (nav) closeNav(null, nav);
    }
  }

  function resizeHandler(){
    if (window.innerWidth >= state.CFG.desktopWidth && isOpen()) {
      var nav = document.querySelector(state.CFG.navSelector);
      if (nav) closeNav(null, nav);
    }
  }

  function bind(){
    if (state.bound) return;
    state.bound = true;

    bindBackdropClose();
    bindNavLinkAutoClose();

    // Delegated toggle handler
    document.addEventListener("click", toggleHandler);
    document.addEventListener("keydown", escHandler);
    window.addEventListener("resize", resizeHandler);

    log("[NSM-91] navigation bound", state.CFG);
  }

  function init(userConfig){
    state.CFG = merge(DEFAULT_CONFIG, userConfig || {});
    onReady(function () {
      bind();
      // Initial debug info
      log("[NSM-91] ready", {
        header: !!document.querySelector(state.CFG.headerSelector),
        toggle: !!document.querySelector(state.CFG.headerSelector + " " + state.CFG.toggleSelector + ", " + state.CFG.toggleSelector),
        nav: !!document.querySelector(state.CFG.navSelector)
      });
    });
  }

  root.NSM = root.NSM || {};
  root.NSM.navigation = { init: init };

})(window);
