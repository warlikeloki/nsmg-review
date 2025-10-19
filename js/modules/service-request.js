// /js/modules/service-request.js
// ES module for the Service Request form.
// Expected usage in main.js:
//   import { initServiceRequestForm } from './modules/service-request.js';
//   initServiceRequestForm();

export function initServiceRequestForm() {
  const form = document.getElementById('service-request-form');
  if (!form) return;

  const statusEl = document.getElementById('service-request-status');
  const fallbackEl = document.getElementById('service-request-fallback');

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
      const res = await fetch('/php/submit_service_request.php', {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      const json = await res.json();

      if (json.ok) {
        setStatus('Thanks! Your request has been sent.', true);
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
        const name = (form.querySelector('#sr-name')?.value || '').trim();
        const email = (form.querySelector('#sr-email')?.value || '').trim();
        const phone = (form.querySelector('#sr-phone')?.value || '').trim();
        const message = (form.querySelector('#sr-message')?.value || '').trim();
        const services = [...form.querySelectorAll('input[name="services[]"]:checked')].map(i => i.value).join(', ');
        const body = encodeURIComponent(
          `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nServices: ${services}\n\n${message}\n`
        );
        fallbackEl.innerHTML =
          `<a href="mailto:owner@neilsmith.org?subject=${encodeURIComponent('Service Request')}&body=${body}">Email us directly</a>`;
        fallbackEl.hidden = false;
      }
    }
  });
}
