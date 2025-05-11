// Fetch and display testimonials from testimonials.json
document.addEventListener("DOMContentLoaded", () => {
    fetch("/json/testimonials.json")
        .then(response => response.json())
        .then(testimonials => {
            const container = document.getElementById("testimonials-container");
            container.innerHTML = "";

            if (testimonials.length === 0) {
                container.innerHTML = "<p>No testimonials available at this time.</p>";
                return;
            }

            testimonials.forEach(testimonial => {
                const card = document.createElement("div");
                card.classList.add("testimonial-card");
                card.innerHTML = `
                    <p class="testimonial-message">"${testimonial.message}"</p>
                    <p class="testimonial-name">- ${testimonial.name}</p>
                `;
                container.appendChild(card);
            });
        })
        .catch(error => {
            console.error("Error loading testimonials:", error);
            document.getElementById("testimonials-container").innerHTML = "<p>Error loading testimonials. Please try again later.</p>";
        });
});
