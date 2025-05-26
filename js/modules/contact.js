document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Sending...";

    const formData = new FormData(form);

    try {
      const response = await fetch("/php/contact_form.php", {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        status.textContent = "Thank you! Your message has been sent.";
        form.reset();
      } else {
        status.textContent = "Oops! Something went wrong.";
      }
    } catch (error) {
      status.textContent = "Error sending message.";
      console.error("Contact form error:", error);
    }
  });
});
