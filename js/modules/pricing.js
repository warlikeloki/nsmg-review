/* NSMG Pricing loader (robust)
   - Populates #packages-body and #ala-carte-body
   - Works with payload shapes:
       A) { packages: [...], alacarte: [...] }
       B) [ { type: "package"|"alacarte", service, description, price }, ... ]
   - Uses absolute endpoint to avoid relative path issues when under /services/
*/

(function () {
  // ----- Config
  const ENDPOINT = '/php/get_pricing.php'; // <-- absolute path so it works from anywhere
  const SELECTORS = {
    packagesBody: '#packages-body',
    alacarteBody: '#ala-carte-body',
    fallbackContainer: '#pricing-container' // optional extra render spot
  };

  // ----- DOM helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function ensureTargets() {
    const pkgBody = $(SELECTORS.packagesBody);
    const alaBody = $(SELECTORS.alacarteBody);
    if (!pkgBody || !alaBody) {
      console.warn('[pricing] Expected table bodies not found.',
        { packagesBody: !!pkgBody, alacarteBody: !!alaBody }
      );
    }
    return { pkgBody, alaBody };
  }

  function setStatus(tbody, msg) {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="3">${msg}</td></tr>`;
  }

  function formatPrice(v) {
    if (v == null || v === '') return '';
    // Accept already formatted strings like "$100" or "From $200"
    if (typeof v === 'string' && /[$€£]/.test(v)) return v;
    const n = Number(v);
    if (Number.isFinite(n)) {
      try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n); }
      catch { return `$${n.toFixed(2)}`; }
    }
    return String(v);
  }

  function rowHTML(item) {
    const service = item.service ?? item.title ?? item.name ?? '';
    const desc = item.description ?? item.details ?? item.desc ?? '';
    const price = formatPrice(item.price ?? item.cost ?? item.rate);
    return `
      <tr>
        <td>${escapeHTML(service)}</td>
        <td>${escapeHTML(desc)}</td>
        <td>${escapeHTML(price)}</td>
      </tr>
    `;
  }

  function escapeHTML(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function normalizeData(data) {
    // Accept two shapes:
    // 1) { packages: [...], alacarte: [...] }
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const packages = Array.isArray(data.packages) ? data.packages : [];
      const alacarte = Array.isArray(data.alacarte) ? data.alacarte : (Array.isArray(data.alaCarte) ? data.alaCarte : []);
      return { packages, alacarte };
    }
    // 2) [ { type: 'package'|'alacarte', ... }, ... ]
    if (Array.isArray(data)) {
      const packages = data.filter(i => (i.type || i.category || '').toString().toLowerCase().includes('pack'));
      const alacarte = data.filter(i => (i.type || i.category || '').toString().toLowerCase().includes('la') || (i.type || i.category || '').toString().toLowerCase().includes('à'));
      // If no explicit type, do a naive split: first half -> packages, second -> alacarte
      if (!packages.length && !alacarte.length) {
        const mid = Math.floor(data.length / 2);
        return { packages: data.slice(0, mid), alacarte: data.slice(mid) };
      }
      return { packages, alacarte };
    }
    // Unknown shape → treat as empty
    return { packages: [], alacarte: [] };
  }

  async function load() {
    const { pkgBody, alaBody } = ensureTargets();
    if (pkgBody) setStatus(pkgBody, 'Loading prices...');
    if (alaBody) setStatus(alaBody, 'Loading prices...');

    let res;
    try {
      res = await fetch(ENDPOINT, { credentials: 'same-origin', cache: 'no-store' });
    } catch (err) {
      console.error('[pricing] Network error fetching endpoint', ENDPOINT, err);
      if (pkgBody) setStatus(pkgBody, 'Unable to load prices (network).');
      if (alaBody) setStatus(alaBody, 'Unable to load prices (network).');
      return;
    }

    if (!res.ok) {
      console.error('[pricing] Endpoint returned error', ENDPOINT, res.status, res.statusText);
      if (pkgBody) setStatus(pkgBody, `Unable to load prices (HTTP ${res.status}).`);
      if (alaBody) setStatus(alaBody, `Unable to load prices (HTTP ${res.status}).`);
      return;
    }

    let data;
    try {
      data = await res.json();
    } catch (err) {
      console.error('[pricing] Failed to parse JSON from endpoint', ENDPOINT, err);
      if (pkgBody) setStatus(pkgBody, 'Unable to load prices (invalid JSON).');
      if (alaBody) setStatus(alaBody, 'Unable to load prices (invalid JSON).');
      return;
    }

    const { packages, alacarte } = normalizeData(data);
    // Render packages
    if (pkgBody) {
      if (!packages.length) {
        setStatus(pkgBody, 'No package pricing available.');
      } else {
        pkgBody.innerHTML = packages.map(rowHTML).join('');
      }
    }
    // Render à la carte
    if (alaBody) {
      if (!alacarte.length) {
        setStatus(alaBody, 'No à la carte pricing available.');
      } else {
        alaBody.innerHTML = alacarte.map(rowHTML).join('');
      }
    }

    // Extra: if neither populated but we have a generic container, dump a quick diagnostic
    if ((!packages?.length && !alacarte?.length) && $(SELECTORS.fallbackContainer)) {
      const c = $(SELECTORS.fallbackContainer);
      c.hidden = false;
      c.innerHTML = `
        <div class="pricing-empty-note" style="padding:.75rem 0;">
          <small>Pricing data returned empty. Check <code>${ENDPOINT}</code> response shape in Network tab.</small>
        </div>`;
    }

    // Log summary for debugging
    console.info('[pricing] Loaded', {
      endpoint: ENDPOINT,
      counts: { packages: packages?.length || 0, alacarte: alacarte?.length || 0 }
    });
  }

  // Kick off when DOM is interactive/ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load, { once: true });
  } else {
    load();
  }
})();
