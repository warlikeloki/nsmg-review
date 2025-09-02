// /js/modules/contact.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  if (!form || !status) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Sending…";

    const btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; }

    try {
      const fd = new FormData(form);
      // Backward-compat: accept either 'topic' or 'category'
      if (fd.has("topic") && !fd.has("category")) {
        fd.set("category", fd.get("topic") || "General");
      }
      // Provide a default subject if none was supplied
      if (!fd.has("subject") || !fd.get("subject")) {
        const cat = (fd.get("category") || "General").toString();
        fd.set("subject", `Website Contact (${cat})`);
      }

      const res = await fetch("/php/submit_contact.php", {
        method: "POST",
        body: fd
      });

      const result = await res.json().catch(() => ({}));

      if (res.ok && result && result.success) {
        status.textContent = "Thank you! Your message has been sent.";
        form.reset();
      } else {
        const msg = (result && (result.error || result.message)) || `Error ${res.status}: Unable to send message.`;
        status.textContent = msg;
      }
    } catch (err) {
      console.error("Contact form error:", err);
      status.textContent = "Network error sending message.";
    } finally {
      if (btn) { btn.disabled = false; }
    }
  });
});
