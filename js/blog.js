// blog.js – Public Blog Viewer

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("blog-posts-container");

  fetch("/json/posts.json")
    .then(res => {
      if (!res.ok) throw new Error("Failed to load blog posts.");
      return res.json();
    })
    .then(posts => {
      if (!Array.isArray(posts)) throw new Error("Invalid blog data format.");
      renderPosts(posts);
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = "<p>Unable to load blog posts at this time.</p>";
    });

  function renderPosts(posts) {
    container.innerHTML = posts.map((post, index) => `
      <article class="blog-post-card">
        <h2 class="blog-post-title">${post.title}</h2>
        <p class="blog-post-meta">By ${post.author} &bull; ${post.date}</p>
        <p class="blog-post-teaser">${post.teaser}</p>
        <a href="/blog-post.html?id=${index}" class="read-more">Read More</a>
      </article>
    `).join("");
  }
});
