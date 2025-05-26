// /js/modules/blog-post.js
// Dynamically fetch and render a single blog post based on query param

document.addEventListener('DOMContentLoaded', async () => {
  const postContainer = document.getElementById('blog-post-content');

  // Utility to read ?id= from URL
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'), 10);
  if (isNaN(id)) {
    postContainer.innerHTML = '<p>Invalid post ID.</p>';
    return;
  }

  try {
    const response = await fetch('/php/get_posts.php');
    if (!response.ok) throw new Error(`Network error: ${response.status}`);
    const json = await response.json();
    if (!json.success || !Array.isArray(json.data)) throw new Error('Invalid data');

    const posts = json.data;
    if (!posts[id]) {
      postContainer.innerHTML = '<p>Post not found.</p>';
      return;
    }

    const post = posts[id];
    const hasPrev = id > 0;
    const hasNext = id < posts.length - 1;

    postContainer.innerHTML = `
      <a href="/blog.html" class="back-link">&larr; Back to Blog</a>
      <h1>${post.title}</h1>
      <p class="meta-info">By ${post.author} &bull; ${new Date(post.date).toLocaleDateString()}</p>
      <div class="post-content">${post.content}</div>
      <div class="blog-post-nav">
        ${hasPrev ? `<a href="/blog-post.html?id=${id - 1}" class="nav-link prev-post">&larr; Previous Post</a>` : ''}
        ${hasNext ? `<a href="/blog-post.html?id=${id + 1}" class="nav-link next-post">Next Post &rarr;</a>` : ''}
      </div>
    `;
  } catch (err) {
    console.error(err);
    postContainer.innerHTML = '<p>Error loading post.</p>';
  }
});