// /js/modules/blog-post.js
// Purpose: Renders the single blog post page by slug.
// Also provides a graceful, user-friendly message if slug is missing or invalid.

(function () {
  const BLOG_JSON_FALLBACK = "/json/posts.json";
  const BLOG_PHP_ENDPOINT = "/php/get_posts.php"; // optional (supports ?slug=)

  function qs(sel, root = document) { return root.querySelector(sel); }

  async function fetchJson(url) {
    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    return r.json();
  }

  function getSlugFromUrl() {
    const params = new URLSearchParams(location.search);
    const slug = params.get("slug");
    return slug && slug.trim() ? slug.trim() : null;
  }

  async function getPostBySlug(slug) {
    // Try PHP endpoint first
    try {
      const url = `${BLOG_PHP_ENDPOINT}?slug=${encodeURIComponent(slug)}`;
      const data = await fetchJson(url);
      // If backend returns a single post or an array, normalize to a single object
      return Array.isArray(data) ? data[0] : data;
    } catch {
      // Fallback to JSON
      const all = await fetchJson(BLOG_JSON_FALLBACK);
      const posts = Array.isArray(all) ? all : (all?.posts || []);
      return posts.find(p => String(p.slug) === String(slug));
    }
  }

  function resolveFeaturedImage(post) {
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

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[s]));
  }

  function renderPost(post) {
    const outlet = qs("[data-post]");
    if (!outlet) return;

    if (!post) {
      outlet.innerHTML = `
        <article class="post-error">
          <h1>That post couldn’t be found</h1>
          <p>The link might be out of date or the post was moved. You can browse the <a href="/blog.html">blog index</a> instead.</p>
        </article>`;
      return;
    }

    const image = resolveFeaturedImage(post);
    const date = post?.date ? new Date(post.date).toLocaleDateString() : "";
    const imgHTML = image?.src
      ? `<img class="post-hero" src="${image.src}" alt="${escapeHtml(image.alt)}" loading="eager">`
      : "";

    outlet.innerHTML = `
      <article class="post">
        <header class="post-header">
          <h1>${escapeHtml(post.title || "Untitled Post")}</h1>
          ${date ? `<time class="post-date" datetime="${escapeHtml(post.date)}">${escapeHtml(date)}</time>` : ""}
          ${imgHTML}
        </header>
        <section class="post-body">
          ${post?.html ?? (post?.content ? `<p>${escapeHtml(post.content)}</p>` : "<p></p>")}
        </section>
        <footer class="post-footer">
          <a class="btn" href="/blog.html">← Back to Blog</a>
        </footer>
      </article>
    `;
  }

  async function init() {
    const outlet = qs("[data-post]");
    if (!outlet) return;

    const slug = getSlugFromUrl();
    if (!slug) {
      // Friendlier message than the raw error previously displayed
      outlet.innerHTML = `
        <article class="post-error">
          <h1>Post not specified</h1>
          <p>We need a post link with a valid slug to load it. Try starting from the <a href="/blog.html">blog page</a>.</p>
        </article>`;
      return;
    }

    try {
      const post = await getPostBySlug(slug);
      renderPost(post || null);
    } catch (err) {
      console.error("[blog-post.js] Failed to load post:", err);
      outlet.innerHTML = `
        <article class="post-error">
          <h1>Something went wrong</h1>
          <p>We couldn’t load this post right now. Please try again later, or visit the <a href="/blog.html">blog index</a>.</p>
        </article>`;
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
