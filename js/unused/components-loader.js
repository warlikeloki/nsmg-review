/* eslint-disable no-console */
/**
 * Lightweight component loader for static HTML fragments.
 * Safe defaults:
 *  - Uses root-relative paths (/header.html, /footer.html)
 *  - cache: 'no-store' to avoid stale content during edits
 *  - credentials: 'same-origin' so cookies are sent if needed
 *  - Gracefully skips if a target element is missing
 *
 * NOTE: This file lives in js/unused/ and won’t run unless you include it.
 */

function loadComponents(components) {
  components.forEach(({ id, file }) => {
    // Accept either "#header" or "#header-container" style IDs.
    const target =
      document.getElementById(id) ||
      document.getElementById(`${id}-container`);

    if (!target) {
      console.warn(`[components-loader] Skipping "${id}" (no element found).`);
      return;
    }

    fetch(file, { cache: 'no-store', credentials: 'same-origin' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then((html) => {
        target.innerHTML = html;
        console.log(`[components-loader] ${file} → #${target.id} loaded.`);
      })
      .catch((error) =>
        console.error(`[components-loader] Error loading ${file}:`, error)
      );
  });
}

// Only runs if this script is actually included somewhere.
document.addEventListener('DOMContentLoaded', () => {
  loadComponents([
    // Use root-relative paths so they resolve from any directory depth.
    { id: 'header', file: '/header.html' },
    { id: 'footer', file: '/footer.html' },
  ]);
});
