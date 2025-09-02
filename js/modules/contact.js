// /js/modules/contact.js
// Robust attach: works whether the module loads before or after DOMContentLoaded.

(function initContactModule() {
  const BOUND_FLAG = 'data-contact-bound';

  function setStatus(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const status = document.getElementById('form-status');
    setStatus(status, 'Sending…');

    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    try {
      const fd = new FormData(form);

      // Default subject if none set server-side
      if (!fd.has('subject') || !fd.get('subject')) {
        const cat = (fd.get('category') || 'General') + '';
        fd.set('subject', `Website Contact (${cat})`);
      }

      const res = await fetch('/php/submit_contact.php', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin'
      });

      let result = {};
      try { result = await res.json(); } catch (_) {}

      if (res.ok && result && result.success) {
        setStatus(status, 'Thank you! Your message has been sent.');
        form.reset();
        // Optional: hide the form after success
        // form.style.display = 'none';
      } else {
        const msg = (result && (result.error || result.message)) || `Error ${res.status || ''}: Unable to send message.`;
        setStatus(status, msg);
      }
    } catch (err) {
      console.error('Contact form error:', err);
      setStatus(status, 'Network error sending message.');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function bind() {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');
    if (!form || !status) return false;
    if (form.getAttribute(BOUND_FLAG) === '1') return true;

    form.addEventListener('submit', handleSubmit);
    form.setAttribute(BOUND_FLAG, '1');
    return true;
  }

  // Try now; if elements aren’t present yet, bind on DOMContentLoaded
  if (!bind()) {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  }
})();
