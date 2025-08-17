// /js/modules/blog.js
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("blog-posts-container");
  if (!container) return;
  async function fetchPosts() {
    try { const r = await fetch("/php/get_posts.php"); if (r.ok) { const j = await r.json(); if (j?.success && Array.isArray(j.data)) return j.data; } } catch {}
    try { const r = await fetch("/json/posts.json"); if (r.ok) { const arr = await r.json(); if (Array.isArray(arr)) return arr; } } catch {}
    return null;
  }
  try {
    const posts = await fetchPosts();
    if (!posts?.length) { container.innerHTML = "<p>No posts available yet.</p>"; return; }
    container.innerHTML = posts.map((post, i) => `
      <article class="blog-post-card">
        <h2 class="blog-post-title">${post.title || "Untitled Post"}</h2>
        <p class="blog-post-meta">By ${post.author || "NSMG"} &bull; ${post.date ? new Date(post.date).toLocaleDateString() : ""}</p>
        <p class="blog-post-teaser">${post.teaser || (post.content ? (post.content.substring(0, 160) + "…") : "")}</p>
        <a href="/blog-post.html?id=${i}" class="read-more">Read More</a>
      </article>`).join("");
  } catch (e) { console.error("Blog load error:", e); container.innerHTML = "<p>Unable to load blog posts at this time.</p>"; }
});
