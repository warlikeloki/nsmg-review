// /js/modules/site-settings.js
// Loads site settings JSON, renders service-region text, and injects LocalBusiness JSON-LD.
// Auto-runs on import; safe if JSON is missing.

export async function loadSiteSettings() {
  try {
    const res = await fetch('/json/site-settings.json', {
      cache: 'no-store',
      credentials: 'same-origin'
    });
    if (!res.ok) throw new Error('settings fetch failed');
    return await res.json();
  } catch {
    return { serviceRegion: { enabled: false }, accessControl: { usOnly: false } };
  }
}

export function renderServiceRegion(settings) {
  const s = settings?.serviceRegion;
  if (!s?.enabled || !s.text) return;

  const targets = [];
  const byId = document.getElementById('service-region-text');
  if (byId) targets.push(byId);
  document.querySelectorAll('[data-service-region]').forEach(n => targets.push(n));

  const ensureStyles = () => {
    if (document.getElementById('nsmg-service-region-style')) return;
    const style = document.createElement('style');
    style.id = 'nsmg-service-region-style';
    style.textContent = `
      .service-region{margin:.5rem 0;text-align:center;font-size:.95rem;opacity:.9}
      footer .service-region{margin-top:.25rem}
    `;
    document.head.appendChild(style);
  };

  if (targets.length === 0) {
    // If no placeholder exists, add a small line to the footer container (or body end).
    const host = document.getElementById('footer-container') || document.body;
    const p = document.createElement('p');
    p.className = 'service-region';
    p.dataset.generated = '1';
    p.textContent = s.text;
    host.appendChild(p);
    ensureStyles();
  } else {
    targets.forEach(el => (el.textContent = s.text));
    ensureStyles();
  }
}

export function injectLocalBusinessLD(settings) {
  try {
    const s = settings?.serviceRegion || {};
    const ld = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Neil Smith Media Group",
      "url": "https://neilsmith.org",
      "areaServed": s.text || "United States",
      "address": { "@type": "PostalAddress", "addressCountry": s.country || "US" }
    };
    const id = 'nsmg-localbusiness-ld';
    document.getElementById(id)?.remove();
    const tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.id = id;
    tag.textContent = JSON.stringify(ld);
    document.head.appendChild(tag);
  } catch { /* no-op */ }
}

// Auto-run
(async () => {
  const settings = await loadSiteSettings();
  try { renderServiceRegion(settings); } catch {}
  try { injectLocalBusinessLD(settings); } catch {}
})();
