// /js/modules/equipment.js
// Flat rendering (no grouping). On filtered pages (e.g., Photography),
// show only that single tag, even if the row has multiple tags in the CSV.
//
// How it finds the filter:
//   - URL query: ?category=photography   OR
//   - <body data-category-filter="photography"> OR
//   - <section id="equipment-list" data-category="photography">
//
// Exposes window.loadEquipment() so /js/main.js can call it. Also auto-runs.

(function () {
  if (window.loadEquipment) return; // idempotent

  const toArrayFromCsv = (csv) =>
    (csv || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

  const badge = (t) => `<span class="type-badge">${t}</span>`;
  const fmtCond = (s) => s ? String(s).replace(/\b\w/g, c => c.toUpperCase()) : '';

  function card(e, pageTag) {
    // If pageTag (e.g., 'photography') is present, only show that single tag.
    // Otherwise, show all tags from the CSV.
    const tags = pageTag ? [pageTag] : toArrayFromCsv(e.category);
    const tagsHtml = tags.length ? `<div class="eq-types">${tags.map(badge).join(' ')}</div>` : '';

    return `
    <article class="equipment-card">
      ${e.thumbnail_url ? `<img src="${e.thumbnail_url}" alt="${e.name}" loading="lazy" decoding="async">` : ''}
      <div class="equipment-meta">
        <h3>${e.name}</h3>
        ${tagsHtml}
        ${e.manufacturer || e.model_number ? `<p class="eq-line"><strong>Model:</strong> ${[e.manufacturer,e.model_number].filter(Boolean).join(' ')}</p>` : ''}
        ${e.condition ? `<p class="eq-line"><strong>Condition:</strong> ${fmtCond(e.condition)}</p>` : ''}
        ${e.description ? `<p class="eq-desc">${e.description}</p>` : ''}
      </div>
    </article>
    `.trim();
  }

  async function fetchEquipment(paramsObj = {}) {
    const params = new URLSearchParams();
    if (paramsObj.category) params.set('category', paramsObj.category);
    if (paramsObj.q)        params.set('q', paramsObj.q);
    const url = '/php/get_equipment.php' + (params.toString() ? `?${params}` : '');
    const res = await fetch(url, { cache: 'no-store' });
    return res.json();
  }

  function render(listEl, items, pageTag) {
    if (!Array.isArray(items) || items.length === 0) {
      listEl.innerHTML = '<p>No equipment found.</p>';
      return;
    }
    // FLAT LIST, NO HEADINGS
    listEl.innerHTML = items.map(e => card(e, pageTag)).join('');
  }

  window.loadEquipment = async function loadEquipment() {
    const listEl = document.getElementById('equipment-list');
    if (!listEl) return;

    // Read the page's category tag
    const url = new URL(location.href);
    const urlCat = url.searchParams.get('category') || '';
    const bodyCat = document.body?.dataset?.categoryFilter || '';
    const listCat = listEl?.dataset?.category || '';
    const pageTag = urlCat || bodyCat || listCat || '';

    // Optional future controls
    const qEl = document.getElementById('equipment-search');
    const readState = () => ({
      category: pageTag || undefined,
      q: qEl && qEl.value ? qEl.value.trim() : undefined
    });

    const apply = async () => {
      listEl.innerHTML = '<p>Loading equipment…</p>';
      try {
        const { category, q } = readState();
        const { success, data, error } = await fetchEquipment({ category, q });
        if (!success) throw new Error(error || 'Failed to load equipment');
        render(listEl, data, pageTag);
      } catch (err) {
        console.error(err);
        listEl.innerHTML = '<p class="error">Unable to load equipment.</p>';
      }
    };

    await apply();

    if (qEl) {
      let t;
      qEl.addEventListener('input', () => { clearTimeout(t); t = setTimeout(apply, 300); });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('equipment-list')) window.loadEquipment();
    }, { once: true });
  } else if (document.getElementById('equipment-list')) {
    window.loadEquipment();
  }
})();
