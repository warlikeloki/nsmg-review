document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("equipment-list");
  if (!container) return;

  const pageCategory = container.getAttribute("data-category"); // Optional filter

  fetch("/json/equipment.json")
    .then(res => {
      if (!res.ok) throw new Error("Failed to load equipment list");
      return res.json();
    })
    .then(items => {
      // Optionally filter by page category (e.g. photography)
      const filtered = pageCategory
        ? items.filter(item => item.type.includes(pageCategory))
        : items;

      if (filtered.length === 0) {
        container.innerHTML = "<p>No equipment listed for this category.</p>";
        return;
      }

      // Group items by category
      const grouped = {};
      filtered.forEach(item => {
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
        header.textContent = capitalize(category);
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

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
});

window.loadEquipment = function () {
  const container = document.getElementById("equipment-list");
  if (!container) return;
  const pageCategory = container.getAttribute("data-category");

  fetch("/json/equipment.json")
    .then(res => res.json())
    .then(items => {
      const filtered = pageCategory
        ? items.filter(i => i.type.includes(pageCategory))
        : items;

      const grouped = {};
      filtered.forEach(i => {
        const key = i.category || "Other";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(i);
      });

      container.innerHTML = '';
      for (const [cat, group] of Object.entries(grouped)) {
        const section = document.createElement("section");
        const title = document.createElement("h3");
        title.textContent = cat;
        const ul = document.createElement("ul");
        group.forEach(item => {
          const li = document.createElement("li");
          li.textContent = item.name;
          ul.appendChild(li);
        });
        section.appendChild(title);
        section.appendChild(ul);
        container.appendChild(section);
      }
    });
};
