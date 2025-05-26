document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("equipment-list");
  if (!container) return;

  const pageCategory = container.getAttribute("data-category");

  fetch(`/php/get_equipment.php?category=${encodeURIComponent(pageCategory)}`)
    .then(res => {
      if (!res.ok) throw new Error("Failed to load equipment list");
      return res.json();
    })
    .then(items => {
      if (items.length === 0) {
        container.innerHTML = "<p>No equipment listed for this category.</p>";
        return;
      }

      // Group items by category
      const grouped = {};
      items.forEach(item => {
        const key = item.category || "Uncategorized";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      });

      // Sort category names alphabetically
      const sortedCategories = Object.keys(grouped).sort();

      // Build DOM structure
      sortedCategories.forEach(category => {
        const section = document.createElement("section");
        section.className = "equipment-category";

        const header = document.createElement("h3");
        header.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        section.appendChild(header);

        const ul = document.createElement("ul");
        ul.className = "equipment-ul";

        grouped[category].forEach(item => {
          const li = document.createElement("li");
          li.className = "equipment-item";
          li.innerHTML = `
  <div class="item-header">
    <span class="toggle-icon">+</span> ${item.name}
  </div>
  <div class="item-description">${item.description || "No description available."}</div>
`;

          li.addEventListener("click", () => {
            li.classList.toggle("expanded");
            const icon = li.querySelector(".toggle-icon");
            icon.textContent = li.classList.contains("expanded") ? "−" : "+";
          });

          ul.appendChild(li);
        });

        section.appendChild(ul);
        container.appendChild(section);
      });
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = "<p>Error loading equipment list.</p>";
    });
});

window.loadEquipment = function () {
  const container = document.getElementById("equipment-list");
  if (!container) return;
  const pageCategory = container.getAttribute("data-category");

  fetch(`/php/get_equipment.php?category=${encodeURIComponent(pageCategory)}`)
    .then(res => res.json())
    .then(items => {
      if (items.length === 0) {
        container.innerHTML = "<p>No equipment listed for this category.</p>";
        return;
      }

      // Group items by category
      const grouped = {};
      items.forEach(item => {
        const key = item.category || "Uncategorized";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      });

      container.innerHTML = '';
      Object.keys(grouped).sort().forEach(category => {
        const section = document.createElement("section");
        section.className = "equipment-category";

        const title = document.createElement("h3");
        title.textContent = category.charAt(0).toUpperCase() + category.slice(1);

        const ul = document.createElement("ul");
        ul.className = "equipment-ul";

        grouped[category].forEach(item => {
          const li = document.createElement("li");
          li.className = "equipment-item";
          li.textContent = item.name;
          ul.appendChild(li);
        });

        section.appendChild(title);
        section.appendChild(ul);
        container.appendChild(section);
      });
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = "<p>Error loading equipment list.</p>";
    });
};
