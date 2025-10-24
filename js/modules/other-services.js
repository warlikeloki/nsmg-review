// /js/modules/other-services.js
// Renders a grid of per-item collapsible cards (same look as equipment):
//  - each card collapsed by default
//  - small "+" button at upper-left toggles open/close
//  - expanded panel shows the service description

import { escapeHtml } from '../utils/html-utils.js';

console.log('[other-services.js] Module loaded, checking for hooks...');
(function () {
  if (window.loadOtherServices) return; // idempotent

  function card(item, idx) {
    const panelId = `os-card-panel-${idx}`;
    const btnId   = `os-card-toggle-${idx}`;
    const title = escapeHtml(item.title || item.name || 'Untitled');
    const desc = item.description 
      ? `<p class="eq-desc">${escapeHtml(item.description)}</p>` 
      : '<p class="eq-desc">No description provided.</p>';

    return `
      <article class="equip-card" data-idx="${idx}">
        <div class="equip-card-hd">
          <button type="button"
                  id="${btnId}"
                  class="equip-toggle-mini"
                  aria-expanded="false"
                  aria-controls="${panelId}"
                  aria-label="Expand ${title}">
            +
          </button>
          <span class="equip-title" title="${title}">${title}</span>
        </div>
        <div id="${panelId}" class="equip-panel" role="region" aria-labelledby="${btnId}" hidden>
          <div class="equip-panel-inner">
            ${desc}
          </div>
        </div>
      </article>
    `;
  }

  async function fetchOtherServices() {
    const res = await fetch('/php/get_other_services.php', { cache: 'no-store' });
    try {
      const json = await res.json();
      if (Array.isArray(json)) return { success: true, data: json };
      if (json && typeof json === 'object' && 'success' in json) return json;
      return { success: true, data: [] };
    } catch {
      return { success: false, error: 'Invalid JSON response' };
    }
  }

  function wireToggles(container) {
    const toggles = Array.from(container.querySelectorAll('.equip-toggle-mini'));

    function toggle(btn) {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      if (panel) panel.hidden = expanded;
      btn.textContent = expanded ? '+' : '–'; // show "–" when open
    }

    toggles.forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(btn); });
      btn.addEventListener('keydown', (e) => {
        if (!['ArrowUp','ArrowDown','Home','End'].includes(e.key)) return;
        const i = toggles.indexOf(btn);
        let next = i;
        if (e.key === 'ArrowUp')   next = (i - 1 + toggles.length) % toggles.length;
        if (e.key === 'ArrowDown') next = (i + 1) % toggles.length;
        if (e.key === 'Home')      next = 0;
        if (e.key === 'End')       next = toggles.length - 1;
        toggles[next]?.focus();
        e.preventDefault();
      });
    });
  }

  function render(container, rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      container.innerHTML = '<p>No other services are listed yet.</p>';
      return;
    }
    const html = rows
      .slice()
      .sort((a, b) => {
        const aTitle = a.title || a.name || '';
        const bTitle = b.title || b.name || '';
        return aTitle.localeCompare(bTitle, undefined, { sensitivity: 'base' });
      })
      .map(card)
      .join('');
    container.innerHTML = `<div class="equip-grid">${html}</div>`;
    wireToggles(container);
  }

  window.loadOtherServices = async function loadOtherServices() {
    // Support both ID variants for backward compatibility
    const container = document.getElementById('other-services-list') || 
                      document.getElementById('other-services-container');
    if (!container) return;
    
    container.innerHTML = '<p>Loading services...</p>';

    const { success, data, error } = await fetchOtherServices();
    if (!success) {
      console.error(error || 'Failed to load other services');
      container.innerHTML = '<p class="error">Unable to load services right now.</p>';
      return;
    }
    render(container, data);
  };

  // Auto-run for direct hits and when injected into services.html
  // Check for either ID variant
  const hook = document.getElementById('other-services-list') || 
               document.getElementById('other-services-container');
  if (hook) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => window.loadOtherServices(), { once: true });
    } else {
      window.loadOtherServices();
    }
  }
})();