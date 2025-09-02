// /js/modules/contact.js
// Attach immediately on module import (no DOMContentLoaded wrapper)

(function initContactForm() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  if (!form || !status) return;

  // Utility: set status text accessibly
  function setStatus(msg) {
    status.textContent = msg;
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("Sending…");

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const fd = new FormData(form);

      // Back-compat: if form uses name="topic", map it to "category"
      if (fd.has("topic") && !fd.has("category")) {
        const val = fd.get("topic") || "General";
        fd.set("category", val);
      }

      // Provide a default subject if none provided
      if (!fd.has("subject") || !fd.get("subject")) {
        const cat = (fd.get("category") || "General") + "";
        fd.set("subject", `Website Contact (${cat})`);
      }

      const res = await fetch("/php/submit_contact.php", {
        method: "POST",
        body: fd,
        // Note: letting the browser set the multipart/form-data boundary
        credentials: "same-origin"
      });

      // Try to parse JSON even if server doesn't send correct header
      let result = {};
      try { result = await res.json(); } catch (_) {}

      if (res.ok && result && result.success) {
        setStatus("Thank you! Your message has been sent.");
        form.reset();
        // Keep the form visible per NSM-145; change to hide if desired:
        // form.style.display = "none";
      } else {
        const msg =
          (result && (result.error || result.message)) ||
          `Error ${res.status || ""}: Unable to send message.`;
        setStatus(msg);
      }
    } catch (err) {
      console.error("Contact form error:", err);
      setStatus("Network error sending message.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
})();
