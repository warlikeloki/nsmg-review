// js/modules/blog.js

document.addEventListener("DOMContentLoaded", () => {
    const blogContainer = document.getElementById("blog-container");

    async function loadBlogPostsFromJSON() {
        if (blogContainer) {
            try {
                const response = await fetch("/json/posts.json");
                const posts = await response.json();

                blogContainer.innerHTML = "";
                posts.forEach((post) => {
                    const postElement = document.createElement("article");
                    postElement.innerHTML = `
                        <h2>${post.title}</h2>
                        <p><strong>${post.date}</strong></p>
                        <p>${post.content}</p>
                        <hr>
                    `;
                    blogContainer.appendChild(postElement);
                });
            } catch (error) {
                console.error("Error loading blog posts:", error);
            }
        } else {
            console.error("Blog container element with ID 'blog-container' not found.");
        }
    }

    loadBlogPostsFromJSON(); // Call the function to load blog posts
});

// You can remove the other blog post loading methods (static and localStorage)
// from the previous full blog.js file if you only want to fetch from JSON.
// If you need the local storage functionality for an admin interface,
// you might keep that part but ensure it's used in the appropriate context
// (e.g., an admin-specific JavaScript file or module).