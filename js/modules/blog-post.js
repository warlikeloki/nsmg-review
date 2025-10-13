// /js/modules/blog-post.js
// Renders a single blog post on /blog-post.html (and can also work with blog-post.php if it has the same DOM).
// Fixes:
//  - Friendly handling when the slug is missing.
//  - Uses the same image resolution order as the homepage teaser for visual consistency.
//  - Updates document.title and fills your exact DOM nodes (#post-status, .post-hero, .post-title, .post-meta, .post-content).

(function () {
  // Adjust these if your paths differ
  const BLOG_JSON_FALLBACK = "/json/posts.json";
  const BLOG_PHP_ENDPOINT = "/php/get_posts.php"; // Optional backend (supports ?slug=)

  // ---------- DOM helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);

  // ---------- Networking ----------
  async function fetchJson(url) {
    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    return r.json();
  }

  function getSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    return slug && slug.trim() ? slug.trim() : null;
  }

  async function getPostBySlug(slug) {
    // Try PHP endpoint first (if available)
    try {
      const url = `${BLOG_PHP_ENDPOINT}?slug=${encodeURIComponent(slug)}`;
      const data = await fetchJson(url);
      return Array.isArray(data) ? data[0] : data;
    } catch {
      // Fallback to static JSON
      const payload = await fetchJson(BLOG_JSON_FALLBACK);
      const posts = Array.isArray(payload) ? payload : (payload?.posts || []);
      return posts.find(p => String(p.slug) === String(slug));
    }
  }

  // ---------- Utilities ----------
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[s]));
  }

  function resolveFeaturedImage(post) {
    // Shared logic with teaser: prefer featuredImage, then coverImage, then images.featured, then first of images.all
    const p = post || {};
    const candidates = [
      p.featuredImage,
      p.coverImage,
      p?.images?.featured,
      Array.isArray(p?.images?.all) ? p.images.all[0] : null
    ].filter(Boolean);

    const first = candidates[0];
    if (!first) return null;

    if (typeof first === "string") {
      return { src: first, alt: p?.title || "Blog image" };
    }
    if (typeof first === "object") {
      return {
        src: first.src || first.url || first.path || "",
        alt: first.alt || p?.title || "Blog image"
      };
    }
    return null;
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, {
      year: "numeric", month: "long", day: "numeric"
    });
  }

  // ---------- Rendering ----------
  function setStatus(msg, type = "info") {
    const note = $("#post-status");
    if (!note) return;
    note.textContent = msg || "";
    note.classList.remove("is-error", "is-info");
    note.classList.add(type === "error" ? "is-error" : "is-info");
  }

  function renderPost(post) {
    const hero = $(".post-hero");
    const titleEl = $(".post-title");
    const meta = $(".post-meta");
    const content = $(".post-content");

    if (!hero || !titleEl || !meta || !content) {
      console.warn("[blog-post.js] Required DOM nodes not found on the page.");
      return;
    }

    if (!post) {
      setStatus("", "info");
      titleEl.textContent = "That post couldn’t be found";
      meta.innerHTML = "";
      hero.innerHTML = "";
      content.innerHTML = `
        <p>The link might be out of date or the post was moved. You can browse the <a href="/blog.html">blog index</a> instead.</p>
      `;
      document.title = "Post Not Found — Neil Smith Media Group";
      return;
    }

    const img = resolveFeaturedImage(post);
    hero.innerHTML = img?.src
      ? `<img src="${img.src}" alt="${escapeHtml(img.alt)}" loading="eager">`
      : "";

    const title = post.title || "Untitled Post";
    titleEl.textContent = title;

    const dateHtml = post.date
      ? `<time datetime="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date))}</time>`
      : "";

    // Optional author/category lines if present
    const authorHtml = post.author ? `<span class="post-author">${escapeHtml(post.author)}</span>` : "";
    const catHtml = Array.isArray(post.categories) && post.categories.length
      ? `<span class="post-categories">${post.categories.map(c => `<span class="cat">${escapeHtml(c)}</span>`).join(" ")}</span>`
      : "";

    meta.innerHTML = [dateHtml, authorHtml, catHtml].filter(Boolean).join(" • ");

    // Prefer HTML provided by CMS; otherwise show text content
    if (post.html && typeof post.html === "string") {
      content.innerHTML = post.html; // Assuming trusted content from your backend
    } else if (post.content) {
      content.innerHTML = `<p>${escapeHtml(String(post.content))}</p>`;
    } else if (post.excerpt) {
      content.innerHTML = `<p>${escapeHtml(String(post.excerpt))}</p>`;
    } else {
      content.innerHTML = `<p></p>`;
    }

    document.title = `${title} — Neil Smith Media Group`;
    setStatus("", "info");
  }

  // ---------- Init ----------
  async function init() {
    const slug = getSlugFromUrl();

    if (!slug) {
      // Friendly missing-slug state that matches your page’s structure
      renderPost(null);
      const titleEl = $(".post-title");
      const meta = $(".post-meta");
      const content = $(".post-content");
      const hero = $(".post-hero");

      if (titleEl) titleEl.textContent = "Post not specified";
      if (meta) meta.innerHTML = "";
      if (hero) hero.innerHTML = "";
      if (content) {
        content.innerHTML = `
          <p>We need a post link with a valid slug to load it. Try starting from the <a href="/blog.html">blog page</a>.</p>
        `;
      }
      setStatus("Missing slug parameter.", "error");
      document.title = "Post not specified — Neil Smith Media Group";
      return;
    }

    try {
      setStatus("Loading post…", "info");
      const post = await getPostBySlug(slug);
      renderPost(post || null);
    } catch (err) {
      console.error("[blog-post.js] Failed to load post:", err);
      // Graceful error fallback reusing the same render slots
      const titleEl = $(".post-title");
      const meta = $(".post-meta");
      const content = $(".post-content");
      const hero = $(".post-hero");

      if (titleEl) titleEl.textContent = "Something went wrong";
      if (meta) meta.innerHTML = "";
      if (hero) hero.innerHTML = "";
      if (content) {
        content.innerHTML = `
          <p>We couldn’t load this post right now. Please try again later, or visit the <a href="/blog.html">blog index</a>.</p>
        `;
      }
      setStatus("Error loading post.", "error");
      document.title = "Error — Neil Smith Media Group";
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
