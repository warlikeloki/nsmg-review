// /js/admin.js
// Robust Admin Panel script with null-check guards

document.addEventListener('DOMContentLoaded', () => {
  // Core DOM elements
  const navButtons = document.querySelectorAll('#admin-nav .admin-button');
  const content    = document.getElementById('admin-content');
  const homeElem   = document.getElementById('admin-home-content');
  const initial    = homeElem ? homeElem.outerHTML : '';

  // Bail out if essential elements are missing
  if (!navButtons.length || !content) return;

  // Compute base path for admin files
  const parts = window.location.pathname.split('/');
  parts.pop(); // remove current filename
  const basePath = parts.join('/') + '/';

  // ——— Data loaders with null-checks ———
  function loadServiceRequests() {
    const tbody = document.querySelector('#service-requests-table tbody');
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='10'>Loading...</td></tr>";

    fetch('/php/get_service_requests.php')
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.message);
        const rows = json.data;
        tbody.innerHTML = rows.length
          ? rows.map(req => `
            <tr>
              <td>${req.id}</td>
              <td>${req.name}</td>
              <td>${req.email}</td>
              <td>${req.phone || ''}</td>
              <td>${(req.services || []).join(', ')}</td>
              <td>${req.preferred_date || ''}</td>
              <td>${req.location || ''}</td>
              <td>${req.duration || ''}</td>
              <td>${req.details}</td>
              <td>${req.submitted_at}</td>
            </tr>
          `).join('')
          : "<tr><td colspan='10'>No requests found.</td></tr>";
      })
      .catch(err => {
        console.error(err);
        tbody.innerHTML = "<tr><td colspan='10'>Error loading requests.</td></tr>";
      });
  }

  function loadEquipment() {
    const tbody = document.querySelector('#equipment-table tbody');
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='8'>Loading...</td></tr>";

    fetch('/php/get_equipment.php')
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.message);
        const rows = json.data;
        tbody.innerHTML = rows.length
          ? rows.map(eq => `
            <tr>
              <td>${eq.id}</td>
              <td>${eq.name}</td>
              <td>${eq.category}</td>
              <td>${eq.owner || ''}</td>
              <td>${eq.condition}</td>
              <td>${eq.is_retired ? 'Yes' : 'No'}</td>
              <td>${eq.last_used_at || ''}</td>
              <td>${eq.created_at}</td>
            </tr>
          `).join('')
          : "<tr><td colspan='8'>No equipment found.</td></tr>";
      })
      .catch(err => {
        console.error(err);
        tbody.innerHTML = "<tr><td colspan='8'>Error loading equipment.</td></tr>";
      });
  }

  function loadInvoicing() {
    const tbody = document.querySelector('#invoices-table tbody');
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='10'>Loading...</td></tr>";

    fetch('/php/get_invoices.php')
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.message);
        const rows = json.data;
        tbody.innerHTML = rows.length
          ? rows.map(inv => `
            <tr>
              <td>${inv.id}</td>
              <td>${inv.invoice_number}</td>
              <td>${inv.client_name}</td>
              <td>${inv.client_email}</td>
              <td>$${parseFloat(inv.amount).toFixed(2)}</td>
              <td>${inv.status}</td>
              <td>${inv.due_date || ''}</td>
              <td>${inv.notes || ''}</td>
              <td>${inv.created_at}</td>
              <td>${inv.updated_at}</td>
            </tr>
          `).join('')
          : "<tr><td colspan='10'>No invoices found.</td></tr>";
      })
      .catch(err => {
        console.error(err);
        tbody.innerHTML = "<tr><td colspan='10'>Error loading invoices.</td></tr>";
      });
  }

  function loadAccounting() {
    const tbody = document.querySelector('#accounting-table tbody');
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='9'>Loading...</td></tr>";

    fetch('/php/get_accounting.php')
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.message);
        const rows = json.data;
        tbody.innerHTML = rows.length
          ? rows.map(e => `
            <tr>
              <td>${e.id}</td>
              <td>${e.entry_date}</td>
              <td>${e.type}</td>
              <td>${e.category || ''}</td>
              <td>$${parseFloat(e.amount).toFixed(2)}</td>
              <td>${e.description || ''}</td>
              <td>${e.reference || ''}</td>
              <td>${e.created_at}</td>
              <td>${e.updated_at}</td>
            </tr>
          `).join('')
          : "<tr><td colspan='9'>No entries found.</td></tr>";
      })
      .catch(err => {
        console.error(err);
        tbody.innerHTML = "<tr><td colspan='9'>Error loading entries.</td></tr>";
      });
  }

  function loadManagePosts() {
    const tbody = document.querySelector('#posts-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4">Loading…</td></tr>';

    fetch('/php/get_posts.php')
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.message);
        const rows = json.data;
        tbody.innerHTML = rows.length
          ? rows.map(p => `
            <tr>
              <td>${p.id}</td>
              <td>${p.title}</td>
              <td>${p.date}</td>
              <td>
                <button data-id="${p.id}" class="edit-post">Edit</button>
                <button data-id="${p.id}" class="delete-post">Delete</button>
              </td>
            </tr>
          `).join('')
          : '<tr><td colspan="4">No posts found.</td></tr>';
      })
      .catch(err => {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="4">Error loading posts.</td></tr>';
      });
  }

  function loadManageTestimonials() {
    const tbody = document.querySelector('#testimonials-table tbody');
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='2'>Loading...</td></tr>";

    fetch('/php/get_testimonials.php')
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.message);
        const rows = json.data;
        tbody.innerHTML = rows.length
          ? rows.map(t => `
            <tr>
              <td>${t.name}</td>
              <td>${t.message}</td>
            </tr>
          `).join('')
          : "<tr><td colspan='2'>No testimonials found.</td></tr>";
      })
      .catch(err => {
        console.error(err);
        tbody.innerHTML = "<tr><td colspan='2'>Error loading testimonials.</td></tr>";
      });
  }

  // ——— Load arbitrary section HTML ———
  function loadSection(section) {
    if (section === 'admin-home') {
      content.innerHTML = initial;
      return;
    }
    const url = `${basePath}${section}.html`;
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(html => {
        const doc  = new DOMParser().parseFromString(html, 'text/html');
        const main = doc.querySelector('main');
        content.innerHTML = main ? main.innerHTML : '<p>Content not found.</p>';
      })
      .catch(err => {
        console.error(err);
        content.innerHTML = `<h2>Error</h2><p>${err.message}</p>`;
      });
  }

  // ——— Navigation wiring ———
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const section = btn.dataset.section;
      loadSection(section);

      switch (section) {
        case 'service-requests':   loadServiceRequests();   break;
        case 'equipment':          loadEquipment();         break;
        case 'invoicing':          loadInvoicing();         break;
        case 'accounting':         loadAccounting();        break;
        case 'manage-posts':       loadManagePosts();       break;
        case 'manage-testimonials':loadManageTestimonials();break;
        case 'website-settings':
          loadWebsiteSettings();
          // bind save handler
          const form = document.getElementById('settings-form');
          if (form) {
            form.addEventListener('submit', e => {
              e.preventDefault();
              saveWebsiteSettings();
            });
          }
          break;
      }
    });
  });

  // Initial load
  loadSection('admin-home');
});

