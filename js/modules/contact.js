// /js/modules/contact.js
// ES module for the Contact form.
// Expected usage in main.js:
//   import { initContactForm } from './modules/contact.js';
//   initContactForm();

export function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const statusEl = document.getElementById('contact-status');
  const fallbackEl = document.getElementById('contact-fallback');

  function setStatus(msg, ok = true) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.toggle('ok', !!ok);
    statusEl.classList.toggle('err', !ok);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('Sending...', true);

    const data = new FormData(form);
    if (!data.has('website')) data.append('website', ''); // honeypot

    try {
      const res = await fetch('/php/submit_contact.php', {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      // Some hosts return 200 with an error payload, so always parse JSON
      const json = await res.json();

      if (json.ok) {
        setStatus('Thanks! Your message has been sent.', true);
        form.reset();
      } else {
        setStatus('Email delivery failed. A direct email link is available below.', false);
        if (fallbackEl && json.data && json.data.mailto) {
          fallbackEl.innerHTML = `<a href="${json.data.mailto}">Email us directly</a>`;
          fallbackEl.hidden = false;
        }
      }
    } catch {
      setStatus('Network error. A direct email link is available below.', false);
      if (fallbackEl) {
        const about = (form.querySelector('#ct-about')?.value || 'General').trim();
        const name = (form.querySelector('#ct-name')?.value || '').trim();
        const email = (form.querySelector('#ct-email')?.value || '').trim();
        const phone = (form.querySelector('#ct-phone')?.value || '').trim();
        const message = (form.querySelector('#ct-message')?.value || '').trim();
        const body = encodeURIComponent(
          `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${message}\n`
        );
        fallbackEl.innerHTML =
          `<a href="mailto:owner@neilsmith.org?subject=${encodeURIComponent('Website Contact — ' + about)}&body=${body}">Email us directly</a>`;
        fallbackEl.hidden = false;
      }
    }
  });
}
