// hamburger.js
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