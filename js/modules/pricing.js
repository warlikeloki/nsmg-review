// /js/modules/pricing.js
// NSMG Pricing renderer — SQL-table style:
// Renders two tables with 3 columns:
//   Packages:  [Package | Description | Price]
//   A la carte:[Service | Description | Price]
//
// Data sources (in order):
//   1) /php/get_pricing.php  (5s timeout)
//   2) /json/pricing.json
//   3) /json/pricing.fallback.json (optional)
//
// Field tolerance:
// - Packages use "Package" (or name/title/package), "Description"/description/desc, "Price"/price
// - Services use "Service" (or name/title/service), "Description"/description/desc, "Price"/price
// - Hidden flags respected: hidden:true | enabled:false | visible:false | status:hidden|disabled
// - Preview hidden rows with ?previewHidden=1
//
// DOM targets (quietly no-op if missing):
//   #packages-body      -> table (if any packages)
//   #ala-carte-body     -> table (if any services)
//   #pricing-note or .pricing-note -> optional text note

export async function loadPricing() {
  var elPackages = document.getElementById("packages-body");
  var elAlaCarte = document.getElementById("ala-carte-body");
  if (!elPackages && !elAlaCarte) return;

  var previewHidden = location.search.indexOf("previewHidden=1") >= 0;

  var sources = [
    "/php/get_pricing.php",
    "/json/pricing.json",
    "/json/pricing.fallback.json"
  ];
  var opts = { credentials: "same-origin", cache: "no-store" };

  var data = null;
  for (var i = 0; i < sources.length; i++) {
    try {
      var res = await fetchWithTimeout(sources[i], opts, 5000);
      if (!res || !res.ok) continue;
      var json = await safeJson(res);
      if (!json || typeof json !== "object") continue;
      // Accept even if one of the two lists exists
      var pkgs = collectArray(json, ["packages", "Packages", "bundles"]);
      var svcs = collectArray(json, ["services", "Services", "alaCarte", "items"]);
      if ((pkgs && pkgs.length) || (svcs && svcs.length)) {
        data = json;
        break;
      }
    } catch (e) { /* next */ }
  }
  if (!data) data = {};

  var currency = (data && data.currency) ? String(data.currency) : "USD";
  var note = data && data.note ? String(data.note) : "";

  var rawPackages = collectArray(data, ["packages", "Packages", "bundles"]);
  var rawServices = collectArray(data, ["services", "Services", "alaCarte", "items"]);

  // Normalize records to { kind, name, description, price, hidden }
  var packages = normalizeList(rawPackages, "package");
  var services = normalizeList(rawServices, "service");

  // Filter by hidden flags (unless previewHidden)
  if (!previewHidden) {
    packages = packages.filter(function (x) { return !x.hidden; });
    services = services.filter(function (x) { return !x.hidden; });
  }

  if (elPackages) {
    elPackages.innerHTML = renderTable(
      "Package",
      packages,
      currency,
      previewHidden
    );
  }
  if (elAlaCarte) {
    elAlaCarte.innerHTML = renderTable(
      "Service",
      services,
      currency,
      previewHidden
    );
  }

  var noteSlot = document.getElementById("pricing-note") || document.querySelector(".pricing-note");
  if (noteSlot && note) noteSlot.textContent = note;
}

/* ---------------- data helpers ---------------- */

function collectArray(obj, keys) {
  var out = [];
  if (!obj || typeof obj !== "object") return out;
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
    var v = obj[k];
    if (Array.isArray(v)) {
      out = out.concat(v);
    } else if (v && typeof v === "object") {
      // allow grouped objects-of-arrays
      for (var sub in v) {
        if (!Object.prototype.hasOwnProperty.call(v, sub)) continue;
        var maybeArr = v[sub];
        if (Array.isArray(maybeArr)) out = out.concat(maybeArr);
      }
    }
  }
  return out;
}

function normalizeList(arr, kind) {
  if (!Array.isArray(arr)) return [];
  var out = [];
  for (var i = 0; i < arr.length; i++) {
    var it = arr[i] || {};
    var name = extractName(it, kind);
    var description = extractDescription(it);
    var price = extractPrice(it);
    var hidden = isHidden(it);
    out.push({ kind: kind, name: name, description: description, price: price, hidden: hidden });
  }
  return out;
}

