// /js/modules/contact.js
// ES module for the Contact form.
// Expected usage in main.js:
//   import { initContactForm } from './modules/contact.js';
//   initContactForm();

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

export async function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const statusEl = document.getElementById('contact-status');
  const fallbackEl = document.getElementById('contact-fallback');

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
