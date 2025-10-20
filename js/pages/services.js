/* /js/pages/services.js
   Services dashboard loader — fragment fetch, script execution, BASE fix,
   and equipment rendering in the main content area.

   Key behaviors:
   - Loads service fragments (photography, videography, editing, etc.)
   - Executes scripts in those fragments
   - Dynamically imports /js/modules/equipment.js and calls NSM.equipment.renderInto()
   - Clears equipment on Pricing or Request Form
*/

(() => {
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch {}

  const MAIN_ID   = "services-content";
  const DRAWER_ID = "services-drawer";
  const TOGGLE_ID = "services-toggle";

  const SERVICE_CANDIDATES = {
    photography:      ["services/photography.html", "./services/photography.html"],
    videography:      ["services/videography.html", "./services/videography.html"],
    editing:          ["services/editing.html", "./services/editing.html"],
    "other-services": ["services/other-services.html", "./services/other-services.html"],
    pricing: [
      "pricing.html?embed=1", "./pricing.html?embed=1",
      "pricing-dashboard.html", "./pricing-dashboard.html",
      "services/pricing.html?embed=1", "./services/pricing.html?embed=1",
      "services/pricing.html", "./services/pricing.html",
      "/pricing.html?embed=1", "/pricing-dashboard.html"
    ],
    "request-form": ["services/request-form.html", "./services/request-form.html", "services/request.html", "./services/request.html"]
  };

  const SERVICE_FRAGMENT_SELECTORS = {
    "request-form": ["#request-form", "form[action*='request']", "[data-fragment='request-form']", "main", "[role='main']", "section[id*='request']"],
    pricing: ["#pricing-section", "#pricing-main", "[data-fragment='pricing']", "main", "[role='main']"],
    photography: ["[data-fragment='service']", "main", "[role='main']", "article", "section"],
    videography: ["[data-fragment='service']", "main", "[role='main']", "article", "section"],
    editing: ["[data-fragment='service']", "main", "[role='main']", "article", "section"],
    "other-services": ["[data-fragment='service']", "main", "[role='main']", "article", "section"]
  };

  const SERVICE_TO_EQUIPMENT = {
    photography: "photography",
    videography: "videography",
    editing: "editing",
    "other-services": "other"
  };

  const main = document.getElementById(MAIN_ID);
  if (!main) return;

  let mount = main.querySelector("#service-mount");
  if (!mount) {
    mount = document.createElement("div");
    mount.id = "service-mount";
    const placeholder = document.getElementById("service-placeholder");
    if (placeholder && placeholder.parentNode === main) {
      placeholder.insertAdjacentElement("afterend", mount);
    } else {
      main.appendChild(mount);
    }
  }

  const EQUIP_ID = "service-equipment-main";
  function getOrCreateEquipAnchor() {
    let anchor = mount.querySelector("#" + EQUIP_ID);
    if (!anchor) {
      anchor = document.createElement("section");
      anchor.id = EQUIP_ID;
      anchor.className = "equipment-panel equipment-panel--main";
      mount.appendChild(anchor);
    }
    return anchor;
  }
  function clearEquipment() {
    const anchor = mount.querySelector("#" + EQUIP_ID);
    if (anchor) anchor.remove();
  }

  function closeDrawerIfOpen() {
    const drawer = document.getElementById(DRAWER_ID);
    const toggle = document.getElementById(TOGGLE_ID);
    if (drawer && drawer.classList.contains("open")) {
      drawer.classList.remove("open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }
  }

  async function fetchFirstOk(candidates) {
    const errors = [];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { credentials: "same-origin", cache: "no-cache" });
        if (res.ok) {
          const text = await res.text();
          console.info(`[services] Loaded fragment from: ${url}`);
          return { url: new URL(url, location.href).href, text };
        }
        errors.push({ url, status: res.status });
      } catch (e) {
        errors.push({ url, status: "network", err: String(e) });
      }
    }
    console.error("[services] All candidates failed:", errors);
    throw new Error("All candidate URLs failed to load.");
  }

  function extractFragmentAndScripts(html, serviceKey, fetchedUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const baseFromDoc = doc.querySelector("base[href]");
    const fetched = new URL(fetchedUrl);
    const defaultBase = fetched.origin + fetched.pathname.replace(/[^/]+$/, "");
    const effectiveBase = baseFromDoc ? new URL(baseFromDoc.getAttribute("href"), fetched).href : defaultBase;

    const serviceSelectors = SERVICE_FRAGMENT_SELECTORS[serviceKey] || [];
    const generalSelectors = ["[data-fragment='content']", "main", "[role='main']", "#content", "#page", "article", "section"];
    const candidates = [...serviceSelectors, ...generalSelectors];

    let node = null;
    for (const sel of candidates) {
      const found = doc.querySelector(sel);
      if (found) { node = found.cloneNode(true); break; }
    }
    if (!node) node = doc.body.cloneNode(true);

    const rawScripts = Array.from(node.querySelectorAll("script"));
    node.querySelectorAll("#header-container, #site-header, header, #footer-container, footer, .sidebar").forEach(el => el.remove());
    node.querySelectorAll("script").forEach(el => el.remove());

    const scripts = rawScripts.map(s => {
      const type = (s.getAttribute("type") || "").trim();
      const src  = s.getAttribute("src");
      const asyncAttr = s.hasAttribute("async");
      const deferAttr = s.hasAttribute("defer");
      const nomodule = s.hasAttribute("nomodule");
      const text = src ? "" : (s.textContent || "");
      let resolvedSrc = "";
      if (src) {
        try { resolvedSrc = new URL(src, effectiveBase).href; } catch { resolvedSrc = src; }
      }
      return { type, src: resolvedSrc, async: asyncAttr, defer: deferAttr, nomodule, text };
    });

    return { html: node.innerHTML.trim(), scripts, baseHref: effectiveBase };
  }

  function setTempBase(href) {
    const head = document.head || document.getElementsByTagName("head")[0];
    if (!head) return null;
    const existing = document.querySelector("base[data-services-temp-base]");
    if (existing) existing.remove();
    const el = document.createElement("base");
    el.setAttribute("href", href);
    el.setAttribute("data-services-temp-base", "true");
    head.insertBefore(el, head.firstChild);
    return el;
  }
  function clearTempBase() {
    const el = document.querySelector("base[data-services-temp-base]");
    if (el) el.remove();
  }

  async function executeScriptsSequentially(scripts) {
    for (const s of scripts) {
      if (!s.src && !s.text) continue;
      await new Promise((resolve) => {
        const el = document.createElement("script");
        if (s.type) el.type = s.type;
        if (s.nomodule) el.noModule = true;
        if (s.async) el.async = true;
        if (s.defer) el.defer = true;

        if (s.src) {
          el.src = s.src;
          el.onload = () => resolve();
          el.onerror = () => { console.error("[services] Failed script:", s.src); resolve(); };
          document.head.appendChild(el);
        } else {
          el.textContent = s.text;
          document.body.appendChild(el);
          resolve();
        }
      });
    }
  }

  function interceptLocalAnchors(scope = document) {
    scope.querySelectorAll("a[href^='#']").forEach(a => {
      a.addEventListener("click", (e) => {
        if (a.dataset.allowHash === "true") return;
        e.preventDefault();
        e.stopPropagation();
      }, { passive: false });
    });
  }

  async function renderEquipment(category) {
    const anchor = getOrCreateEquipAnchor();
    anchor.innerHTML = `<p>Loading equipment…</p>`;

    try {
      const mod = await import("/js/modules/equipment.js");
      if (mod?.NSM?.equipment?.renderInto) {
        await mod.NSM.equipment.renderInto(anchor, { category });
        return;
      }
      if (window.NSM?.equipment?.renderInto) {
        await window.NSM.equipment.renderInto(anchor, { category });
        return;
      }
    } catch (err) {
      console.warn("[services] equipment module import failed, using fallback.", err);
    }

    // fallback if import fails
    try {
      const res = await fetch(`/php/get_equipment.php?category=${encodeURIComponent(category)}`, { cache: "no-cache" });
      const payload = await res.json();
      const rows = Array.isArray(payload) ? payload : (payload?.data || []);
      if (!rows.length) {
        anchor.innerHTML = `<p>No equipment found for ${category}.</p>`;
        return;
      }
      anchor.innerHTML = `<h2>Equipment — ${category}</h2><ul>` +
        rows.map(r => `<li>${r.name || "Unnamed"}</li>`).join("") +
        `</ul>`;
    } catch (err2) {
      anchor.innerHTML = `<p class="error">Could not load equipment.</p>`;
      console.error("[services] fallback equipment failed:", err2);
    }
  }

  async function loadService(key) {
    const candidates = SERVICE_CANDIDATES[key];
    if (!candidates || !candidates.length) return;

    main.setAttribute("data-loading", "true");

    try {
      const { url, text } = await fetchFirstOk(candidates);
      const { html, scripts, baseHref } = extractFragmentAndScripts(text, key, url);

      mount.innerHTML = html || `<div class="notice error"><p>Section loaded but no content matched.</p></div>`;

      setTempBase(baseHref);
      try {
        await executeScriptsSequentially(scripts);
      } finally {
        clearTempBase();
      }

      const focusTarget = mount.querySelector("h1, h2, [role='heading'], form, section, article, [tabindex]") || mount;
      if (focusTarget) {
        const had = focusTarget.hasAttribute("tabindex");
        if (!had) focusTarget.setAttribute("tabindex", "-1");
        try { focusTarget.focus({ preventScroll: true }); } catch {}
        if (!had) focusTarget.removeAttribute("tabindex");
      }

      interceptLocalAnchors(mount);

      // Equipment behavior
      if (key === "pricing" || key === "request-form") {
        clearEquipment();
      } else {
        const category = SERVICE_TO_EQUIPMENT[key];
        if (category) await renderEquipment(category);
      }

      closeDrawerIfOpen();
    } catch (err) {
      console.error(err);
      mount.innerHTML = `<div class="notice error"><p>Sorry, we couldn’t load that section right now.</p></div>`;
      clearEquipment();
    } finally {
      main.removeAttribute("data-loading");
    }
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".admin-button");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const key = btn.getAttribute("data-service");
    if (!key) return;
    loadService(key);
  }, { passive: false });

  interceptLocalAnchors(document);

  // Simple helpers
  function capitalize(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, ch => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[ch])); }
})();
