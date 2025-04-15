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