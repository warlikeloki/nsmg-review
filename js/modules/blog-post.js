// /js/modules/blog-post.js
// Works on /blog-post.php and /blog-post.html.
// Accepts ?id= or ?slug=. Uses hero_image → image → featuredImage → coverImage.
// Renders date, author, category, and tags (array).

(function () {
  const BLOG_JSON_FALLBACK = "/json/posts.json";
  const BLOG_PHP_ENDPOINT = "/php/get_posts.php"; // optional backend

  const $ = (sel, root = document) => root.querySelector(sel);

  async function fetchJson(url) {
    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    return r.json();
  }

  function getParams() {
    const p = new URLSearchParams(location.search);
    let slug = (p.get("slug") || "").trim() || null;
    let id   = (p.get("id")   || "").trim() || null;

    // Optional: allow PHP to pass params inline if query is stripped
    if ((!slug && !id) && typeof window.__BLOG_POST_PARAMS__ === "object") {
      const s = (window.__BLOG_POST_PARAMS__.slug || "").trim();
      const i = (window.__BLOG_POST_PARAMS__.id   || "").trim();
      if (s) slug = s;
      if (i) id   = i;
    }
    return { slug, id };
  }

  async function getPost({ slug, id }) {
    const query = slug ? `slug=${encodeURIComponent(slug)}` :
                  id   ? `id=${encodeURIComponent(id)}`     : "";

    if (query) {
      try {
        const data = await fetchJson(`${BLOG_PHP_ENDPOINT}?${query}`);
        return Array.isArray(data) ? data[0] : data;
      } catch {
        // fall through to JSON
      }
    }

    const payload = await fetchJson(BLOG_JSON_FALLBACK);
    const posts = Array.isArray(payload) ? payload : (payload?.posts || []);

    if (id)   return posts.find(p => String(p.id)   === String(id));
    if (slug) return posts.find(p => String(p.slug) === String(slug));
    return null;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[s]));
  }

  function resolveFeaturedImage(post) {
    const p = post || {};
    const candidates = [
      p.hero_image,           // your primary
      p.image,                // your secondary
      p.featuredImage,        // future-proof
      p.coverImage,
      p?.images?.featured,
      Array.isArray(p?.images?.all) ? p.images.all[0] : null
    ].filter(Boolean);

    const first = candidates[0];
    if (!first) return null;

    if (typeof first === "string") return { src: first, alt: p?.title || "Blog image" };
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
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  function setStatus(msg, type = "info") {
    const note = $("#post-status");
    if (!note) return;
    note.textContent = msg || "";
    note.classList.remove("is-error", "is-info");
    note.classList.add(type === "error" ? "is-error" : "is-info");
  }

  function renderPost(post, { slug, id }) {
    const hero = $(".post-hero");
    const titleEl = $(".post-title");
    const meta = $(".post-meta");
    const content = $(".post-content");

    if (!hero || !titleEl || !meta || !content) {
      console.warn("[blog-post.js] Required DOM nodes not found.");
      return;
    }

    if (!post) {
      const which = slug ? `slug "${slug}"` : id ? `id "${id}"` : "no identifier";
      titleEl.textContent = "That post couldn’t be found";
      meta.innerHTML = "";
      hero.innerHTML = "";
      content.innerHTML = `
        <p>We couldn’t find a post for ${escapeHtml(which)}. Try the <a href="/blog.html">blog index</a>.</p>
      `;
      setStatus("", "info");
      document.title = "Post Not Found — Neil Smith Media Group";
      return;
    }

    const img = resolveFeaturedImage(post);
    hero.innerHTML = img?.src
      ? `<img src="${img.src}" alt="${escapeHtml(img.alt)}" loading="eager">`
      : "";

    const title = post.title || "Untitled Post";
    titleEl.textContent = title;

    const bits = [];
    if (post.date) bits.push(`<time datetime="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date))}</time>`);
    if (post.author) bits.push(`<span class="post-author">${escapeHtml(post.author)}</span>`);
    if (post.category) bits.push(`<span class="post-category">${escapeHtml(post.category)}</span>`);
    if (Array.isArray(post.tags) && post.tags.length) {
      bits.push(`<span class="post-tags">${post.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(" ")}</span>`);
    }
    meta.innerHTML = bits.join(" • ");

    if (post.html && typeof post.html === "string") {
      content.innerHTML = post.html; // trusted
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

  async function init() {
    const params = getParams();

    if (!params.slug && !params.id) {
      const titleEl = $(".post-title");
      const meta = $(".post-meta");
      const content = $(".post-content");
      const hero = $(".post-hero");
      if (titleEl) titleEl.textContent = "Post not specified";
      if (meta) meta.innerHTML = "";
      if (hero) hero.innerHTML = "";
      if (content) {
        content.innerHTML = `<p>Provide a valid <code>?id=</code> or <code>?slug=</code>. Try the <a href="/blog.html">blog page</a>.</p>`;
      }
      setStatus("Missing id/slug parameter.", "error");
      document.title = "Post not specified — Neil Smith Media Group";
      return;
    }

    try {
      setStatus("Loading post…", "info");
      const post = await getPost(params);
      renderPost(post || null, params);
    } catch (err) {
      console.error("[blog-post.js] Failed to load post:", err);
      const titleEl = $(".post-title");
      const meta = $(".post-meta");
      const content = $(".post-content");
      const hero = $(".post-hero");

      if (titleEl) titleEl.textContent = "Something went wrong";
      if (meta) meta.innerHTML = "";
      if (hero) hero.innerHTML = "";
      if (content) {
        content.innerHTML = `<p>We couldn’t load this post right now. Visit the <a href="/blog.html">blog index</a>.</p>`;
      }
      setStatus("Error loading post.", "error");
      document.title = "Error — Neil Smith Media Group";
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
