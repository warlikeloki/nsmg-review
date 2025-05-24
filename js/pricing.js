document.addEventListener("DOMContentLoaded", () => {
  const packagesBody = document.getElementById("packages-body");
  const aLaCarteBody = document.getElementById("ala-carte-body");

  fetch("/php/get_pricing.php")
    .then(res => res.json())
    .then(data => {
      // Add Multi-Camera Videography option
      data.push({
        service: "Multi-Camera Videography",
        description: "Use of two cameras for comprehensive coverage",
        price: 200.00,
        unit: "per hour",
        is_package: false
      });

      const packages = data.filter(item => item.is_package);
      const alaCarte = data.filter(item => !item.is_package);

      // Render Packages
      if (packages.length) {
        packagesBody.innerHTML = packages.map(item => `
          <tr>
            <td>${item.service}</td>
            <td>${item.description || ""}</td>
            <td>${formatPrice(item.price, item.unit)}</td>
          </tr>
        `).join("");
      } else {
        packagesBody.innerHTML = `<tr><td colspan="3">No packages available.</td></tr>`;
      }

      // Render À La Carte
      if (alaCarte.length) {
        aLaCarteBody.innerHTML = alaCarte.map(item => `
          <tr>
            <td>${item.service}</td>
            <td>${item.description || ""}</td>
            <td>${formatPrice(item.price, item.unit)}</td>
          </tr>
        `).join("");
      } else {
        aLaCarteBody.innerHTML = `<tr><td colspan="3">No à la carte services available.</td></tr>`;
      }
    })
    .catch(error => {
      console.error("Error loading pricing:", error);
      packagesBody.innerHTML = `<tr><td colspan="3">Error loading pricing.</td></tr>`;
      aLaCarteBody.innerHTML = `<tr><td colspan="3">Error loading pricing.</td></tr>`;
    });

  function formatPrice(price, unit) {
    const formatted = (typeof price === "number")
      ? `$${price.toFixed(2)}`
      : price;
    return unit ? `${formatted} ${unit}` : formatted;
  }
});
