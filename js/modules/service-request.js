// service-request.js
// Handles NSM-29: Request Service Form Bug Fix

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('service-request-form');
  const statusDiv = document.getElementById('request-status');
  const svcContainer = document.getElementById('service-types');

  if (!form || !statusDiv || !svcContainer) return;

  // Show message in statusDiv
  function showMessage(msg, isError = false) {
    statusDiv.textContent = msg;
    statusDiv.className = isError ? 'form-error' : 'form-success';
  }

  // 1) Load services and build checkboxes
  async function loadServices() {
    svcContainer.innerHTML = '<p>Loading services…</p>';
    try {
      let res = await fetch('/php/get_services.php');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let data = await res.json();

      svcContainer.innerHTML = '';
      if (Array.isArray(data) && data.length) {
        data.forEach(svc => {
          const id = `svc-${svc.slug || svc.service.toLowerCase().replace(/\s+/g,'-')}`;
          const wrapper = document.createElement('label');
          wrapper.innerHTML = `
            <input type="checkbox"
                   id="${id}"
                   name="services[]"
                   value="${svc.slug || svc.service}"
            />
            ${svc.service}
          `;
          svcContainer.appendChild(wrapper);
        });
      } else {
        // fallback
        svcContainer.innerHTML = `
          <label>
            <input type="checkbox" name="services[]" value="General Inquiry" checked />
            General Inquiry
          </label>`;
      }
    } catch (err) {
      console.error('Error loading services:', err);
      svcContainer.innerHTML = `
        <label>
          <input type="checkbox" name="services[]" value="General Inquiry" checked />
          General Inquiry
        </label>`;
    }
  }

  // 2) Form submission
  form.addEventListener('submit', async e => {
    e.preventDefault();
    statusDiv.textContent = '';
    // Validate one service selected
    const checked = form.querySelectorAll('input[name="services[]"]:checked');
    if (checked.length === 0) {
      showMessage('Please select at least one service.', true);
      return;
    }
    // Standard HTML5 check
    if (!form.checkValidity()) {
      showMessage('Please fill in all required fields correctly.', true);
      return;
    }

    showMessage('Sending…');
    form.querySelector('button[type="submit"]').disabled = true;

    const payload = new FormData(form);
    try {
      const res = await fetch('/php/service_request.php', {
        method: 'POST',
        body: payload
      });
      const result = await res.json();
      if (result.success) {
        showMessage('Thank you! Your service request has been submitted.');
        form.reset();
        await loadServices();
      } else {
        showMessage(result.message || 'Failed to submit request.', true);
      }
    } catch (err) {
      console.error('Submission error:', err);
      showMessage('Error sending request.', true);
    } finally {
      form.querySelector('button[type="submit"]').disabled = false;
    }
  });

  // initialize
  loadServices();
});
