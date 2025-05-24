document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("service-request-form");
  const status = document.getElementById("request-status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Sending...";

    const formData = new FormData(form);

    try {
      const response = await fetch("/php/service_request.php", {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        status.textContent = "Thank you! Your request has been submitted.";
        form.reset();
      } else {
        status.textContent = "There was a problem submitting your request.";
      }
    } catch (error) {
      status.textContent = "Error sending request.";
      console.error("Service request error:", error);
    }
  });
});
