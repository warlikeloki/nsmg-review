// /js/modules/blog.js
// Blog list loader with robust local/production fallbacks.
// - Tries PHP endpoint first (prod), then JSON (dev).
// - Works on HTTP(S) and degrades to JSON when file:// previewed.
// - Renders simple "cards" linking to blog-post.html?slug=...

(function () {
  // Find/create container
  const container =
    document.querySelector('.blog-list') ||
    document.getElementById('blog-list') ||
    (function () {
      const main = document.querySelector('main') || document.body;
      const div = document.createElement('div');
      div.className = 'blog-list';
      main.appendChild(div);
      return div;
    })();

  // Find/create status
  const statusEl =
    document.getElementById('blog-status') ||
    (function () {
      const p = document.createElement('p');
      p.id = 'blog-status';
      p.className = 'status-note';
      container.parentNode.insertBefore(p, container);
      return p;
    })();

  // Candidate sources (ordered)
  const isFile = location.protocol === 'file:';
  const candidates = isFile
    ? ['json/posts.json', './json/posts.json']
    : ['/php/get_posts.php', './php/get_posts.php', '/json/posts.json', './json/posts.json'];

  async function tryFetch(url) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.posts;
      if (!Array.isArray(list)) throw new Error('Unexpected JSON shape');
      return list;
    } catch {
      return null;
    }
  }

  function normalizePost(p) {
    const slug =
      p.slug ||
      (p.title ? p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : '');
    return {
      id: p.id || slug || '',
      slug,
      title: p.title || 'Untitled',
      date: p.date || p.updated_at || '',
      author: p.author || '',
      excerpt: p.excerpt || p.summary || (p.content ? String(p.content).slice(0, 160) + '…' : ''),
      image: p.image || p.thumbnail || p.hero_image || '/media/logos/nsmg-logo.png',
      sample: !!p.sample
    };
  }

  function render(list) {
    container.innerHTML = '';

    // Sort newest first
    list.sort((a, b) => {
      const da = new Date(a.date || a.updated_at || 0).getTime();
      const db = new Date(b.date || b.updated_at || 0).getTime();
      return db - da;
    });

    list.forEach(raw => {
      const post = normalizePost(raw);
      const a = document.createElement('a');
      a.href = `/blog-post.html?slug=${encodeURIComponent(post.slug)}`;
      a.className = 'blog-card';
      a.innerHTML = `
        <div class="blog-card__image">
          <img
            src="${post.image}"
            alt=""
            loading="lazy"
            decoding="async"
            width="640" height="360"
          >
        </div>
        <div class="blog-card__body">
          <h3 class="blog-card__title">
            ${post.title}${post.sample ? ' <span class="badge">SAMPLE</span>' : ''}
          </h3>
          <div class="blog-card__meta">
            ${post.date ? new Date(post.date).toLocaleDateString() : ''}${post.author ? ' • ' + post.author : ''}
          </div>
          <p class="blog-card__excerpt">${post.excerpt || ''}</p>
        </div>
      `;
      container.appendChild(a);
    });
  }

  async function load() {
    statusEl.textContent = 'Loading posts…';
    let posts = null;
    for (const url of candidates) {
      posts = await tryFetch(url);
      if (posts && posts.length) break;
    }
    if (!posts || !posts.length) {
      statusEl.textContent = 'No posts to show.';
      return;
    }
    render(posts);
    statusEl.textContent = '';
  }

  load();
})();
