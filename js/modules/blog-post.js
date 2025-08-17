// /js/modules/blog-post.js
document.addEventListener('DOMContentLoaded', async () => {
  const el = document.getElementById('blog-post-content'); if (!el) return;
  const id = parseInt(new URLSearchParams(window.location.search).get('id'), 10);
  if (Number.isNaN(id) || id < 0) { el.innerHTML = '<p>Invalid post ID.</p>'; return; }
  async function fetchPosts() {
    try { const r = await fetch('/php/get_posts.php'); if (r.ok) { const j = await r.json(); if (j?.success && Array.isArray(j.data)) return j.data; } } catch {}
    try { const r = await fetch('/json/posts.json'); if (r.ok) { const arr = await r.json(); if (Array.isArray(arr)) return arr; } } catch {}
    return null;
  }
  try {
    const posts = await fetchPosts(); if (!posts || !posts[id]) { el.innerHTML = '<p>Post not found.</p>'; return; }
    const post = posts[id]; const hasPrev = id > 0; const hasNext = id < posts.length - 1;
    el.innerHTML = `
      <a href="/blog.html" class="back-link">&larr; Back to Blog</a>
      <h1>${post.title || "Untitled Post"}</h1>
      <p class="meta-info">By ${post.author || "NSMG"} &bull; ${post.date ? new Date(post.date).toLocaleDateString() : ""}</p>
      <div class="post-content">${post.content || ""}</div>
      <div class="blog-post-nav">
        ${hasPrev ? `<a href="/blog-post.html?id=${id - 1}" class="nav-link prev-post">&larr; Previous Post</a>` : ""}
        ${hasNext ? `<a href="/blog-post.html?id=${id + 1}" class="nav-link next-post">Next Post &rarr;</a>` : ""}
      </div>`;
  } catch (e) { console.error('Blog post load error:', e); el.innerHTML = '<p>Error loading post.</p>'; }
});
