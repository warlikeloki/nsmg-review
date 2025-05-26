// testimonials.js

document.addEventListener("DOMContentLoaded", () => {
    const fullTestimonialsContainer = document.getElementById("testimonials-container");
    const homepageTestimonialsContainer = document.getElementById("homepage-testimonials-container");
    const CHARACTER_LIMIT = 100;
    const HOMEPAGE_TESTIMONIALS_COUNT = 10;
    let currentIndex = 0;

    // Fetch testimonials from JSON file
    async function loadTestimonials() {
        try {
            const response = await fetch("/json/testimonials.json");
            if (!response.ok) throw new Error("Failed to load testimonials.json");
            const testimonials = await response.json();

            // Render full testimonials page
            if (fullTestimonialsContainer) {
                renderFullTestimonials(testimonials, fullTestimonialsContainer);
            }

            // Render homepage testimonials slideshow
            if (homepageTestimonialsContainer) {
                renderHomepageTestimonials(testimonials.slice(0, HOMEPAGE_TESTIMONIALS_COUNT));
            }

        } catch (error) {
            console.error("Error loading testimonials:", error);
        }
    }

    // Render full testimonials page
    function renderFullTestimonials(testimonials, container) {
    container.innerHTML = testimonials.map((testimonial, i) => {
        const fullMessage = testimonial.message;
        const teaser = fullMessage.length > CHARACTER_LIMIT
            ? fullMessage.substring(0, CHARACTER_LIMIT).trim() + "..."
            : fullMessage;
        const needsReadMore = fullMessage.length > CHARACTER_LIMIT;

        return `
            <div class="testimonial-card" data-index="${i}">
                <p class="testimonial-message">
                    <span class="testimonial-teaser">${teaser}</span>
                    <span class="testimonial-full" style="display: none;">${fullMessage}</span>
                </p>
                <div class="testimonial-name">${testimonial.name}</div>
                ${needsReadMore ? `<button class="read-more" aria-expanded="false">Read More</button>` : ""}
            </div>
        `;
    }).join("");

    // Attach click event listeners for 'Read More' buttons
    container.querySelectorAll(".read-more").forEach(button => {
        button.addEventListener("click", () => {
            const card = button.closest(".testimonial-card");
            const teaser = card.querySelector(".testimonial-teaser");
            const full = card.querySelector(".testimonial-full");

            const expanded = button.getAttribute("aria-expanded") === "true";
            button.setAttribute("aria-expanded", !expanded);
            button.textContent = expanded ? "Read More" : "Read Less";
            teaser.style.display = expanded ? "inline" : "none";
            full.style.display = expanded ? "none" : "inline";
        });
    });
}


    // Render homepage testimonials as a slideshow
    function renderHomepageTestimonials(testimonials) {
    const slides = testimonials.map((testimonial, index) => {
        const fullMessage = testimonial.message;
        const teaser = fullMessage.length > CHARACTER_LIMIT
            ? fullMessage.substring(0, CHARACTER_LIMIT).trim() + "..."
            : fullMessage;
        const needsReadMore = fullMessage.length > CHARACTER_LIMIT;

        return `
            <div class="testimonial-slide" data-index="${index}">
                <p class="testimonial-message">
                    <span class="testimonial-teaser">${teaser}</span>
                    <span class="testimonial-full" style="display: none;">${fullMessage}</span>
                </p>
                <div class="testimonial-name">– ${testimonial.name}</div>
                ${needsReadMore ? `<button class="read-more" aria-expanded="false">Read More</button>` : ""}
            </div>
        `;
    });

    // Add the "View All" card
    slides.push(`
        <div class="testimonial-slide view-all" data-index="${slides.length}">
            <a href="/testimonials.html" class="view-all-link">View All Testimonials</a>
        </div>
    `);

    homepageTestimonialsContainer.innerHTML = slides.join("");
    updateSlideVisibility();

    // Read More toggle
    homepageTestimonialsContainer.querySelectorAll(".read-more").forEach(button => {
        button.addEventListener("click", () => {
            const card = button.closest(".testimonial-slide");
            const teaser = card.querySelector(".testimonial-teaser");
            const full = card.querySelector(".testimonial-full");

            const expanded = button.getAttribute("aria-expanded") === "true";
            button.setAttribute("aria-expanded", !expanded);
            button.textContent = expanded ? "Read More" : "Read Less";
            teaser.style.display = expanded ? "inline" : "none";
            full.style.display = expanded ? "none" : "inline";
        });
    });
}



    // Update slide visibility for homepage slider
    function updateSlideVisibility() {
    const slides = document.querySelectorAll(".testimonial-slide");
    slides.forEach((slide, index) => {
        slide.style.display = index === currentIndex ? "block" : "none";
    });
}

const prevButton = document.getElementById("testimonial-prev");
const nextButton = document.getElementById("testimonial-next");

if (prevButton && nextButton) {
    prevButton.addEventListener("click", () => {
        const slides = document.querySelectorAll(".testimonial-slide");
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateSlideVisibility();
    });

    nextButton.addEventListener("click", () => {
        const slides = document.querySelectorAll(".testimonial-slide");
        currentIndex = (currentIndex + 1) % slides.length;
        updateSlideVisibility();
    });
}


    // Initial load
    loadTestimonials();
});
