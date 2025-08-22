// /js/modules/contact.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  if (!form || !status) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Sending…";

    try {
      const res = await fetch("/php/submit_contact.php", {
        method: "POST",
        body: new FormData(form)
      });
      const result = await res.json();

      if (result.success) {
        status.textContent = "Thank you! Your message has been sent.";
        form.reset();
      } else {
        status.textContent = result.error || result.message || "Oops! Something went wrong.";
      }
    } catch (err) {
      console.error("Contact form error:", err);
      status.textContent = "Error sending message.";
    }
  });
});
