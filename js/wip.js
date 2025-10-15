/* NSMG Work-In-Progress Notice
   Drop-in script (ESM safe). Add <script type="module" src="/js/wip.js" defer></script> in header.html.
   Controls:
   - Enable/disable via /wip-settings.json
   - Hide for yourself: add ?nsmgdev=1 to any URL (sets a cookie for 7 days). Use ?nsmgdev=0 to clear.
   - Dismiss (snooze) stores a TTL in localStorage.

   NSM-187 enhancements:
   - Toggles body.has-wip-banner when the banner is visible.
   - Sets CSS variable --wip-banner-height to actual banner height in px.
   - Recomputes on resize and when banner display/class changes.
*/
(() => {
  const SETTINGS_URL = '/wip-settings.json';
  const DEV_COOKIE = 'nsmg_dev';
  const SNOOZE_KEY = 'nsmg_wip_snooze_until';
  const HIDE_KEY   = 'nsmg_wip_hide_forever';

  const setCookie = (name, value, days) => {
    const expires = days ? `; max-age=${days * 86400}` : '';
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
  };
  const getCookie = (name) =>
    document.cookie.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='))?.split('=')[1] ?? null;
  const delCookie = (name) => {
    document.cookie = `${name}=x; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  };

  // Dev toggle via URL param
  const params = new URLSearchParams(location.search);
  if (params.has('nsmgdev')) {
    if (params.get('nsmgdev') === '1') {
      setCookie(DEV_COOKIE, '1', 7);
      console.info('[NSMG] Dev cookie set for 7 days.');
    } else {
      delCookie(DEV_COOKIE);
      console.info('[NSMG] Dev cookie cleared.');
    }
    history.replaceState({}, '', location.pathname + location.hash);
  }

  if (getCookie(DEV_COOKIE) === '1' || localStorage.getItem(HIDE_KEY) === '1') {
    return; // developer view or permanently hidden on this device
  }

  const now = () => Date.now();
  const snoozedUntil = parseInt(localStorage.getItem(SNOOZE_KEY) || '0', 10);
  if (snoozedUntil && now() < snoozedUntil) return;

  const safeText = (s) => String(s ?? '').slice(0, 2000);
  const el = (tag, opts={}) => Object.assign(document.createElement(tag), opts);

  const fallback = {
    enabled: true,
    message: 'Heads up: This site is actively being built. Things may change while we work!',
    details: 'We’re improving content and features in real time. If something looks off, it’s likely mid-update.',
    showModalOnFirstVisit: true,
    snoozeHours: 4
  };

  // --- NSM-187 helpers ---
  function setBannerState(visible, bannerEl) {
    document.body.classList.toggle('has-wip-banner', !!visible);
    const h = (visible && bannerEl) ? (bannerEl.offsetHeight || 52) : 0;
    document.documentElement.style.setProperty('--wip-banner-height', (h || 52) + 'px');
  }
  function isVisible(el) {
    if (!el) return false;
    const style = getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0;
  }

  const enableUI = (cfg) => {
    // Banner
    const banner = el('div', { id: 'nsmg-wip-banner', role: 'region', 'aria-label': 'Site status notice' });
    banner.innerHTML = `
      <div class="wip-inner">
        <svg class="wip-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3l9.196 16H2.804L12 3z" stroke="currentColor" stroke-width="1.6" />
          <circle cx="12" cy="16" r="1.2" fill="currentColor"></circle>
          <rect x="11.2" y="9" width="1.6" height="5" fill="currentColor"></rect>
        </svg>
        <div class="wip-text">${safeText(cfg.message)}</div>
        <div class="wip-actions">
          <button class="nsmg-wip-btn primary" id="wip-learn">Learn more</button>
          <button class="nsmg-wip-btn hide-on-mobile" id="wip-dismiss">Dismiss</button>
        </div>
      </div>
    `;
    document.body.prepend(banner);
    banner.style.display = 'block';

    // NSM-187: update banner state now and on changes
    const applyState = () => setBannerState(isVisible(banner), banner);
    // initial
    applyState();
    // announce (kept for backward compatibility with any listeners)
    window.dispatchEvent(new Event('nsmg:wip:shown'));

    // Badge
    const badge = el('div', { id: 'nsmg-wip-badge', title: 'Site work-in-progress — click for details', tabIndex: 0 });
    badge.innerHTML = `<span class="dot"></span> Work in progress`;
    document.body.appendChild(badge);
    badge.style.display = 'inline-flex';
    const showModal = () => { backdrop.style.display = 'block'; modal.style.display = 'grid'; };
    badge.addEventListener('click', showModal);
    badge.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showModal(); }});

    // Modal + backdrop
    const backdrop = el('div', { id: 'nsmg-wip-modal-backdrop', 'aria-hidden': 'true' });
    const modal = el('div', { id: 'nsmg-wip-modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'wip-title' });
    modal.innerHTML = `
      <div class="wip-card">
        <div class="wip-head">
          <svg class="wip-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="color:var(--wip-accent-2)">
            <path d="M12 3l9.196 16H2.804L12 3z" stroke="currentColor" stroke-width="1.6" />
          </svg>
          <h2 id="wip-title" style="margin:0;font-size:18px;">Site is being updated live</h2>
        </div>
        <div class="wip-body">
          <p style="margin:0 0 10px 0;">${safeText(cfg.details)}</p>
          <ul style="margin:0 0 12px 18px; padding:0;">
            <li>Pages may shift or refresh as we deploy changes.</li>
            <li>If something looks broken, try again in a few minutes.</li>
            <li>Thanks for your patience while we improve the experience!</li>
          </ul>
          ${cfg.windowText ? `<p style="opacity:.8;margin:8px 0 0 0;">${safeText(cfg.windowText)}</p>` : ''}
        </div>
        <div class="wip-foot">
          <button class="nsmg-wip-btn" id="wip-snooze">Snooze for ${cfg.snoozeHours}h</button>
          <button class="nsmg-wip-btn" id="wip-hide">Don’t show again on this device</button>
          <button class="nsmg-wip-btn primary" id="wip-close">Close</button>
        </div>
      </div>
    `;
    document.body.append(backdrop, modal);

    const hideModal = () => { backdrop.style.display = 'none'; modal.style.display = 'none'; };
    document.getElementById('wip-learn').addEventListener('click', () => { backdrop.style.display = 'block'; modal.style.display = 'grid'; });
    document.getElementById('wip-dismiss').addEventListener('click', () => {
      // short snooze (1 hour)
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + 3600 * 1000));
      banner.style.display = 'none';
      applyState();
      window.dispatchEvent(new Event('nsmg:wip:hidden'));
    });
    document.getElementById('wip-close').addEventListener('click', hideModal);
    document.getElementById('wip-snooze').addEventListener('click', () => {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + (cfg.snoozeHours * 3600 * 1000)));
      hideModal();
      banner.style.display = 'none';
      applyState();
      window.dispatchEvent(new Event('nsmg:wip:hidden'));
    });
    document.getElementById('wip-hide').addEventListener('click', () => {
      localStorage.setItem(HIDE_KEY, '1');
      hideModal();
      banner.style.display = 'none';
      applyState();
      window.dispatchEvent(new Event('nsmg:wip:hidden'));
      badge.style.display = 'none';
    });
    backdrop.addEventListener('click', hideModal);

    if (cfg.showModalOnFirstVisit && !sessionStorage.getItem('nsmg_wip_seen')) {
      sessionStorage.setItem('nsmg_wip_seen', '1');
      showModal();
    }

    // Recalculate height on resize/wrap changes
    window.addEventListener('resize', () => requestAnimationFrame(applyState));

    // Watch for style/class changes on the banner that could affect visibility/height
    const mo = new MutationObserver(() => requestAnimationFrame(applyState));
    mo.observe(banner, { attributes: true, attributeFilter: ['style', 'class'] });

    // Back-compat: if anyone listens for our custom events, also mirror state
    window.addEventListener('nsmg:wip:shown', applyState);
    window.addEventListener('nsmg:wip:hidden', applyState);
  };

  const withinWindow = (start, end) => {
    const t = now();
    const s = start ? Date.parse(start) : null;
    const e = end ? Date.parse(end) : null;
    if (s && t < s) return false;
    if (e && t > e) return false;
    return true;
  };

  const boot = async () => {
    try {
      const res = await fetch(SETTINGS_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('settings missing');
      const cfg = await res.json();
      if (!cfg.enabled) return;
      if (!withinWindow(cfg.startDate, cfg.endDate)) return;
      enableUI({ ...fallback, ...cfg });
    } catch {
      // Fallback if no settings file exists
      enableUI(fallback);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
