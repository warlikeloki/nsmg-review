// /js/modules/service-request.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('service-request-form');
  const statusDiv = document.getElementById('request-status');
  const svcContainer = document.getElementById('service-types');

  if (!form || !statusDiv || !svcContainer) return;

  const showMessage = (msg, isError = false) => {
    statusDiv.textContent = msg;
    statusDiv.className = isError ? 'form-error' : 'form-success';
  };

  async function loadServices() {
    svcContainer.innerHTML = '<p>Loading services…</p>';
    try {
      const res = await fetch('/php/get_services.php'); // can use ?is_package=0 if needed
      const json = await res.json();
      if (!json?.success || !Array.isArray(json.data)) {
        throw new Error(json?.error || 'Invalid response');
      }
      const data = json.data;
      if (!data.length) {
        svcContainer.innerHTML = '<p>No services available.</p>';
        return;
      }
      svcContainer.innerHTML = data.map(s => `
        <label class="svc-option">
          <input type="checkbox" name="services[]" value="${s.name}">
          <span>${s.name}${s.price != null ? ` — $${Number(s.price).toFixed(2)}` : ''}</span>
        </label>
      `).join('');
    } catch (e) {
      console.error(e);
      svcContainer.innerHTML = '<p>Unable to load services.</p>';
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMessage('Submitting…');
    form.querySelector('button[type="submit"]').disabled = true;

    try {
      const res = await fetch('/php/submit_service_request.php', {
        method: 'POST',
        body: new FormData(form)
      });
      const result = await res.json();
      if (result.success) {
        showMessage('Thank you! Your service request has been submitted.');
        form.reset();
        await loadServices();
      } else {
        showMessage(result.error || result.message || 'Failed to submit request.', true);
      }
    } catch (err) {
      console.error('Submission error:', err);
      showMessage('Error sending request.', true);
    } finally {
      form.querySelector('button[type="submit"]').disabled = false;
    }
  });

  loadServices();
});
