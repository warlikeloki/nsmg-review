// NSM-24 (blog portion): Homepage Blog Teaser
// Fetches the most recent blog post via PHP with JSON fallback.
// Injects into #blog-teaser. Excerpt is line-clamped via CSS (no layout shift).

(function () {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  async function init() {
    const root = document.getElementById('blog-teaser');
    if (!root) return; // only run on homepage

    root.classList.add('blog-teaser-root');
    root.setAttribute('aria-busy', 'true');
    root.innerHTML = renderSkeleton();

    let post = null;
    try {
      post = await fetchLatestPostPhp();
    } catch (_) {}
    if (!post) {
      try {
        post = await fetchLatestPostJson();
      } catch (_) {}
    }

    if (!post) {
      renderEmpty(root);
      root.removeAttribute('aria-busy');
      return;
    }

    renderPost(root, post);
    root.removeAttribute('aria-busy');
  }

  function renderSkeleton() {
    // very light skeleton to avoid layout jump
    return `
      <article class="blog-teaser" aria-hidden="true">
        <div class="blog-image skeleton"></div>
        <div class="blog-content">
          <div class="blog-title skeleton-line"></div>
          <div class="blog-excerpt skeleton-line"></div>
          <div class="blog-excerpt skeleton-line short"></div>
        </div>
      </article>
    `;
  }

  async function fetchLatestPostPhp() {
    const url = '/php/get_posts.php?limit=1';
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('PHP fetch failed');
    const json = await res.json();
    const data = Array.isArray(json?.data) ? json.data : [];
    const p = data[0];
    return p ? normalizePost(p) : null;
  }

  async function fetchLatestPostJson() {
    const url = '/json/posts.json'; // fallback
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('JSON fetch failed');
    const list = await res.json();
    const data = Array.isArray(list) ? list : (Array.isArray(list?.data) ? list.data : []);
    const p = data[0];
    return p ? normalizePost(p) : null;
  }

  function normalizePost(p) {
    // Expect: { id, title, excerpt, featured_image, url }
    const title = (p.title || 'Untitled Post').toString();
    const excerpt = stripHtml((p.excerpt || '').toString());
    let url = p.url;
    if (!url && p.id) url = `/blog-post.php?id=${encodeURIComponent(p.id)}`;
    if (!url) url = '/blog.html';

    return {
      title,
      excerpt,
      image: p.featured_image || '/media/photos/avatar-placeholder.svg',
      url
    };
  }

  function renderPost(root, post) {
    const art = document.createElement('article');
    art.className = 'blog-teaser';

    const img = document.createElement('img');
    img.className = 'blog-featured-image';
    img.src = post.image;
    img.alt = post.title ? `Image for ${post.title}` : 'Blog post image';
    img.decoding = 'async';
    img.loading = 'lazy';

    const body = document.createElement('div');
    body.className = 'blog-content';

    const h3 = document.createElement('h3');
    h3.className = 'blog-title';
    h3.textContent = post.title;

    const p = document.createElement('p');
    p.className = 'blog-excerpt clamp-2';
    p.textContent = post.excerpt;

    const a = document.createElement('a');
    a.className = 'blog-readmore';
    a.href = post.url;
    a.setAttribute('aria-label', `Read more: ${post.title}`);
    a.textContent = 'Read More';

    body.appendChild(h3);
    body.appendChild(p);
    body.appendChild(a);

    art.appendChild(img);
    art.appendChild(body);

    root.innerHTML = '';
    root.appendChild(art);
  }

  function renderEmpty(root) {
    root.innerHTML = `
      <div class="blog-teaser empty" role="status" aria-live="polite">
        <p class="muted">No recent posts available.</p>
      </div>
    `;
  }

  function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
})();
