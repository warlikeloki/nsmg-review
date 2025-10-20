/* /js/modules/blog-page.js
   Renders the blog index using a JSON endpoint.
   Expects items shaped like:
   [
     {
       "title": "Post Title",
       "slug": "post-title",         // or "url": "/blog/post-title.html"
       "url": "/blog/post-title.html",
       "date": "2025-09-20",
       "excerpt": "Short summary...",
       "image": "/media/blog/hero.jpg"  // optional
     },
     ...
   ]
*/

(() => {
  const container = document.getElementById('blog-posts-container');
  if (!container) return;

  // Endpoint discovery: data-endpoint attr, then common fallbacks
  const candidates = [];
  const fromDataAttr = container.dataset.endpoint && container.dataset.endpoint.trim();
  if (fromDataAttr) candidates.push(fromDataAttr);

  // IMPORTANT: try the existing PHP endpoint first if no data-endpoint given
  candidates.push(
    '/php/get_posts.php',   // <-- your working backend
    '/data/blog.json',
    '/blog.json',
    '/blog/index.json',
    '/api/blog',
    './php/get_posts.php',
    './data/blog.json',
    './blog.json',
    './blog/index.json'
  );

  // Utility: fetch first URL that returns 200 OK
  async function fetchFirstOk(urls) {
    const errors = [];
    for (const u of urls) {
      try {
        const res = await fetch(u, {
          credentials: 'same-origin',
          cache: 'no-cache',
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          console.info('[blog-page] loaded:', u);
          return data;
        } else {
          errors.push({ url: u, status: res.status });
        }
      } catch (err) {
        errors.push({ url: u, status: 'network', err: String(err) });
      }
    }
    console.error('[blog-page] all endpoints failed', errors);
    throw new Error('No blog endpoint returned data.');
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      // fallback for non-ISO strings
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return iso || '';
    }
  }

  function createCard(post) {
    const a = document.createElement('article');
    a.className = 'blog-card';

    const url = post.url || (post.slug ? `/blog/${post.slug}.html` : '#');
    const title = post.title || 'Untitled';
    const date = post.date ? `<time class="blog-date" datetime="${post.date}">${formatDate(post.date)}</time>` : '';
    const img = post.image ? `
      <a class="blog-thumb" href="${url}" aria-label="${title}">
        <img src="${post.image}" alt="" loading="lazy" decoding="async">
      </a>` : '';

    const excerpt = post.excerpt ? `<p class="blog-excerpt">${post.excerpt}</p>` : '';

    a.innerHTML = `
      ${img}
      <h2 class="blog-title"><a href="${url}">${title}</a></h2>
      ${date}
      ${excerpt}
      <div class="blog-actions">
        <a class="blog-readmore" href="${url}" aria-label="Read more: ${title}">Read More</a>
      </div>
    `;
    return a;
  }

  function render(posts) {
    container.setAttribute('aria-busy', 'true');
    container.innerHTML = '';

    if (!Array.isArray(posts) || posts.length === 0) {
      container.innerHTML = `<p class="blog-empty">No posts available yet.</p>`;
      container.removeAttribute('aria-busy');
      return;
    }

    // Optional: newest first
    posts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const frag = document.createDocumentFragment();
    posts.forEach(p => frag.appendChild(createCard(p)));
    container.appendChild(frag);
    container.removeAttribute('aria-busy');
  }

  // Kick it off
  fetchFirstOk(candidates)
    .then((data) => {
      // Accept either an array or { posts: [...] }
      const posts = Array.isArray(data) ? data : (Array.isArray(data.posts) ? data.posts : []);
      render(posts);
    })
    .catch((err) => {
      console.error('[blog-page] error:', err);
      container.innerHTML = `<p class="blog-error">We couldn't load blog posts right now.</p>`;
      container.removeAttribute('aria-busy');
    });
})();
