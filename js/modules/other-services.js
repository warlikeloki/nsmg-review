// /js/modules/other-services.js
// Dynamically fetch and render “Other Services” from the database

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('other-services-container');
  if (!container) return;

  container.innerHTML = '<p>Loading services…</p>';

  fetch('/php/get_other_services.php')
    .then(res => {
      if (!res.ok) throw new Error(`Network error: ${res.status}`);
      return res.json();
    })
    .then(json => {
      if (!json.success || !Array.isArray(json.data)) {
        throw new Error('Invalid data format.');
      }
      renderOtherServices(json.data, container);
    })
    .catch(err => {
      console.error('Other Services load error:', err);
      container.innerHTML = '<p>Unable to load services at this time.</p>';
    });
});

/**
 * Render an array of {id, title, description} into the container
 */
function renderOtherServices(items, container) {
  container.innerHTML = ''; // clear loading text

  if (items.length === 0) {
    container.innerHTML = '<p>No “Other Services” found.</p>';
    return;
  }

  const ul = document.createElement('ul');
  ul.classList.add('other-services-list');

  items.forEach(item => {
    const li = document.createElement('li');
    li.classList.add('other-service-item');

    const titleEl = document.createElement('strong');
    titleEl.textContent = item.title;
    li.appendChild(titleEl);

    const descEl = document.createElement('span');
    descEl.textContent = ` – ${item.description}`;
    li.appendChild(descEl);

    ul.appendChild(li);
  });

  container.appendChild(ul);
}
