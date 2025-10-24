// /js/utils/blog-utils.js
// Blog-specific utility functions

/**
 * Resolve featured image from various possible post properties
 * Supports multiple schema formats for flexibility
 * @param {Object} post - Blog post object
 * @returns {Object|null} Object with {src, alt} or null if no image found
 */
export function resolveFeaturedImage(post) {
  const p = post || {};
  const candidates = [
    p.hero_image,           // primary schema
    p.image,                // secondary schema
    p.featuredImage,        // future-proof
    p.coverImage,
    p?.images?.featured,
    Array.isArray(p?.images?.all) ? p.images.all[0] : null
  ].filter(Boolean);

  const first = candidates[0];
  if (!first) return null;

  // Handle string URLs
  if (typeof first === "string") {
    return { src: first, alt: p?.title || "Blog image" };
  }

  // Handle image objects
  if (typeof first === "object") {
    return {
      src: first.src || first.url || first.path || "",
      alt: first.alt || p?.title || "Blog image"
    };
  }

  return null;
}
