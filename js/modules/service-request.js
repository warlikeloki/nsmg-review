// /js/modules/service-request.js
// Handles Issue #47: Service Request Form Integration

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("service-request-form");
  const status = document.getElementById("request-status");

  // Only proceed if form and status elements are present
  if (!form || !status) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    status.textContent = "Sending...";

    const data = new FormData(form);
    try {
      const res = await fetch("/php/service_request.php", {
        method: "POST",
        body: data
      });
      const result = await res.json();

      if (result.success) {
        status.textContent = "Thank you! Your request has been submitted.";
        form.reset();
      } else {
        status.textContent = result.message || "There was a problem submitting your request.";
      }
    } catch (err) {
      console.error("Service request error:", err);
      status.textContent = "Error sending request.";
    }
  });
});
