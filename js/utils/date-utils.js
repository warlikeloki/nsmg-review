// /js/utils/date-utils.js
// Date formatting utility functions

/**
 * Format an ISO date string to a human-readable format
 * @param {string} iso - ISO 8601 date string
 * @returns {string} Formatted date (e.g., "January 15, 2025") or empty string if invalid
 */
export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
