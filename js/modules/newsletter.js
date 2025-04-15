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
});