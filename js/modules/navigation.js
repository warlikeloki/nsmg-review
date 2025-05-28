/**
 * navigation.js
 * – Highlights the active nav link
 * – Toggles mobile menu open/closed
 * – Toggles one mobile submenu at a time with slide animation
 */
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const navMenu   = document.querySelector('.nav-menu');
  const links     = document.querySelectorAll('.nav-menu > li > a');

  // 1. Active-link highlighting
  const current = window.location.pathname.replace(/\/$/, '');
  links.forEach(link => {
    const target = new URL(link.href).pathname.replace(/\/$/, '');
    if (target === current) link.classList.add('active');
  });

  // 2. Mobile menu toggle
  if (hamburger && navMenu) {
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('active');
      hamburger.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // 3. Close menu on outside click
  document.addEventListener('click', e => {
    if (
      navMenu.classList.contains('active') &&
      !navMenu.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      navMenu.classList.remove('active');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });

  // 4. Sub-menu toggle (mobile only), one open at a time
  const dropdowns = document.querySelectorAll('.nav-menu > li > .dropdown');
  dropdowns.forEach(drop => {
    const parentLink = drop.previousElementSibling;
    parentLink.setAttribute('aria-expanded', 'false');

    parentLink.addEventListener('click', e => {
      if (window.innerWidth <= 768) {
        e.preventDefault();

        // Close any other open submenu
        dropdowns.forEach(other => {
          if (other !== drop && other.classList.contains('active')) {
            other.classList.remove('active');
            other.previousElementSibling.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle this one
        const isOpen = drop.classList.toggle('active');
        parentLink.setAttribute('aria-expanded', String(isOpen));
      }
    });
  });
});