// ——— Website settings handlers (global scope) ———
function loadWebsiteSettings() {
  const statusEl = document.getElementById('settings-status');
  if (!statusEl) return;
  fetch('/php/get_settings.php')
    .then(r => r.json())
    .then(json => {
      if (!json.success) throw new Error(json.message);
      const s = json.data;
      document.getElementById('site-title').value       = s.site_title || '';
      document.getElementById('meta-description').value = s.meta_description || '';
      document.getElementById('contact-email').value    = s.contact_email || '';
      document.getElementById('facebook-url').value     = s.facebook_url || '';
      document.getElementById('instagram-url').value    = s.instagram_url || '';
    })
    .catch(err => {
      console.error(err);
      document.getElementById('settings-status').textContent = 'Error loading settings.';
    });
}

function saveWebsiteSettings() {
  const statusEl = document.getElementById('settings-status');
  if (!statusEl) return;
  statusEl.textContent = 'Saving…';

  const form = document.getElementById('settings-form');
  if (!form) return;
  const formData = new FormData(form);

  fetch('/php/update_settings.php', { method: 'POST', body: formData })
    .then(r => r.json())
    .then(json => {
      if (!json.success) throw new Error(json.message);
      statusEl.textContent = 'Settings saved.';
    })
    .catch(err => {
      console.error(err);
      statusEl.textContent = 'Error saving settings.';
    });
}
