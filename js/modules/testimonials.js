// /js/modules/testimonials.js
// Loads testimonials from /json/testimonials.json and renders them as cards.
// Keeps styling neutral to avoid conflicts with testimonials.css.

(function () {
  const PAGE_SCOPE = document.getElementById('testimonials-page');
  if (!PAGE_SCOPE) return; // only run on testimonials.html

  const container = document.querySelector('.testimonials-grid');
  const statusEl  = document.querySelector('#testimonials-status');

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function truncate(text, limit) {
    if (!text) return '';
    if (text.length <= limit) return text;
    return text.slice(0, limit).trim() + '…';
  }

  function renderCard(t) {
    const card = el('article', 'testimonial-card');

    // Optional photo
    const imgWrap = el('div', 'testimonial-photo');
    const img = el('img');
    img.alt = `${t.author || 'Client'} photo`;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src =
      t.photo && t.photo.trim() !== ''
        ? t.photo
        : '/media/photos/placeholders/avatar-placeholder.svg';
    imgWrap.appendChild(img);

    // Header
    const header = el('div', 'testimonial-header');
    const name   = el('h3', 'testimonial-author', t.author || 'Client');
    const meta   = el('div', 'testimonial-meta',
      [t.role, t.location].filter(Boolean).join(' • ')
    );
    header.appendChild(name);
    if (meta.textContent) header.appendChild(meta);

    // Body with preview/expand
    const body = el('div', 'testimonial-body');
    const previewLimit = 220;
    const fullText = (t.full && t.full.trim().length > 0) ? t.full : (t.short || '');

    const preview = el('p', 'testimonial-text');
    const needsToggle = fullText.length > previewLimit;
    preview.textContent = needsToggle ? truncate(fullText, previewLimit) : fullText;

    body.appendChild(preview);

    if (needsToggle) {
      const toggle = el('button', 'testimonial-toggle', 'Read more');
      toggle.type = 'button';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        if (expanded) {
          preview.textContent = truncate(fullText, previewLimit);
          toggle.textContent  = 'Read more';
        } else {
          preview.textContent = fullText;
          toggle.textContent  = 'Show less';
        }
      });
      body.appendChild(toggle);
    }

    // Footer (date / rating / sample tag)
    const footer = el('div', 'testimonial-footer');
    const bits = [];
    if (t.date) bits.push(new Date(t.date).toLocaleDateString());
    if (typeof t.rating === 'number') bits.push(`★ ${t.rating}/5`);
    if (t.sample) bits.push('SAMPLE');
    footer.textContent = bits.join(' • ');

    // Assemble
    card.appendChild(imgWrap);
    card.appendChild(header);
    card.appendChild(body);
    if (footer.textContent) card.appendChild(footer);

    // data attributes (helpful later)
    card.dataset.id = t.id || '';
    if (t.sample) card.dataset.sample = 'true';

    return card;
  }

  async function loadTestimonials() {
    try {
      statusEl.textContent = 'Loading testimonials…';
      const res = await fetch('/json/testimonials.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        statusEl.textContent = 'No testimonials available yet.';
        return;
      }

      container.innerHTML = '';
      data.forEach(t => container.appendChild(renderCard(t)));
      statusEl.textContent = ''; // clear
    } catch (err) {
      console.error('Testimonials load failed:', err);
      statusEl.textContent = 'Unable to load testimonials right now.';
    }
  }

  loadTestimonials();
})();
