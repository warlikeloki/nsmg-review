// /js/utils/fetch-utils.js
// Fetch and HTTP utility functions

/**
 * Fetch and parse JSON from a URL
 * @param {string} url - URL to fetch from
 * @returns {Promise<any>} Parsed JSON data
 * @throws {Error} If HTTP request fails
 */
export async function fetchJson(url) {
  const r = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}
