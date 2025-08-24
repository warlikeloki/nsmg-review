/* NSM-75: Homepage services preview module
 * - Dynamically fetches services and renders cards
 * - Graceful fallback + robust error handling
 */

(function () {
  "use strict";

  // Only run on pages that include the services section / or homepage marker
  function shouldRun() {
    return (
      document.getElementById("homepage") !== null ||
      document.querySelector(".services-cards") !== null ||
      document.querySelector("#services-preview .services-cards") !== null
    );
  }

  // Simple timeout wrapper for fetch
  function fetchWithTimeout(resource, options) {
    if (options === void 0) options = {};
    var timeout = typeof options.timeout === "number" ? options.timeout : 10000; // 10s default
    var controller = new AbortController();
    var id = setTimeout(function () { controller.abort(); }, timeout);
    var finalOpts = {};
    // Copy options without mutating the original object
    for (var k in options) {
      if (Object.prototype.hasOwnProperty.call(options, k) && k !== "timeout") {
        finalOpts[k] = options[k];
      }
    }
    finalOpts.signal = controller.signal;
    return fetch(resource, finalOpts).finally(function () {
      clearTimeout(id);
    });
  }

  function renderServices(container, services) {
    if (!Array.isArray(services) || services.length === 0) {
      container.innerHTML = '<div class="services-empty-msg">No services available at the moment. Please check back later.</div>';
      return;
    }

    var cardsHtml = services.map(function (s) {
      var name = s.name || s.title || "Service";
      var desc = s.description || s.teaser || "Learn more about this service.";
      var icon = s.icon || "/images/default-service.png"; // adjust if you have a different default
      var link = s.link || "/services.html";

      return (
        '<article class="service-card" tabindex="0">' +
          '<img src="' + icon + '" alt="' + name + ' Icon" class="service-icon" decoding="async" loading="lazy" />' +
          '<h3 class="service-title">' + name + "</h3>" +
          '<p class="service-desc">' + desc + "</p>" +
          '<a href="' + link + '" class="service-link" aria-label="Learn more about ' + name + '">Learn More</a>' +
        "</article>"
      );
    }).join("");

    container.innerHTML = cardsHtml;
  }

  function showError(container, msg) {
    container.innerHTML = '<div class="services-error-msg">' + msg + "</div>";
  }

  async function loadServices(limit) {
    if (typeof limit !== "number") limit = 6;

    var container =
      document.querySelector("#services-preview .services-cards") ||
      document.querySelector(".services-cards");

    if (!container) {
      console.warn("NSM-75: .services-cards container not found on this page.");
      return;
    }

    // Show a temporary loading state
    container.innerHTML = '<div class="services-loading">Loading services...</div>';

    try {
      var resp = await fetchWithTimeout("/php/get_services.php?limit=" + encodeURIComponent(limit), {
        timeout: 12000,
        headers: { "Accept": "application/json" },
        cache: "no-store"
      });

      if (!resp.ok) {
        throw new Error("HTTP " + resp.status);
      }

      var payload = await resp.json();
      var services = Array.isArray(payload) ? payload : (payload && payload.data) || [];

      renderServices(container, services);
    } catch (err) {
      console.error("NSM-75: Failed to load services:", err);
      showError(
        container,
        "We are having trouble loading services right now. Please refresh the page or try again later."
      );
    }
  }

  // Init
  if (shouldRun()) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { loadServices(6); });
    } else {
      loadServices(6);
    }
  }
})();