// nsmg.js

// Hamburger Menu
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');

    const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', !isExpanded);
});

document.addEventListener('click', (event) => {
    if (window.innerWidth <= 768 && navMenu.classList.contains('active') && !navMenu.contains(event.target) && !hamburger.contains(event.target)) {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', false);
    }
});

// Dropdown Menus
const dropdowns = document.querySelectorAll('.dropdown');

dropdowns.forEach(dropdown => {
    const dropdownToggle = dropdown.querySelector('a');
    const dropdownContent = dropdown.querySelector('.dropdown-content');

    dropdownToggle.addEventListener('click', (event) => {
        event.preventDefault();

        dropdowns.forEach(otherDropdown => {
            if (otherDropdown !== dropdown && otherDropdown.querySelector('.dropdown-content').style.display === 'block') {
                otherDropdown.querySelector('.dropdown-content').style.display = 'none';
            }
        });

        dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
        dropdownToggle.setAttribute('aria-expanded', dropdownContent.style.display === 'block');
    });

    document.addEventListener('click', (event) => {
        if (!dropdown.contains(event.target) && window.innerWidth > 768) {
            dropdownContent.style.display = 'none';
            dropdownToggle.setAttribute('aria-expanded', false);
        }
    });
});

// Newsletter Signup
const newsletterForm = document.querySelector('.newsletter form');

newsletterForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const emailInput = document.getElementById('email-signup');
    const email = emailInput.value;

    if (!isValidEmail(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    console.log("Email to subscribe:", email);

    fetch('/your-signup-endpoint', { // Replace with your actual endpoint
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        alert('Thank you for subscribing!');
        newsletterForm.reset();
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    });
});

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-menu a');
    const currentPath = window.location.pathname;

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');

        const normalizedCurrentPath = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;
        const normalizedLinkPath = linkPath.endsWith('/') ? linkPath.slice(0, -1) : linkPath;

        if (normalizedCurrentPath === normalizedLinkPath || (normalizedCurrentPath === '/' && normalizedLinkPath === 'index.html')) {
            link.classList.add('active');
        }
    });

// Search Functionality
document.addEventListener('DOMContentLoaded', () => {
    // ... other code ...

    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResults = document.getElementById('searchResults');

    // Search Index (REPLACE THIS WITH YOUR ACTUAL DATA)
    const pages = {
        "index.html": "Welcome to the home page.  Virginia Beach Democrats.",
        "about-us/index.html": "Learn about our officers and bylaws. About Us",
        "media/blog.html": "Read our latest blog posts. Blog",
        "voter-information/index.html": "Find voter information here. Voter Information",
        // Add more pages and their content here
    };

    searchButton.addEventListener('click', () => performSearch());

    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        searchResults.innerHTML = ""; // Clear previous results

        let resultsFound = false;

        for (const page in pages) {
            const content = pages[page].toLowerCase();
            if (content.includes(searchTerm)) {
                const resultLink = document.createElement("a");
                resultLink.href = page;
                resultLink.textContent = `Found on ${page}`;
                searchResults.appendChild(resultLink);
                results.appendChild(document.createElement("br")); // Add a line break
                resultsFound = true;
            }
        }

        if (!resultsFound) {
            const noResultsMessage = document.createElement("p");
            noResultsMessage.textContent = "No results found.";
            searchResults.appendChild(noResultsMessage);
        }
    }
});

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

