// /js/modules/blog-post.js
// Detail page loader with resilient sources and safe rendering.
// Order: php/get_post.php?slug=... → php/get_posts.php (filter) → json/posts.json (filter)
// Works on HTTP(S) and falls back to JSON when opened via file:// in VSCode preview.

(function () {
  const root = document.getElementById('blog-post-page') || document.body;

  // Targets (create if missing)
  const titleEl = document.querySelector('.post-title') || (() => {
    const h1 = document.createElement('h1');
    h1.className = 'post-title';
    root.appendChild(h1);
    return h1;
  })();

  const metaEl = document.querySelector('.post-meta') || (() => {
    const div = document.createElement('div');
    div.className = 'post-meta';
    titleEl.insertAdjacentElement('afterend', div);
    return div;
  })();

  const heroWrap = document.querySelector('.post-hero') || (() => {
    const div = document.createElement('div');
    div.className = 'post-hero';
    root.insertBefore(div, titleEl);
    return div;
  })();

  const contentEl = document.querySelector('.post-content') || (() => {
    const article = document.createElement('article');
    article.className = 'post-content';
    metaEl.insertAdjacentElement('afterend', article);
    return article;
  })();

  const statusEl = document.getElementById('post-status') || (() => {
    const p = document.createElement('p');
    p.id = 'post-status';
    p.className = 'status-note';
    root.insertBefore(p, heroWrap);
    return p;
  })();

  // Helpers
  function getParam(name) {
    const u = new URL(location.href);
    return u.searchParams.get(name) || '';
  }
  const slug = getParam('slug') || location.hash.replace(/^#/, '');

  const isFile = location.protocol === 'file:';
  async function fetchJSON(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function trySources(slug) {
    const sources = isFile
      ? ['json/posts.json', './json/posts.json']
      : [
          `/php/get_post.php?slug=${encodeURIComponent(slug)}`,
          './php/get_post.php?slug=' + encodeURIComponent(slug),
          '/php/get_posts.php',
          './php/get_posts.php',
          '/json/posts.json',
          './json/posts.json'
        ];

    for (const url of sources) {
      try {
        const data = await fetchJSON(url);
        // If we hit get_post.php, data *should* be a single object
        if (data && !Array.isArray(data) && (data.slug || data.title)) {
          return data;
        }
        // Otherwise, try to find in list
        const list = Array.isArray(data) ? data : data?.posts;
        if (Array.isArray(list)) {
          const match = list.find(p => (p.slug || '').toLowerCase() === slug.toLowerCase());
          if (match) return match;
        }
      } catch (_) { /* try next */ }
    }
    return null;
  }

  function normalize(post) {
    const cleanSlug = (post.slug || (post.title || '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));

    const hero = post.hero_image || post.image || '/media/logos/nsmg-logo.png';
    const excerpt = post.excerpt || post.summary || '';
    const content = post.content_html || post.content || '';
    const dateStr = post.date || post.updated_at || '';
    const dateNice = dateStr ? new Date(dateStr).toLocaleDateString() : '';
    const author = post.author || '';

    return {
      id: post.id || cleanSlug,
      slug: cleanSlug,
      title: post.title || 'Untitled',
      dateStr,
      dateNice,
      author,
      excerpt,
      content,
      hero,
      tags: post.tags || [],
      sample: !!post.sample
    };
  }

  function setHero(src, alt) {
    heroWrap.innerHTML = `
      <div class="post-hero__inner">
        <img src="${src}" alt="${alt ? alt.replace(/"/g, '&quot;') : ''}"
             width="1280" height="720" loading="eager" decoding="async">
      </div>
    `;
  }

  function renderTextContent(target, text) {
    // If content looks like HTML, use it as-is (trusted internal source).
    if (/<[a-z][\s\S]*>/i.test(text)) {
      target.innerHTML = text;
      return;
    }
    // Otherwise, render plaintext: split on blank lines into paragraphs.
    const parts = String(text).split(/\n{2,}/);
    target.innerHTML = parts.map(p =>
      `<p>${p.trim().replace(/\n/g, '<br>')}</p>`
    ).join('\n');
  }

  async function load() {
    if (!slug) {
      statusEl.textContent = 'Missing post slug.';
      return;
    }
    statusEl.textContent = 'Loading post…';

    const raw = await trySources(slug);
    if (!raw) {
      statusEl.textContent = 'Post not found.';
      return;
    }

    const post = normalize(raw);

    // Title + <title>
    titleEl.textContent = post.title + (post.sample ? ' (SAMPLE)' : '');
    try { document.title = `${post.title} - Neil Smith Media Group`; } catch {}

    // Meta
    metaEl.textContent = [post.dateNice, post.author].filter(Boolean).join(' • ');

    // Hero
    setHero(post.hero, post.title);

    // Content
    renderTextContent(contentEl, post.content || post.excerpt || '');

    // Done
    statusEl.textContent = '';
  }

  load();
})();
