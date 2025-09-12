// NSM-152/155 — Minimal site settings loader (HOTFIX)
// Purpose: load /json/site-settings.json safely and expose the data;
// does NOT try to modify header/footer DOM beyond providing an export.

export async function loadSiteSettings() {
  try {
    // Correct path (root-relative). Use no-store so you always see fresh content.
    const res = await fetch('/json/site-settings.json', {
      cache: 'no-store',
      credentials: 'same-origin'
    });
    if (!res.ok) throw new Error(`settings fetch failed: ${res.status}`);
    return await res.json();
  } catch (e) {
    // Safe defaults if JSON missing/unreachable
    return { serviceRegion: { enabled: true }, accessControl: { usOnly: false } };
  }
}

// Optional: convenience getter (won't throw)
export async function getServiceRegionText() {
  const s = await loadSiteSettings();
  // Try common keys used earlier in the project
  const candidates = [
    s.regionText,
    s.serviceRegionText,
    s.service_region,
    s.serving,
    s?.serviceRegion?.text
  ].filter(v => typeof v === 'string' && v.trim().length > 0);
  return (candidates[0] || '').trim();
}

// NO auto-DOM injection in this hotfix version.
// If you later want footer rendering + JSON-LD, we’ll add it once things are stable.
