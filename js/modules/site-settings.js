// /js/modules/site-settings.js
// Renders service region text in the footer and injects minimal JSON-LD.

export async function initSiteSettings() {
  const settings = await loadSiteSettings();
  const sr = settings?.serviceRegion;
  if (!sr || sr.enabled !== true) return;

  renderServiceRegion(sr);
  injectJsonLd(sr);
}

export async function loadSiteSettings() {
  // Fetch with no-store so edits show immediately
  try {
    const res = await fetch('/json/site-settings.json', {
      cache: 'no-store',
      credentials: 'same-origin'
    });
    if (!res.ok) throw new Error(`settings ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('[site-settings] Using safe defaults due to fetch error:', e);
    return {
      serviceRegion: { enabled: false },
      accessControl: { usOnly: false }
    };
  }
}

function renderServiceRegion(sr) {
  // Where to render (prefer a footer inside #footer-container)
  const footer =
    document.querySelector('#footer-container footer') ||
    document.querySelector('footer') ||
    document.querySelector('#footer-container');
  if (!footer) return;

  // Find an existing slot or create one
  let slot =
    footer.querySelector('#service-region') ||
    footer.querySelector('.service-region') ||
    footer.querySelector('[data-service-region]');

  if (!slot) {
    const container = footer.querySelector('.container') || footer;
    slot = document.createElement('p');
    slot.id = 'service-region';
    slot.className = 'service-region';
    container.appendChild(slot);
  }

  const text = sr.text || buildRegionText(sr);
  slot.textContent = normalizeLabel(text);
}

function buildRegionText(sr) {
  // Accept flexible shapes: text, area, city list, etc.
  if (Array.isArray(sr.cities) && sr.cities.length) {
    return `Serving: ${sr.cities.join(', ')}`;
  }
  if (Array.isArray(sr.regions) && sr.regions.length) {
    return `Serving: ${sr.regions.join(', ')}`;
  }
  if (sr.area) {
    return `Serving: ${sr.area}`;
  }
  return 'Serving: Greater Orlando, FL';
}

function normalizeLabel(str) {
  // Avoid "Serving: Serving: ..."
  return /^serving:\s*/i.test(str) ? str : `Serving: ${str}`;
}

function injectJsonLd(sr) {
  try {
    // Minimal Organization JSON-LD with areaServed text. Adjust if you have a canonical org block elsewhere.
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'Neil Smith Media Group',
      'areaServed': sr.text || sr.area || undefined
    };

    // Don’t duplicate
    if (document.getElementById('nsmg-site-settings-jsonld')) return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'nsmg-site-settings-jsonld';
    script.textContent = JSON.stringify(data, null, 0);
    document.head.appendChild(script);
  } catch {
    /* no-op */
  }
}
