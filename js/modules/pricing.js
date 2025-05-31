// File: /js/pricing.js

/**
 * pricing.js
 *
 * This module fetches pricing data from the server and dynamically populates
 * the <div id="pricing-container"> in pricing.html. It assumes main.js already
 * imports this file (e.g., `import './pricing.js';`) and that pricing.html
 * contains a <div id="pricing-container"></div>.
 *
 * Expected JSON structure from /php/get_pricing.php:
 * [
 *   {
 *     "id": 1,
 *     "name": "Event Photography - Hourly Rate",
 *     "description": "Weddings, Parties, Corporate Events",
 *     "unit": "per hour",
 *     "is_package": 0,
 *     "price": "175.00"
 *   },
 *   {
 *     "id": 2,
 *     "name": "Event Photography - Basic Package",
 *     "description": "4 hr coverage; ~100 edited images; online gallery",
 *     "unit": null,
 *     "is_package": 1,
 *     "price": "900.00"
 *   },
 *   // …etc…
 * ]
 */

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('pricing-container');
  if (!container) {
    console.error('pricing.js: #pricing-container not found in the DOM.');
    return;
  }

  // Show a loading message while fetching
  container.innerHTML = '<p>Loading pricing…</p>';

  fetch('/php/get_pricing.php')
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Network response was not OK (${response.status})`);
      }
      return response.json();
    })
    .then((data) => {
      // Ensure is_package is a boolean
      data.forEach((item) => {
        item.is_package = Boolean(item.is_package);
      });
      renderPricing(data, container);
    })
    .catch((error) => {
      console.error('pricing.js: Failed to load pricing data:', error);
      container.innerHTML = `
        <p class="error">
          Sorry, we couldn’t load our pricing list at the moment. Please try again later.
        </p>`;
    });
});

/**
 * Groups services by category (prefix before " - " in `name`),
 * then appends headings and <ul>/<li> items into the container.
 *
 * @param {Array<Object>} servicesArray - Array of service objects.
 * @param {HTMLElement} container - The <div id="pricing-container"> element.
 */
function renderPricing(servicesArray, container) {
  // Group by category (text before first " - ")
  const categories = servicesArray.reduce((acc, svc) => {
    const [rawCategory] = svc.name.split(' - ', 1);
    const category = rawCategory.trim();
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(svc);
    return acc;
  }, {});

  // Create a document fragment to minimize reflows
  const fragment = document.createDocumentFragment();

  // Sort category names alphabetically
  const sortedCategories = Object.keys(categories).sort((a, b) =>
    a.localeCompare(b)
  );

  sortedCategories.forEach((categoryName) => {
    // Create and append <h2> for this category
    const heading = document.createElement('h2');
    heading.textContent = categoryName;
    heading.classList.add('pricing-category-heading');
    fragment.appendChild(heading);

    // Create the <ul> for items under this category
    const list = document.createElement('ul');
    list.classList.add('pricing-list');

    // Sort items: packages first, then by name
    const items = categories[categoryName].sort((a, b) => {
      if (a.is_package && !b.is_package) return -1;
      if (!a.is_package && b.is_package) return 1;
      return a.name.localeCompare(b.name);
    });

    items.forEach((svc) => {
      const li = document.createElement('li');
      li.classList.add('pricing-item');

      // Display name: remove prefix "Category - " so only the suffix remains
      const displayNameParts = svc.name.split(' - ');
      const displayName =
        displayNameParts.length > 1
          ? displayNameParts.slice(1).join(' - ').trim()
          : svc.name;

      const titleEl = document.createElement('strong');
      titleEl.textContent = displayName;
      li.appendChild(titleEl);

      // Build price string: e.g. "$175.00 / per hour"
      let priceText = `$${parseFloat(svc.price).toFixed(2)}`;
      if (svc.unit) {
        priceText += ` / ${svc.unit}`;
      }

      const priceEl = document.createElement('span');
      priceEl.classList.add('pricing-price');
      priceEl.textContent = ` – ${priceText}`;
      li.appendChild(priceEl);

      // If description is present, append a <div> for it
      if (svc.description) {
        const descEl = document.createElement('div');
        descEl.classList.add('pricing-desc');
        descEl.textContent = svc.description;
        li.appendChild(descEl);
      }

      list.appendChild(li);
    });

    fragment.appendChild(list);
  });

  // Clear any existing content and append the new fragment
  container.innerHTML = '';
  container.appendChild(fragment);
}
