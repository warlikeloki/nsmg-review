// /js/modules/settings.js
// Handles Issue #35: Website Settings Form

document.addEventListener("DOMContentLoaded", () => {
  const settingsForm = document.getElementById("settings-form");
  const siteTitleInput = document.getElementById("site-title");
  const siteDescriptionInput = document.getElementById("meta-description");
  const siteEmailInput = document.getElementById("contact-email");
  const facebookInput = document.getElementById("facebook-url");
  const instagramInput = document.getElementById("instagram-url");
  const statusEl = document.getElementById("settings-status");

  // Guard: exit if form or essential fields are missing
  if (!settingsForm || !siteTitleInput || !siteDescriptionInput || !statusEl) return;

  // Fetch existing settings from server
  function loadSettings() {
    statusEl.textContent = "Loading settings...";
    fetch('/php/get_settings.php')
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.message);
        const s = json.data;
        siteTitleInput.value       = s.site_title || '';
        siteDescriptionInput.value = s.meta_description || '';
        siteEmailInput.value       = s.contact_email || '';
        facebookInput.value        = s.facebook_url || '';
        instagramInput.value       = s.instagram_url || '';
        statusEl.textContent       = '';
      })
      .catch(err => {
        console.error('Settings load error:', err);
        statusEl.textContent = 'Error loading settings.';
      });
  }

  // Submit updated settings
  settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    statusEl.textContent = 'Saving settings...';
    const formData = new FormData(settingsForm);

    fetch('/php/update_settings.php', {
      method: 'POST',
      body: formData
    })
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.message);
        statusEl.textContent = 'Settings saved.';
      })
      .catch(err => {
        console.error('Settings save error:', err);
        statusEl.textContent = 'Error saving settings.';
      });
  });

  // Initial load
  loadSettings();
});
