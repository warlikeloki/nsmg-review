// /js/modules/blog.js
// Dynamically fetch and render blog posts on the public blog page, with null-check guards

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("blog-posts-container");
  if (!container) return; // guard if element is missing

  try {
    const response = await fetch("/php/get_posts.php");
    if (!response.ok) {
      throw new Error(`Network error: ${response.status}`);
    }

    const json = await response.json();
    if (!json.success || !Array.isArray(json.data)) {
      throw new Error("Invalid data format from server.");
    }

    const posts = json.data;
    if (posts.length === 0) {
      container.innerHTML = "<p>No blog posts available at the moment.</p>";
      return;
    }

    container.innerHTML = posts.map((post, index) => `
      <article class="blog-post-card">
        <h2 class="blog-post-title">${post.title}</h2>
        <p class="blog-post-meta">By ${post.author} &bull; ${new Date(post.date).toLocaleDateString()}</p>
        <p class="blog-post-teaser">${post.teaser}</p>
        <a href="/blog-post.html?id=${index}" class="read-more">Read More</a>
      </article>
    `).join("");

  } catch (err) {
    console.error('Blog load error:', err);
    container.innerHTML = "<p>Unable to load blog posts at this time.</p>";
  }
});
