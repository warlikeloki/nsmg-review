// /js/modules/blog.js
// Purpose: Renders the Blog Teaser on the homepage and (optionally) a list on /blog.html.
// Fixes:
//  - Ensures teaser image uses the SAME field as blog post pages (featuredImage) with sensible fallbacks.
//  - Ensures "Read More" links include a valid slug query parameter so blog-post.html can load the correct post.

(function () {
  const BLOG_JSON_FALLBACK = "/json/posts.json"; // fallback if PHP endpoint is unavailable
  const BLOG_PHP_ENDPOINT = "/php/get_posts.php"; // optional backend (supports ?limit=, ?slug=)

  // ---------- Utilities ----------
  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }

  async function fetchJson(url) {
    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    return r.json();
  }

  // Try PHP first (if present), then JSON fallback.
  async function getLatestPosts(limit = 1) {
    try {
      const url = `${BLOG_PHP_ENDPOINT}?limit=${encodeURIComponent(limit)}`;
      return await fetchJson(url);
    } catch {
      const all = await fetchJson(BLOG_JSON_FALLBACK);
      // Expecting array of posts sorted newest-first; if not, sort by date desc if present
      const posts = Array.isArray(all) ? all : (all?.posts || []);
      return posts
        .slice() // copy
        .sort((a, b) => (new Date(b.date || 0)) - (new Date(a.date || 0)))
        .slice(0, limit);
    }
  }

  function resolveFeaturedImage(post) {
    // Align image choice with blog post page logic:
    // primary: post.featuredImage (string or {src,alt})
    // fallbacks: post.coverImage, post.images?.featured, then first of post.images?.all
    const p = post || {};
    const maybe = [
      p.featuredImage,
      p.coverImage,
      p?.images?.featured,
      Array.isArray(p?.images?.all) ? p.images.all[0] : null
    ].filter(Boolean);

    const first = maybe[0];
    if (!first) return null;

    if (typeof first === "string") return { src: first, alt: post?.title || "Blog image" };
    if (typeof first === "object") {
      return {
        src: first.src || first.url || first.path || "",
        alt: first.alt || post?.title || "Blog image"
      };
    }
    return null;
    }

  function buildTeaserHTML(post) {
    const image = resolveFeaturedImage(post);
    const title = post?.title || "Untitled Post";
    const excerpt = (post?.excerpt || post?.summary || "").toString().trim();
    const slug = post?.slug ? String(post.slug) : "";

    const imgHTML = image?.src
      ? `<img class="blog-teaser-image" src="${image.src}" alt="${escapeHtml(image.alt)}" loading="lazy">`
      : "";

    // IMPORTANT: we now always pass slug in query string.
    const readMoreHref = slug ? `/blog-post.html?slug=${encodeURIComponent(slug)}` : `/blog.html`;

    return `
      <article class="blog-teaser-card">
        ${imgHTML}
        <div class="blog-teaser-content">
          <h3 class="blog-teaser-title">${escapeHtml(title)}</h3>
          ${excerpt ? `<p class="blog-teaser-excerpt">${escapeHtml(excerpt)}</p>` : ""}
          <a class="btn read-more" href="${readMoreHref}" aria-label="Read more: ${escapeHtml(title)}">Read More</a>
        </div>
      </article>
    `;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[s]));
  }

  // ---------- Teaser (homepage) ----------
  async function renderHomepageTeaser() {
    const container = qs("#blog-teaser .blog-post-preview");
    if (!container) return;

    try {
      const [post] = await getLatestPosts(1);
      if (!post) {
        container.innerHTML = `<p class="muted">No blog posts found.</p>`;
        return;
      }
      container.innerHTML = buildTeaserHTML(post);
    } catch (err) {
      console.error("[blog.js] Failed to load blog teaser:", err);
      container.innerHTML = `<p class="error">Unable to load the latest blog post right now.</p>`;
    }
  }

  // ---------- Optional: Blog list on /blog.html ----------
  async function renderBlogListIfPresent() {
    const listContainer = qs("[data-blog-list]");
    if (!listContainer) return;

    try {
      const posts = await getLatestPosts(20);
      if (!posts.length) {
        listContainer.innerHTML = `<p class="muted">No posts yet—check back soon.</p>`;
        return;
      }
      listContainer.innerHTML = posts.map(buildListItemHTML).join("");
    } catch (err) {
      console.error("[blog.js] Failed to load blog list:", err);
      listContainer.innerHTML = `<p class="error">Unable to load blog posts right now.</p>`;
    }
  }

  function buildListItemHTML(post) {
    const image = resolveFeaturedImage(post);
    const title = post?.title || "Untitled Post";
    const date = post?.date ? new Date(post.date).toLocaleDateString() : "";
    const excerpt = (post?.excerpt || post?.summary || "").toString().trim();
    const slug = post?.slug ? String(post.slug) : "";

    const imgHTML = image?.src
      ? `<img class="blog-list-thumb" src="${image.src}" alt="${escapeHtml(image.alt)}" loading="lazy">`
      : "";

    const href = slug ? `/blog-post.html?slug=${encodeURIComponent(slug)}` : `/blog.html`;

    return `
      <article class="blog-list-item">
        ${imgHTML}
        <div class="blog-list-body">
          <h3><a href="${href}">${escapeHtml(title)}</a></h3>
          ${date ? `<time class="blog-date" datetime="${escapeHtml(post.date)}">${escapeHtml(date)}</time>` : ""}
          ${excerpt ? `<p>${escapeHtml(excerpt)}</p>` : ""}
          <a class="btn btn-sm" href="${href}" aria-label="Read more: ${escapeHtml(title)}">Read More</a>
        </div>
      </article>
    `;
  }

  // ---------- init ----------
  document.addEventListener("DOMContentLoaded", () => {
    renderHomepageTeaser();
    renderBlogListIfPresent();
  });
})();
