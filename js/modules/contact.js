// /js/modules/contact.js
// Handles Issue #47: Contact Form Integration

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");

  // Only proceed if form and status elements are present
  if (!form || !status) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    status.textContent = "Sending...";

    const data = new FormData(form);
    try {
      const res = await fetch("/php/contact_form.php", {
        method: "POST",
        body: data
      });
      const result = await res.json();

      if (result.success) {
        status.textContent = "Thank you! Your message has been sent.";
        form.reset();
      } else {
        status.textContent = result.message || "Oops! Something went wrong.";
      }
    } catch (err) {
      console.error("Contact form error:", err);
      status.textContent = "Error sending message.";
    }
  });
});
