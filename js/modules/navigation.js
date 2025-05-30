/**
 * navigation.js
 * – Highlights the active nav link
 * – Toggles mobile menu open/closed
 * – Toggles one mobile submenu at a time (including collapsing the same submenu)
 */

document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const navMenu   = document.querySelector('.nav-menu');
  const links     = document.querySelectorAll('.nav-menu > li > a');

  // 1. Active-link highlighting
  const current = window.location.pathname.replace(/\/$/, '');
  links.forEach(link => {
    try {
      const target = new URL(link.href).pathname.replace(/\/$/, '');
      if (target === current) link.classList.add('active');
    } catch {
      // skip invalid URLs
    }
  });

  // only proceed if navMenu exists
  if (navMenu) {
    // 2. Mobile menu toggle
    if (hamburger) {
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', String(isOpen));
      });

      // close menu on outside click
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
    }

    // 3. Sub-menu toggle (mobile only), collapse same submenu
    const dropdowns = document.querySelectorAll('.nav-menu > li > .dropdown');
    dropdowns.forEach(drop => {
      const parentLink = drop.previousElementSibling;
      if (!parentLink) return;
      parentLink.setAttribute('aria-expanded', 'false');

      parentLink.addEventListener('click', e => {
        if (window.innerWidth <= 768) {
          e.preventDefault();

          // if clicking same parent, collapse submenu and exit
          if (drop.classList.contains('active')) {
            drop.classList.remove('active');
            parentLink.setAttribute('aria-expanded', 'false');
            return;
          }

          // close any other open submenu
          dropdowns.forEach(other => {
            if (other !== drop && other.classList.contains('active')) {
              other.classList.remove('active');
              const prev = other.previousElementSibling;
              if (prev) prev.setAttribute('aria-expanded', 'false');
            }
          });

          // open this submenu
          drop.classList.add('active');
          parentLink.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }
});
