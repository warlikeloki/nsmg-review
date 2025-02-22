// Blog Posts
const blogPosts = [
    {
        title: "First Blog Post",
        date: "February 18, 2025",
        content: "This is my first blog post. Welcome to my blog!"
    },
    {
        title: "Second Blog Post",
        date: "February 19, 2025",
        content: "This is my second blog post. More content coming soon!"
    }
];

function loadBlogPosts() {
    const container = document.getElementById("blog-container");
    
    blogPosts.forEach(post => {
        const postElement = document.createElement("article");
        postElement.innerHTML = `
            <h2>${post.title}</h2>
            <p><strong>${post.date}</strong></p>
            <p>${post.content}</p>
            <hr>
        `;
        container.appendChild(postElement);
    });
}

document.addEventListener("DOMContentLoaded", loadBlogPosts);
const blogContainer = document.getElementById("blog-container");
const blogForm = document.getElementById("blog-form");
const titleInput = document.getElementById("title");
const dateInput = document.getElementById("date");
const contentInput = document.getElementById("content");

function savePost(event) {
    event.preventDefault();
    const title = titleInput.value.trim();
    const date = dateInput.value;
    const content = contentInput.value.trim();

    if (title && date && content) {
        const newPost = { title, date, content };
        let posts = JSON.parse(localStorage.getItem("blogPosts")) || [];
        posts.push(newPost);
        localStorage.setItem("blogPosts", JSON.stringify(posts));
        blogForm.reset();
        loadBlogPosts();
    }
}

function deletePost(index) {
    let posts = JSON.parse(localStorage.getItem("blogPosts")) || [];
    posts.splice(index, 1);
    localStorage.setItem("blogPosts", JSON.stringify(posts));
    loadBlogPosts();
}

document.addEventListener("DOMContentLoaded", loadBlogPosts);
blogForm.addEventListener("submit", savePost);

async function loadBlogPosts() {
    try {
        const response = await fetch("posts.json");
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
}

document.addEventListener("DOMContentLoaded", loadBlogPosts);