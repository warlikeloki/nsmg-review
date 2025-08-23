// /js/modules/equipment.js
// Accordion list of equipment filtered by membership in the CSV `category` column.
// Shows NAME ONLY in each row (no condition/category lines).
// Grouped by gear type stored in `types` (camera, lens, lighting, etc.).
//
// How it decides which tag to filter by (in priority order):
//   1) URL ...?category=photography
//   2) <body data-category-filter="photography">
//   3) <section id="equipment-list" data-category="photography">
//
// Exposes window.loadEquipment() so /js/main.js can call it. Also auto-runs once.

(function () {
  if (window.loadEquipment) return; // idempotent

  // --- utils ---
  const toTitle = (s) => (s || 'Other')
    .toString()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const groupBy = (arr, keyFn) => {
    const map = new Map();
    for (const item of arr) {
      const k = keyFn(item);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(item);
    }
    return map;
  };

  async function fetchEquipment(paramsObj = {}) {
    const params = new URLSearchParams();
    if (paramsObj.category) params.set('category', paramsObj.category);
    if (paramsObj.q)        params.set('q', paramsObj.q);
    const url = '/php/get_equipment.php' + (params.toString() ? `?${params}` : '');
    const res = await fetch(url, { cache: 'no-store' });
    return res.json();
  }

  function renderAccordion(listEl, items, expandFirst = true) {
    // Group by gear class from `types`
    const groups = groupBy(items, (e) => (e.types && e.types.trim()) ? e.types.trim() : 'Other');
    // Sort groups by label
    const labels = [...groups.keys()].sort((a, b) => toTitle(a).localeCompare(toTitle(b)));

    const parts = [];
    labels.forEach((label, idx) => {
      const panelId = `eq-panel-${idx}`;
      const btnId   = `eq-toggle-${idx}`;
      const rows = groups.get(label)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(e => `<li class="eq-item">${e.name}</li>`)
        .join('');

      parts.push(`
        <section class="equip-accordion-section">
          <h3 class="equip-accordion-header">
            <button id="${btnId}" class="accordion-toggle" aria-expanded="${expandFirst && idx === 0 ? 'true' : 'false'}" aria-controls="${panelId}">
              ${toTitle(label)} <span class="count">(${groups.get(label).length})</span>
            </button>
          </h3>
          <div id="${panelId}" class="equip-accordion-panel" role="region" aria-labelledby="${btnId}" ${expandFirst && idx === 0 ? '' : 'hidden'}>
            <ul class="equip-list">
              ${rows}
            </ul>
          </div>
        </section>
      `);
    });

    listEl.innerHTML = `<div class="equip-accordion">${parts.join('')}</div>`;

    // Wire up toggles (accessible)
    listEl.querySelectorAll('.accordion-toggle').forEach(btn => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        if (panel) panel.hidden = expanded;
      });
      // Optional keyboard helpers
      btn.addEventListener('keydown', (e) => {
        if (!['ArrowUp','ArrowDown','Home','End'].includes(e.key)) return;
        const all = Array.from(listEl.querySelectorAll('.accordion-toggle'));
        const i = all.indexOf(btn);
        let next = i;
        if (e.key === 'ArrowUp') next = (i - 1 + all.length) % all.length;
        if (e.key === 'ArrowDown') next = (i + 1) % all.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = all.length - 1;
        all[next]?.focus();
        e.preventDefault();
      });
    });
  }

  window.loadEquipment = async function loadEquipment() {
    const listEl = document.getElementById('equipment-list');
    if (!listEl) return;

    // Determine which tag to filter by (e.g., 'photography')
    const url = new URL(location.href);
    const urlCat  = url.searchParams.get('category') || '';
    const bodyCat = (document.body && document.body.dataset && document.body.dataset.categoryFilter) || '';
    const listCat = (listEl.dataset && listEl.dataset.category) || '';
    const tag = urlCat || bodyCat || listCat || '';

    // Optional search input (if present)
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
        // FLAT accordion grouped by gear type; NAME ONLY in rows
        renderAccordion(listEl, Array.isArray(data) ? data : []);
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

  // Auto-run when the hook exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('equipment-list')) window.loadEquipment();
    }, { once: true });
  } else if (document.getElementById('equipment-list')) {
    window.loadEquipment();
  }
})();
