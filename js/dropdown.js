// dropdown.js
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