// /js/modules/services-nav.js
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('services-toggle');
  const nav    = document.getElementById('services-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('active');
    toggle.setAttribute('aria-expanded', isOpen);
  });
    // Close the nav when any service button is clicked
  const buttons = nav.querySelectorAll('.admin-button');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('NSM-85: service selected, closing nav');
      nav.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
});

