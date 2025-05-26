/**
 * navigation.js
 * – Highlights the active nav link
 * – Toggles mobile menu open/closed (using .hamburger + .nav-menu.active)
 * – Toggles sub-menus on mobile (using .dropdown.active)
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
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

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

  // 4. Sub-menu toggle (mobile only)
  const dropdowns = document.querySelectorAll('.nav-menu > li > .dropdown');
  dropdowns.forEach(drop => {
    const parentLink = drop.previousElementSibling; 
    parentLink.setAttribute('aria-expanded', 'false');
    parentLink.addEventListener('click', e => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const open = drop.classList.toggle('active');
        parentLink.setAttribute('aria-expanded', String(open));
      }
    });
  });
});
