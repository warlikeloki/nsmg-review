// /js/pages/services.js
document.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('services-list');
  const filterEl = document.getElementById('services-filter');   // select: all|packages|alacarte
  const searchEl = document.getElementById('services-search');   // input[type=text]
  const countEl = document.getElementById('services-count');

  if (!listEl) return;

  const qs = new URLSearchParams(location.search);
  if (filterEl && qs.get('type')) filterEl.value = qs.get('type'); // optional deep-link

  const fetchServices = async (opts = {}) => {
    const p = new URLSearchParams();
    if (opts.is_package === 0 || opts.is_package === 1) p.set('is_package', String(opts.is_package));
    if (opts.q) p.set('q', opts.q);
    const url = '/php/get_services.php' + (p.toString() ? `?${p.toString()}` : '');
    const res = await fetch(url);
    return res.json();
  };

  const fmtPrice = v => (v == null ? '' : `$${Number(v).toFixed(2)}`);

  const render = (rows) => {
    if (countEl) countEl.textContent = `${rows.length} service${rows.length === 1 ? '' : 's'}`;
    if (!rows.length) {
      listEl.innerHTML = '<p>No services found.</p>';
      return;
    }
    listEl.innerHTML = rows.map(s => `
      <article class="service-card">
        <h3>${s.name}</h3>
        ${s.description ? `<p>${s.description}</p>` : ''}
        <p class="meta">
          ${fmtPrice(s.price)} ${s.unit ? `<span class="unit">${s.unit}</span>` : ''}
          ${s.is_package ? '<span class="badge">Package</span>' : ''}
        </p>
      </article>
    `).join('');
  };

  const load = async () => {
    listEl.innerHTML = '<p>Loading services…</p>';
    try {
      const filter = filterEl ? filterEl.value : 'all';
      const q = (searchEl && searchEl.value || '').trim();
      const is_package =
        filter === 'packages' ? 1 :
        filter === 'alacarte' ? 0 :
        undefined;

      const { success, data, error } = await fetchServices({ is_package, q });
      if (!success || !Array.isArray(data)) throw new Error(error || 'Bad response');
      render(data);
    } catch (e) {
      console.error(e);
      listEl.innerHTML = '<p class="error">Unable to load services.</p>';
    }
  };

  if (filterEl) filterEl.addEventListener('change', load);
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      clearTimeout(searchEl.__t);
      searchEl.__t = setTimeout(load, 300);
    });
  }

  load();
});
