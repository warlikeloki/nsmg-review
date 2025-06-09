// /js/modules/homepage.js

// Only run on the homepage
if (document.getElementById('homepage')) {
  // 1. Load Services Preview
  fetch('/php/get_services.php?limit=4')
    .then(r => r.json())
    .then(({ success, data }) => {
      if (success && Array.isArray(data)) {
        const container = document.querySelector('.services-cards');
        container.innerHTML = data.map(service => `
          <div class="service-card">
            <img src="${service.icon || '/images/default-service.png'}" alt="${service.name} Icon" class="service-icon">
            <h3>${service.name}</h3>
            <p>${service.description}</p>
            <a href="/services.html#${service.name.toLowerCase().replace(/\s/g, '-')}" class="service-link">Learn More</a>
          </div>
        `).join('');
      }
    })
    .catch(() => {
      document.querySelector('.services-cards').innerHTML =
        `<div>Service info unavailable right now.</div>`;
    });

  // 2. Load Testimonials Carousel
  fetch('/php/get_testimonials.php?limit=5')
    .then(r => r.json())
    .then(({ success, data }) => {
      if (success && Array.isArray(data)) {
        const slider = document.querySelector('.testimonials-slider');
        slider.innerHTML = data.map(t => `
          <div class="testimonial-card">
            <blockquote>${t.text.length > 120 ? t.text.slice(0, 120) + '…' : t.text}</blockquote>
            <cite>– ${t.author}</cite>
          </div>
        `).join('');
      }
    })
    .catch(() => {
      document.querySelector('.testimonials-slider').innerHTML =
        `<div>No testimonials found.</div>`;
    });

  // 3. Load Portfolio Preview
  fetch('/php/get_portfolio.php?limit=3')
    .then(r => r.json())
    .then(({ success, data }) => {
      if (success && Array.isArray(data)) {
        const thumbs = document.querySelector('.portfolio-thumbnails');
        thumbs.innerHTML = data.map(item => `
          <a href="/portfolio.html#${item.id}" class="portfolio-thumb">
            <img src="${item.image}" alt="${item.title || 'Portfolio item'}">
          </a>
        `).join('');
      }
    })
    .catch(() => {
      document.querySelector('.portfolio-thumbnails').innerHTML =
        `<div>Portfolio preview unavailable.</div>`;
    });

  // 4. Load Latest Blog Post
  fetch('/php/get_posts.php?limit=1')
    .then(r => r.json())
    .then(({ success, data }) => {
      if (success && Array.isArray(data) && data.length) {
        const post = data[0];
        document.querySelector('.blog-post-preview').innerHTML = `
          <article>
            <h3>${post.title}</h3>
            <p>${post.teaser || (post.content ? post.content.slice(0, 160) + '…' : '')}</p>
            <a href="/blog-post.html?id=${post.id}" class="blog-link">Read More</a>
          </article>
        `;
      }
    })
    .catch(() => {
      document.querySelector('.blog-post-preview').innerHTML =
        `<div>No blog posts found.</div>`;
    });
}

// Optionally: Export functions for testing or further development
export {};
