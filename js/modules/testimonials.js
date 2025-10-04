// /js/modules/testimonials.js
// Preview-friendly loader: tries absolute & relative URLs and an inline <script> fallback.
// Renders testimonials then initializes an accessible carousel.

(() => {
  const SELECTORS = [
    '#homepage-testimonials-container',
    '#testimonials-container',
    '.testimonials-slider'
  ];

  const qs  = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const html = (strings, ...vals) => strings.map((s, i) => s + (vals[i] ?? '')).join('');

  /** ---------------- Env helpers ---------------- */
  function isHttpLike() {
    const p = location.protocol;
    return p === 'http:' || p === 'https:';
  }
  function basePath() {
    // e.g., if page is /foo/bar.html -> /foo/
    const path = location.pathname || '/';
    return path.endsWith('/') ? path : path.substring(0, path.lastIndexOf('/') + 1);
  }

  function candidateUrls() {
    // Try absolute, then relative to the current page (helps in file:// and vscode-preview)
    const rel1 = 'json/testimonials.json';
    const rel2 = './json/testimonials.json';
    const abs1 = '/json/testimonials.json';
    const maybePhp = '/php/get_testimonials.php'; // future SQL endpoint

    // Build candidates with and without base
    const b = basePath();
    const list = [abs1, rel1, rel2, b + 'json/testimonials.json', maybePhp];

    // Remove duplicates while preserving order
    return Array.from(new Set(list));
  }

  /** ---------------- Data loading ---------------- */
  async function fetchJson(url) {
    const res = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error(`Invalid JSON from ${url}`);
    }
    return data;
  }

  function pickArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.testimonials)) return data.testimonials;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    return null;
  }

  function normalize(items) {
    return items
      .map((it, idx) => {
        const quote  = it.quote ?? it.text ?? it.message ?? '';
        const author = it.author ?? it.name ?? it.person ?? 'Anonymous';
        const role   = it.role ?? it.title ?? it.company ?? '';
        const avatar = it.avatar ?? it.photo ?? it.image ?? '';
        const rating = Number(it.rating ?? it.stars ?? 0) || 0;
        const date   = it.date ?? it.created_at ?? it.when ?? '';
        return { id: it.id ?? idx, quote, author, role, avatar, rating, date };
      })
      .filter(t => (t.quote || '').trim().length > 0);
  }

  function readInlineScript() {
    // Optional inline fallback you can embed in the page:
    // <script type="application/json" id="testimonials-json">[ ... ]</script>
    const el = document.getElementById('testimonials-json');
    if (!el) return null;
    try {
      const data = JSON.parse(el.textContent || '[]');
      const arr = pickArray(data);
      if (Array.isArray(arr) && arr.length) return normalize(arr);
    } catch {
      /* ignore */
    }
    return null;
  }

  async function getTestimonials(diag) {
    // 1) Try HTTP/relative sources
    const urls = candidateUrls();
    for (const url of urls) {
      try {
        const data = await fetchJson(url);
        const arr = pickArray(data);
        if (Array.isArray(arr) && arr.length) {
          diag.ok = `Loaded ${arr.length} item(s) from ${url}`;
          return normalize(arr);
        } else {
          diag.notes.push(`No items in ${url} (unexpected shape).`);
        }
      } catch (e) {
        diag.notes.push(`Failed: ${url} — ${e.message}`);
      }
    }

    // 2) If not http(s) or still empty, try inline script fallback
    const inline = readInlineScript();
    if (inline && inline.length) {
      diag.ok = `Loaded ${inline.length} item(s) from inline <script id="testimonials-json">`;
      return inline;
    }

    // 3) window.TESTIMONIALS as last resort
    if (Array.isArray(window.TESTIMONIALS) && window.TESTIMONIALS.length) {
      diag.ok = `Loaded ${window.TESTIMONIALS.length} item(s) from window.TESTIMONIALS`;
      return normalize(window.TESTIMONIALS);
    }

    return [];
  }

  /** ---------------- Rendering ---------------- */
  function ensureStructure(root) {
    let track = qs('.ts-track', root);
    if (!track) { track = document.createElement('div'); track.className = 'ts-track'; root.appendChild(track); }
    return track;
  }

  function renderSlides(track, testimonials) {
    track.innerHTML = '';
    const frag = document.createDocumentFragment();
    testimonials.forEach((t) => {
      const el = document.createElement('article');
      el.className = 'ts-slide';
      el.setAttribute('tabindex', '-1');
      el.innerHTML = `
        <figure class="ts-card">
          ${t.avatar ? `<img class="ts-avatar" src="${escAttr(t.avatar)}" alt="${escAttr(t.author)}">` : ''}
          <blockquote class="ts-quote">“${escHTML(t.quote)}”</blockquote>
          <figcaption class="ts-meta">
            <span class="ts-author">${escHTML(t.author)}</span>
            ${t.role ? `<span class="ts-role"> · ${escHTML(t.role)}</span>` : ''}
          </figcaption>
          ${renderRating(t.rating)}
        </figure>`;
      frag.appendChild(el);
    });
    track.appendChild(frag);
  }

  function renderRating(rating) {
    const r = Math.max(0, Math.min(5, Math.round(rating)));
    if (!r) return '';
    return `<div class="ts-rating" aria-label="${r} out of 5">${'★'.repeat(r)}${'☆'.repeat(5 - r)}</div>`;
  }

  function escHTML(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escAttr(s) { return escHTML(s).replace(/"/g, '&quot;'); }

  /** ---------------- Diagnostics (visible) ---------------- */
  function showDiag(root, diag) {
    // Only show in non-HTTP preview, or when nothing loaded
    const shouldShow = !isHttpLike() || !diag.ok;
    if (!shouldShow) return;

    let box = qs('.ts-diag', root);
    if (!box) {
      box = document.createElement('div');
      box.className = 'ts-diag';
      root.appendChild(box);
    }
    const notesHtml = diag.notes.length ? `<ul>${diag.notes.map(n => `<li>${escHTML(n)}</li>`).join('')}</ul>` : '';
    box.innerHTML = `
      <div class="ts-diag-inner">
        <strong>Testimonials debug:</strong>
        ${diag.ok ? `<div class="ok">${escHTML(diag.ok)}</div>` : '<div class="warn">No data loaded</div>'}
        ${notesHtml}
        <div class="hint">Tip: In VS Code preview, absolute paths like <code>/json/…</code> may not resolve. Try relative <code>json/testimonials.json</code> or add inline fallback.</div>
      </div>`;
  }

  /** ---------------- Carousel behavior ---------------- */
  function initCarousel(root) {
    const slider = root;
    const track  = qs('.ts-track', slider);
    const slides = qsa('.ts-slide', track);
    if (!slides.length) return;

    let btnPrev = qs('.ts-prev', slider);
    let btnNext = qs('.ts-next', slider);
    let status  = qs('.ts-status', slider);

    if (!btnPrev) { btnPrev = mkBtn('ts-prev', 'Previous testimonial', '‹'); slider.appendChild(btnPrev); }
    if (!btnNext) { btnNext = mkBtn('ts-next', 'Next testimonial', '›'); slider.appendChild(btnNext); }
    if (!status)  { status  = mkStatus(); slider.appendChild(status); }

    slider.setAttribute('role', 'region');
    slider.setAttribute('aria-label', 'Testimonials');
    track.setAttribute('role', 'list');
    slides.forEach((s, i) => {
      s.setAttribute('role', 'listitem');
      s.setAttribute('data-index', String(i));
      s.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    });

    let index = 0, timer = null, isPaused = false;
    const autoplayMs = Number(slider.getAttribute('data-autoplay') || '5000');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const enableAutoplay = autoplayMs > 0 && !reduceMotion;

    function announce() { status.textContent = `Testimonial ${index + 1} of ${slides.length}`; }
    function go(i, focus = false) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(${-index * 100}%)`;
      slides.forEach((s, si) => {
        const active = si === index;
        s.classList.toggle('is-active', active);
        s.setAttribute('aria-hidden', active ? 'false' : 'true');
        if (active && focus) s.focus();
      });
      announce();
    }
    function next() { go(index + 1); }
    function prev() { go(index - 1); }

    function startAutoplay() { if (!enableAutoplay || isPaused) return; stopAutoplay(); timer = setInterval(next, autoplayMs); }
    function stopAutoplay()  { if (timer) { clearInterval(timer); timer = null; } }

    btnNext.addEventListener('click', () => { stopAutoplay(); next(); startAutoplay(); });
    btnPrev.addEventListener('click', () => { stopAutoplay(); prev(); startAutoplay(); });

    slider.addEventListener('mouseenter', () => { isPaused = true; stopAutoplay(); });
    slider.addEventListener('mouseleave', () => { isPaused = false; startAutoplay(); });
    slider.addEventListener('focusin',   () => { isPaused = true; stopAutoplay(); });
    slider.addEventListener('focusout',  () => { isPaused = false; startAutoplay(); });

    slider.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); stopAutoplay(); next(); startAutoplay(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); stopAutoplay(); prev(); startAutoplay(); }
      if (e.key === 'Home')       { e.preventDefault(); stopAutoplay(); go(0, true); }
      if (e.key === 'End')        { e.preventDefault(); stopAutoplay(); go(slides.length - 1, true); }
    });

    // Touch swipe
    let startX = 0, dx = 0, touching = false;
    const threshold = 40;
    slider.addEventListener('touchstart', (e) => { const t = e.touches[0]; startX = t.clientX; dx = 0; touching = true; stopAutoplay(); }, { passive: true });
    slider.addEventListener('touchmove',  (e) => { if (!touching) return; dx = e.touches[0].clientX - startX; }, { passive: true });
    slider.addEventListener('touchend',   () => { touching = false; if (dx > threshold) prev(); else if (dx < -threshold) next(); startAutoplay(); });

    track.style.willChange = 'transform';
    go(0);
    startAutoplay();
  }

  function mkBtn(cls, label, text) {
    const b = document.createElement('button');
    b.className = cls;
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.textContent = text;
    return b;
  }
  function mkStatus() {
    const s = document.createElement('div');
    s.className = 'ts-status';
    s.setAttribute('aria-live', 'polite');
    s.setAttribute('aria-atomic', 'true');
    return s;
  }

  /** ---------------- Entry point ---------------- */
  async function initAll() {
    const roots = new Set();
    SELECTORS.forEach(sel => qsa(sel).forEach(el => roots.add(el)));
    if (!roots.size) return;

    const diag = { ok: '', notes: [] };
    const testimonials = await getTestimonials(diag);

    roots.forEach(root => {
      const track = ensureStructure(root);
      if (testimonials.length) {
        renderSlides(track, testimonials);
        try { initCarousel(root); } catch (e) { diag.notes.push(`Carousel init failed: ${e.message}`); }
      } else {
        if (!track.children.length) {
          track.innerHTML = '<div class="ts-empty">Testimonials will appear here.</div>';
        }
      }
      showDiag(root, diag);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll, { once: true });
  } else {
    initAll();
  }
})();
