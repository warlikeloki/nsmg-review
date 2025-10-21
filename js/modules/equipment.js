// /js/modules/equipment.js
// Grid of per-item collapsible cards with a small "+" in the upper-left.
// Each card is collapsed by default; expanded panel shows DESCRIPTION and (optional) IMAGE.
// Items are filtered by membership in CSV 'category' (e.g., "photography, videography").
//
// Filter source (priority):
//   1) URL: ?category=photography
//   2) <body data-category-filter="photography">
//   3) <section id="equipment-list" data-category="photography">
//
// Exposes:
//   - window.loadEquipment()                 -> auto mode for #equipment-list (backward-compatible)
//   - window.NSM.equipment.renderInto(elOrSel, { category, q }) -> render into any container (e.g., main pane)
//
// Also auto-runs when #equipment-list exists.

(function () {
  // Prevent double registration
  if (window.NSM?.equipment?.__ready || window.loadEquipment) return;

  // ---------------- Utilities ----------------
  const NSM = (window.NSM = window.NSM || {});
  NSM.equipment = NSM.equipment || {};

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function byName(a, b) {
    return String(a?.name ?? '').localeCompare(String(b?.name ?? ''), undefined, { sensitivity: 'base' });
  }

  function normArray(payload) {
    // Accept: raw array | {ok,data} | {success,data}
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') {
      if (Array.isArray(payload.data)) return payload.data;
      // Sometimes PHP emits strings "ok"/"success"—ignore; just try to coerce
    }
    return [];
  }

  async function fetchEquipment(paramsObj = {}) {
    const params = new URLSearchParams();
    if (paramsObj.category) params.set('category', paramsObj.category);
    if (paramsObj.q)        params.set('q', paramsObj.q);

    const url = '/php/get_equipment.php' + (params.toString() ? `?${params}` : '');
    const res = await fetch(url, { cache: 'no-store', headers: { 'Accept': 'application/json' } });

    // Try to parse JSON; if parsing fails, surface a friendly error
    let json;
    try {
      json = await res.json();
    } catch {
      throw new Error(`Invalid JSON from ${url} (HTTP ${res.status})`);
    }
    if (!res.ok) {
      // Normalize common error shapes
      const msg = json?.error || json?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return normArray(json);
  }

  // -------------- Rendering ------------------
  function itemCard(e, idx) {
    const panelId = `eq-card-panel-${idx}`;
    const btnId   = `eq-card-toggle-${idx}`;
    const name    = escapeHtml(e.name || 'Unnamed');

    const desc = e.description
      ? `<p class="eq-desc">${escapeHtml(e.description)}</p>`
      : '<p class="eq-desc">No description provided.</p>';

    const img = e.thumbnail_url
      ? `<img class="eq-thumb" src="${escapeHtml(e.thumbnail_url)}" alt="${name}" loading="lazy" decoding="async">`
      : '';

    const model = e.model ? ` <span class="equip-item__model">(${escapeHtml(e.model)})</span>` : '';

    return `
      <article class="equip-card" data-idx="${idx}">
        <div class="equip-card-hd">
          <button type="button"
                  id="${btnId}"
                  class="equip-toggle-mini"
                  aria-expanded="false"
                  aria-controls="${panelId}"
                  aria-label="Expand ${name}">
            +
          </button>
          <span class="equip-title" title="${name}">${name}${model}</span>
        </div>
        <div id="${panelId}" class="equip-panel" role="region" aria-labelledby="${btnId}" hidden>
          <div class="equip-panel-inner">
            ${img}
            ${desc}
          </div>
        </div>
      </article>
    `;
  }

  function wireToggles(container) {
    const toggles = Array.from(container.querySelectorAll('.equip-toggle-mini'));

    function toggle(btn) {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      if (panel) panel.hidden = expanded;
      btn.textContent = expanded ? '+' : '–'; // “–” when open
    }

    toggles.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle(btn);
      });
      // Simple roving focus
      btn.addEventListener('keydown', (e) => {
        if (!['ArrowUp','ArrowDown','Home','End'].includes(e.key)) return;
        const i = toggles.indexOf(btn);
        let next = i;
        if (e.key === 'ArrowUp')   next = (i - 1 + toggles.length) % toggles.length;
        if (e.key === 'ArrowDown') next = (i + 1) % toggles.length;
        if (e.key === 'Home')      next = 0;
        if (e.key === 'End')       next = toggles.length - 1;
        toggles[next]?.focus();
        e.preventDefault();
      });
    });
  }

  function renderGrid(listEl, items, opts = {}) {
    const categoryLabel = opts.category ? ` — ${escapeHtml(opts.category)}` : '';
    if (!Array.isArray(items) || items.length === 0) {
      listEl.innerHTML = `
        <div class="equipment-empty">
          <h3 class="equipment-title">Equipment${categoryLabel}</h3>
          <p>No equipment found.</p>
        </div>`;
      return;
    }

    const html = items
      .slice()
      .sort(byName)
      .map(itemCard)
      .join('');

    listEl.innerHTML = `
      <div class="equipment-wrapper">
        <h3 class="equipment-title">Equipment${categoryLabel}</h3>
        <div class="equip-grid">${html}</div>
      </div>`;
    wireToggles(listEl);
  }

  // -------------- Public API ----------------
  async function renderInto(elOrSel, { category, q } = {}) {
    const listEl = typeof elOrSel === 'string' ? document.querySelector(elOrSel) : elOrSel;
    if (!listEl) return;

    listEl.innerHTML = '<p>Loading equipment…</p>';
    try {
      const data = await fetchEquipment({ category, q });  // ← Does it pass category here?
      renderGrid(listEl, data, { category });
    } catch (e) {
      console.error('[equipment] load error:', e);
      listEl.innerHTML = `<p class="error">Unable to load equipment.</p>`;
    }
  }

  // Backward-compatible auto loader for pages with #equipment-list
  async function loadEquipment() {
    const listEl = document.getElementById('equipment-list');
    if (!listEl) return;

    // Determine filter tag (e.g., "photography")
    const url = new URL(location.href);
    const urlCat  = url.searchParams.get('category') || '';
    const bodyCat = (document.body?.dataset?.categoryFilter) || '';
    const listCat = (listEl.dataset?.category) || '';
    const tag = urlCat || bodyCat || listCat || '';

    // Optional search box
    const qEl = document.getElementById('equipment-search');

    const readState = () => ({
      category: tag || undefined,
      q: (qEl && qEl.value) ? qEl.value.trim() : undefined
    });

    const apply = async () => {
      listEl.innerHTML = '<p>Loading equipment…</p>';
      try {
        const state = readState();
        const data = await fetchEquipment(state);
        renderGrid(listEl, data, { category: state.category });
      } catch (e) {
        console.error('[equipment] load error:', e);
        listEl.innerHTML = '<p class="error">Unable to load equipment.</p>';
      }
    };

    await apply();

    if (qEl) {
      let t;
      qEl.addEventListener('input', () => { clearTimeout(t); t = setTimeout(apply, 300); });
    }
  }

  // Expose
  NSM.equipment.renderInto = renderInto;
  NSM.equipment.__ready = true;
  window.loadEquipment = loadEquipment; // legacy hook used by /js/main.js

  // Auto-run when hook exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('equipment-list')) loadEquipment();
    }, { once: true });
  } else if (document.getElementById('equipment-list')) {
    loadEquipment();
  }
})();
