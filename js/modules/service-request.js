// /js/modules/service-request.js
// ES module for the Service Request form.
// Expected usage in main.js:
//   import { initServiceRequestForm } from './modules/service-request.js';
//   initServiceRequestForm();

let csrfToken = null;

async function fetchCSRFToken() {
  try {
    const res = await fetch('/php/get_csrf_token.php');
    const json = await res.json();
    if (json.ok && json.token) {
      csrfToken = json.token;
      return true;
    }
  } catch (err) {
    console.error('Failed to fetch CSRF token:', err);
  }
  return false;
}

export async function initServiceRequestForm() {
  const form = document.getElementById('service-request-form');
  if (!form) return;

  const statusEl = document.getElementById('service-request-status');
  const fallbackEl = document.getElementById('service-request-fallback');

  // Fetch CSRF token on load
  await fetchCSRFToken();

  function setStatus(msg, ok = true) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.toggle('ok', !!ok);
    statusEl.classList.toggle('err', !ok);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('Sending...', true);

    // Refresh CSRF token if needed
    if (!csrfToken) {
      await fetchCSRFToken();
    }

    const data = new FormData(form);
    if (!data.has('website')) data.append('website', ''); // honeypot
    if (csrfToken) data.append('csrf_token', csrfToken); // CSRF protection

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
        // Refresh CSRF token after successful submission
        await fetchCSRFToken();
      } else {
        // Handle specific error cases
        if (res.status === 403) {
          setStatus('Security token expired. Please try again.', false);
          await fetchCSRFToken(); // Refresh token
        } else if (res.status === 429) {
          setStatus(json.error || 'Too many submissions. Please wait before trying again.', false);
        } else {
          setStatus('Email delivery failed. A direct email link is available below.', false);
          if (fallbackEl && json.data && json.data.mailto) {
            fallbackEl.innerHTML = `<a href="${json.data.mailto}">Email us directly</a>`;
            fallbackEl.hidden = false;
          }
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
