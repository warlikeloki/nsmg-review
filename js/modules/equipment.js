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
// Exposes window.loadEquipment() so /js/main.js can call it.
// Also auto-runs when #equipment-list exists.

(function () {
  if (window.loadEquipment) return; // idempotent

  function itemCard(e, idx) {
    const panelId = `eq-card-panel-${idx}`;
    const btnId   = `eq-card-toggle-${idx}`;

    const desc = e.description
      ? `<p class="eq-desc">${e.description}</p>`
      : '<p class="eq-desc">No description provided.</p>';

    const img = e.thumbnail_url
      ? `<img class="eq-thumb" src="${e.thumbnail_url}" alt="${e.name}" loading="lazy" decoding="async">`
      : '';

    return `
      <article class="equip-card" data-idx="${idx}">
        <div class="equip-card-hd">
          <button type="button"
                  id="${btnId}"
                  class="equip-toggle-mini"
                  aria-expanded="false"
                  aria-controls="${panelId}"
                  aria-label="Expand ${e.name}">
            +
          </button>
          <span class="equip-title" title="${e.name}">${e.name}</span>
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

  async function fetchEquipment(paramsObj = {}) {
    const params = new URLSearchParams();
    if (paramsObj.category) params.set('category', paramsObj.category);
    if (paramsObj.q)        params.set('q', paramsObj.q);
    const url = '/php/get_equipment.php' + (params.toString() ? `?${params}` : '');
    const res = await fetch(url, { cache: 'no-store' });
    return res.json();
  }

  function wireToggles(container) {
    const toggles = Array.from(container.querySelectorAll('.equip-toggle-mini'));

    function toggle(btn) {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      if (panel) panel.hidden = expanded;
      btn.textContent = expanded ? '+' : '–'; // show "–" when open
    }

    toggles.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle(btn);
      });
      // OPTIONAL: only the "+" toggles. Title click does nothing to avoid confusion.
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

  function renderGrid(listEl, items) {
    if (!Array.isArray(items) || items.length === 0) {
      listEl.innerHTML = '<p>No equipment found.</p>';
      return;
    }
    const html = items
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(itemCard)
      .join('');
    listEl.innerHTML = `<div class="equip-grid">${html}</div>`;
    wireToggles(listEl);
  }

  window.loadEquipment = async function loadEquipment() {
    const listEl = document.getElementById('equipment-list');
    if (!listEl) return;

    // Determine filter tag (e.g., "photography")
    const url = new URL(location.href);
    const urlCat  = url.searchParams.get('category') || '';
    const bodyCat = (document.body?.dataset?.categoryFilter) || '';
    const listCat = (listEl.dataset?.category) || '';
    const tag = urlCat || bodyCat || listCat || '';

    // Optional search later
    const qEl = document.getElementById('equipment-search');

    const readState = () => ({
      category: tag || undefined,
      q: (qEl && qEl.value) ? qEl.value.trim() : undefined
    });

    const apply = async () => {
      listEl.innerHTML = '<p>Loading equipment…</p>';
      try {
        const { category, q } = readState();
        const { success, data, error } = await fetchEquipment({ category, q });
        if (!success) throw new Error(error || 'Failed to load equipment');
        renderGrid(listEl, data);
      } catch (e) {
        console.error(e);
        listEl.innerHTML = '<p class="error">Unable to load equipment.</p>';
      }
    };

    await apply();

    if (qEl) {
      let t;
      qEl.addEventListener('input', () => { clearTimeout(t); t = setTimeout(apply, 300); });
    }
  };

  // Auto-run when hook exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('equipment-list')) window.loadEquipment();
    }, { once: true });
  } else if (document.getElementById('equipment-list')) {
    window.loadEquipment();
  }
})();
