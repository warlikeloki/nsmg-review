// NSM-171: Home CTA email icon injection (progressive enhancement)
// Finds the "Are You Ready to Get Started" CTA link and prepends an email icon.
// Accessibility: icon is aria-hidden, text remains the accessible name.

(function () {
  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    try {
      // 1) Heuristic: find the CTA section by heading text OR a known container
      const heading = Array.from(document.querySelectorAll('h2, h3'))
        .find(h => /are you ready to get started/i.test(h.textContent || ''));
      const section = heading ? heading.closest('section, .section, .cta, .cta-section') : document;

      // 2) Locate the “Contact Us” CTA link/button within that section
      let cta =
        (section && section.querySelector('a, button')) &&
        Array.from(section.querySelectorAll('a, button')).find(el => /contact\s*us/i.test(el.textContent || '')) ||
        null;

      // Fallback: try a site-wide search if not found in section
      if (!cta) {
        cta = Array.from(document.querySelectorAll('a, button')).find(el => /contact\s*us/i.test(el.textContent || ''));
      }
      if (!cta) return; // nothing to do

      // 3) Avoid duplicate injection
      if (cta.dataset.nsmgCtaIconInjected === '1') return;

      // 4) Build an inline SVG (no external asset dependencies)
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('class', 'icon-email');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', '20');
      svg.setAttribute('height', '20');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');

      const path = document.createElementNS(ns, 'path');
      // simple email envelope
      path.setAttribute('d',
        'M2 6.5A2.5 2.5 0 0 1 4.5 4h15A2.5 2.5 0 0 1 22 6.5v11A2.5 2.5 0 0 1 19.5 20h-15A2.5 2.5 0 0 1 2 17.5v-11zm2.2-.5 7.3 5 7.3-5H4.2zm15.3 2.1-8 5.5a1 1 0 0 1-1.1 0l-8-5.5V17.5c0 .55.45 1 1 1h15a1 1 0 0 0 1-1V8.1z'
      );
      svg.appendChild(path);

      // 5) Wrap the original text so we can insert the icon without layout shift
      // Ensure the CTA can lay out icon + text horizontally with a gap
      cta.classList.add('cta-with-icon');

      // If the first child is text, wrap it
      // Keep existing HTML (e.g., spans) intact—just insert the icon before the first child node
      cta.insertBefore(svg, cta.firstChild);

      // 6) Add a small visually-hidden label for screen readers if desired
      // (Optional: the link text "Contact Us" is already accessible. This is a no-op for SR parity.)
      // const sr = document.createElement('span');
      // sr.className = 'sr-only';
      // sr.textContent = 'Email';
      // cta.insertBefore(sr, svg.nextSibling);

      // 7) Mark as injected
      cta.dataset.nsmgCtaIconInjected = '1';
    } catch (e) {
      console.error('NSM-171: CTA email icon injection failed', e);
    }
  }
})();
