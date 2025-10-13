// /js/modules/blog.js
// Homepage teaser + optional blog list, tailored to your JSON schema.
// Uses hero_image → image → featuredImage → coverImage fallback.
// "Read More" links point to /blog-post.php?id=<postId>.

(function () {
  // ===== CONFIG =====
  const POST_PAGE = "/blog-post.php"; // stays PHP to match your staging
  const BLOG_JSON_FALLBACK = "/json/posts.json";
  const BLOG_PHP_ENDPOINT = "/php/get_posts.php"; // optional backend; JSON fallback works fine

  const $ = (sel, root = document) => root.querySelector(sel);

  async function fetchJson(url) {
    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    return r.json();
  }

  // Prefer PHP if present (limit supported); else JSON
  async function getLatestPosts(limit = 1) {
    try {
      const url = `${BLOG_PHP_ENDPOINT}?limit=${encodeURIComponent(limit)}`;
      const data = await fetchJson(url);
      const arr = Array.isArray(data) ? data : (data?.posts || []);
      return arr;
    } catch {
      const payload = await fetchJson(BLOG_JSON_FALLBACK);
      const posts = Array.isArray(payload) ? payload : (payload?.posts || []);
      return posts
        .slice()
        .sort((a, b) => (new Date(b?.date || 0)) - (new Date(a?.date || 0)))
        .slice(0, limit);
    }
  }

  function resolveFeaturedImage(post) {
    // Your schema: hero_image, image
    const p = post || {};
    const candidates = [
      p.hero_image,
      p.image,
      p.featuredImage,       // future-proof
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

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[s]));
  }

  function choosePostUrl(post) {
    if (post?.id)   return `${POST_PAGE}?id=${encodeURIComponent(String(post.id))}`;
    if (post?.slug) return `${POST_PAGE}?slug=${encodeURIComponent(String(post.slug))}`;
    return "/blog.html";
  }

  function buildTeaserHTML(post) {
    const image = resolveFeaturedImage(post);
    const title = post?.title || "Untitled Post";
    const excerpt = (post?.excerpt || post?.summary || "").toString().trim();
    const href = choosePostUrl(post);

    const imgHTML = image?.src
      ? `<img class="blog-teaser-image" src="${image.src}" alt="${escapeHtml(image.alt)}" loading="lazy">`
      : "";

    return `
      <article class="blog-teaser-card">
        ${imgHTML}
        <div class="blog-teaser-content">
          <h3 class="blog-teaser-title">${escapeHtml(title)}</h3>
          ${excerpt ? `<p class="blog-teaser-excerpt">${escapeHtml(excerpt)}</p>` : ""}
          <a class="btn read-more" href="${href}" aria-label="Read more: ${escapeHtml(title)}">Read More</a>
        </div>
      </article>
    `;
  }

  function buildListItemHTML(post) {
    const image = resolveFeaturedImage(post);
    const title = post?.title || "Untitled Post";
    const date = post?.date ? new Date(post.date).toLocaleDateString() : "";
    const excerpt = (post?.excerpt || post?.summary || "").toString().trim();
    const href = choosePostUrl(post);

    const imgHTML = image?.src
      ? `<img class="blog-list-thumb" src="${image.src}" alt="${escapeHtml(image.alt)}" loading="lazy">`
      : "";

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

  async function renderHomepageTeaser() {
    const container = $("#blog-teaser .blog-post-preview");
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

  async function renderBlogListIfPresent() {
    const listContainer = document.querySelector("[data-blog-list]");
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

  document.addEventListener("DOMContentLoaded", () => {
    renderHomepageTeaser();
    renderBlogListIfPresent();
  });
})();