function extractName(it, kind) {
  // Prefer exact SQL-like column first
  if (kind === "package") {
    return firstString(it, ["Package", "package", "name", "title"]) || "Package";
  } else {
    return firstString(it, ["Service", "service", "name", "title"]) || "Service";
  }
}

function extractDescription(it) {
  var desc = firstString(it, ["Description", "description", "desc", "text"]);
  if (desc) return desc;
  // If no description, try to stringify "features"
  var f = it.features;
  if (Array.isArray(f) && f.length) return f.join(" • ");
  return "";
}

function extractPrice(it) {
  // Allow number or formatted string in any of these fields
  var v = it.hasOwnProperty("Price") ? it.Price :
          it.hasOwnProperty("price") ? it.price :
          it.hasOwnProperty("cost")  ? it.cost  : null;
  // Keep unit (e.g., "/hour") when present
  var unit = firstString(it, ["unit", "Unit"]);
  return unit ? { value: v, unit: unit } : { value: v };
}

function firstString(obj, keys) {
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null && obj[k] !== "") {
      return String(obj[k]);
    }
  }
  return "";
}

function isHidden(item) {
  if (!item || typeof item !== "object") return false;
  if (item.hidden === true) return true;
  if (item.enabled === false) return true;
  if (item.visible === false) return true;
  var st = (item.status ? String(item.status) : "").toLowerCase();
  if (st === "hidden" || st === "disabled") return true;
  return false;
}

/* ---------------- fetch helpers ---------------- */

function safeJson(res) {
  return res.text().then(function (t) {
    try { return JSON.parse(t); } catch (e) { return null; }
  });
}

function fetchWithTimeout(url, options, ms) {
  var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  var id;
  if (controller) {
    options = options || {};
    options.signal = controller.signal;
    id = setTimeout(function () { try { controller.abort(); } catch (e) {} }, ms || 5000);
  }
  return fetch(url, options).finally(function () {
    if (id) clearTimeout(id);
  });
}

/* ---------------- rendering ---------------- */

function escapeHtml(s) {
  s = String(s == null ? "" : s);
  return s.replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
}

function formatPrice(price, currency) {
  var v = price && typeof price === "object" ? price.value : price;
  var unit = price && typeof price === "object" ? price.unit : "";
  var out = "";
  if (v == null || v === "") {
    out = "";
  } else if (typeof v === "number" || isFinite(Number(v))) {
    var n = typeof v === "number" ? v : Number(v);
    try {
      out = new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(n);
    } catch (e) {
      out = "$" + n.toFixed(2);
    }
  } else {
    // Already formatted string
    out = String(v);
  }
  if (unit) out += " " + unit;
  return out;
}

function renderTable(firstColHeader, rows, currency, previewHidden) {
  if (!rows || !rows.length) {
    return '<p class="pricing-empty" role="note">No items available at this time.</p>';
  }

  var thead = '' +
    "<thead>" +
      "<tr>" +
        "<th scope=\"col\">" + escapeHtml(firstColHeader) + "</th>" +
        "<th scope=\"col\">Description</th>" +
        "<th scope=\"col\" style=\"text-align:right\">Price</th>" +
      "</tr>" +
    "</thead>";

  var tbody = "<tbody>";
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var priceText = formatPrice(r.price, currency);
    var cls = r.hidden ? " class=\"is-hidden\"" : "";
    var badge = (r.hidden && previewHidden) ? ' <span class="badge-hidden">Hidden</span>' : "";
    tbody += "" +
      "<tr" + cls + ">" +
        "<td>" + escapeHtml(r.name) + badge + "</td>" +
        "<td>" + escapeHtml(r.description) + "</td>" +
        "<td style=\"text-align:right\">" + escapeHtml(priceText) + "</td>" +
      "</tr>";
  }
  tbody += "</tbody>";

  return "<table class=\"pricing-table\">" + thead + tbody + "</table>";
}
