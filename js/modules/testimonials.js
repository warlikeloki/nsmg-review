// /js/modules/testimonials.js
// NSM-88 + NSM-16 (simple): homepage slider + simple grid page.
// Made resilient to either #testimonials-grid or .testimonials-grid,
// and optional #testimonials-status / #testimonials-empty.

(function(){
  const SLIDER_SEL = '[data-module="home-testimonials"]';
  const PAGE_SEL   = '#testimonials-page';
  const JSON_URL   = '/json/testimonials.json';

  function ready(fn){
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else { fn(); }
  }

  // ------- Shared: fetch + utils -------
  async function fetchTestimonials() {
    try {
      const res = await fetch(JSON_URL, { headers: { 'Accept':'application/json' }});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return Array.isArray(json) ? json : (json.testimonials ?? []);
    } catch (err) {
      console.error('[testimonials] fetch error:', err);
      return [];
    }
  }
  const esc = (s)=> String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');

  // ------- HOMEPAGE: slider (looping) -------
  function renderHomeSkeleton(root){
    root.innerHTML = `
      <div class="ts-viewport" aria-live="polite">
        <div class="ts-track" role="list"></div>
      </div>
      <button type="button" class="ts-prev" aria-label="Previous testimonial">&#10094;</button>
      <button type="button" class="ts-next" aria-label="Next testimonial">&#10095;</button>
      <div class="ts-dots" role="tablist" aria-label="Testimonials"></div>
    `;
    root.dataset.hydrated = 'false';
  }
  const pickShort = (t)=> t.short || t.quote || t.text || t.full || '';

  function renderHomeSlides(track, data){
    if (!data?.length) {
      const empty = document.createElement('div');
      empty.className = 'ts-empty ts-slide';
      empty.setAttribute('role','listitem');
      empty.innerHTML = `<em>No testimonials are available yet.</em>`;
      track.appendChild(empty);
      return 0;
    }
    data.forEach((t,i)=>{
      const avatar = (t.photo||'').trim() || '/media/photos/default-avatar.jpg';
      const name   = t.author || t.name || 'Anonymous';
      const meta   = [t.role, t.location].filter(Boolean).join(' • ');
      const quote  = pickShort(t);

      const slide = document.createElement('article');
      slide.className = 'ts-slide';
      slide.setAttribute('role','listitem');
      slide.setAttribute('tabindex','-1');
      slide.setAttribute('aria-roledescription','slide');
      slide.setAttribute('aria-label',`Testimonial ${i+1} of ${data.length}`);
      slide.innerHTML = `
        <figure class="ts-card">
          <img class="ts-avatar" src="${avatar}" alt="${esc(name)}">
          <blockquote class="ts-quote">“${esc(quote)}”</blockquote>
          <figcaption class="ts-meta">
            <strong>${esc(name)}</strong>${meta?` <span>• ${esc(meta)}</span>`:''}
          </figcaption>
        </figure>
      `;
      track.appendChild(slide);
    });
    return data.length;
  }

  function renderHomeDots(dotsEl,count){
    dotsEl.innerHTML='';
    for(let i=0;i<count;i++){
      const b=document.createElement('button');
      b.className='ts-dot'; b.type='button'; b.role='tab';
      b.setAttribute('aria-selected', i===0?'true':'false');
      b.setAttribute('aria-current',  i===0?'true':'false');
      b.setAttribute('aria-label', `Go to testimonial ${i+1}`);
      b.dataset.idx=String(i);
      dotsEl.appendChild(b);
    }
  }

  function initHomeCarousel(root){
    const viewport=root.querySelector('.ts-viewport');
    const track=root.querySelector('.ts-track');
    const prevBtn=root.querySelector('.ts-prev');
    const nextBtn=root.querySelector('.ts-next');
    const dots=root.querySelector('.ts-dots');
    const slides=[...track.children];
    const prefersReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let idx=0,x0=0,xf=0,drag=false;

    function updateDots(){
      dots.querySelectorAll('.ts-dot').forEach((d,i)=>{
        const sel=i===idx;
        d.setAttribute('aria-selected', String(sel));
        d.setAttribute('aria-current',  String(sel));
      });
    }
    function go(to,focus=false){
      const len=slides.length;
      if(len===0) return;
      // wrap around
      if(to<0) idx=len-1; else if(to>=len) idx=0; else idx=to;
      const offset=-idx*viewport.clientWidth;
      if(prefersReduced) track.style.transition='none';
      track.style.transform=`translateX(${offset}px)`;
      updateDots();
      if(focus){
        slides[idx].setAttribute('tabindex','0');
        slides[idx].focus({preventScroll:true});
        slides.forEach((s,i)=>{ if(i!==idx) s.setAttribute('tabindex','-1'); });
      }
      if(prefersReduced) requestAnimationFrame(()=>track.style.removeProperty('transition'));
    }
    const next=()=>go(idx+1);
    const prev=()=>go(idx-1);

    const ro=new ResizeObserver(()=>go(idx));
    ro.observe(viewport);

    prevBtn.addEventListener('click',prev);
    nextBtn.addEventListener('click',next);
    dots.addEventListener('click',e=>{
      const b=e.target.closest('.ts-dot'); if(!b)return;
      const n=parseInt(b.dataset.idx,10);
      if(Number.isFinite(n))go(n,true);
    });

    root.addEventListener('keydown',e=>{
      if(e.key==='ArrowLeft'){e.preventDefault();prev();}
      if(e.key==='ArrowRight'){e.preventDefault();next();}
    });

    // swipe
    const start=x=>{drag=true;x0=xf=x;};
    const move =x=>{ if(!drag)return; xf=x; const dx=xf-x0;
      track.style.transition='none';
      track.style.transform=`translateX(${-idx*viewport.clientWidth+dx}px)`;
    };
    const end  =()=>{ if(!drag)return; drag=false; const dx=xf-x0;
      track.style.removeProperty('transition');
      const thresh=viewport.clientWidth*0.2;
      if(dx>thresh)prev(); else if(dx<-thresh)next(); else go(idx);
    };
    viewport.addEventListener('pointerdown',e=>{
      e.preventDefault(); viewport.setPointerCapture(e.pointerId); start(e.clientX);
    });
    viewport.addEventListener('pointermove',e=>move(e.clientX));
    viewport.addEventListener('pointerup',end);
    viewport.addEventListener('pointercancel',end);

    root.dataset.hydrated='true';
    go(0);
  }

  async function hydrateHomepage(){
    const el=document.querySelector(SLIDER_SEL);
    if(!el) return;
    renderHomeSkeleton(el);
    const track=el.querySelector('.ts-track');
    const dots =el.querySelector('.ts-dots');

    const data=await fetchTestimonials();
    const count=renderHomeSlides(track,data);
    if(count<=1){
      el.querySelector('.ts-prev').style.display='none';
      el.querySelector('.ts-next').style.display='none';
      dots.style.display='none';
      el.dataset.hydrated='true';
      return;
    }
    renderHomeDots(dots,count);
    initHomeCarousel(el);
  }

  // ------- PAGE MODE: simple grid -------
  function normalizeItem(t){
    return {
      id: t.id || '',
      author: t.author || t.name || 'Anonymous',
      role: t.role || t.title || '',
      location: t.location || '',
      short: t.short || t.quote || t.text || t.full || '',
      full: t.full || '',
      photo: (t.photo||'').trim() || '/media/photos/default-avatar.jpg',
      rating: Number.isFinite(t.rating) ? Math.max(0, Math.min(5, Math.round(t.rating))) : null
    };
  }

  function renderGridCard(item){
    const card=document.createElement('article');
    card.className='tgrid-card';
    if (item.id) { card.id=item.id; card.dataset.id=item.id; }
    card.innerHTML = `
      <img class="tgrid-avatar" src="${item.photo}" alt="${esc(item.author)}">
      <blockquote class="tgrid-quote">“${esc(item.short)}”</blockquote>
      <div class="tgrid-meta">
        <strong>${esc(item.author)}</strong>
        ${item.role ? `<span>• ${esc(item.role)}</span>` : ''}
        ${item.location ? `<span>• ${esc(item.location)}</span>` : ''}
        ${item.rating!=null ? `<span aria-label="Rating ${item.rating} out of 5">• ${'★'.repeat(item.rating)}${'☆'.repeat(5-item.rating)}</span>` : ''}
      </div>
    `;
    return card;
  }

  async function hydratePage(){
    const page = document.querySelector(PAGE_SEL);
    if (!page) return;

    // Be lenient about selectors
    const grid  = page.querySelector('#testimonials-grid') || page.querySelector('.testimonials-grid');
    const empty = page.querySelector('#testimonials-empty');
    const status= page.querySelector('#testimonials-status');

    if (!grid) {
      console.warn('[testimonials] No grid found (#testimonials-grid or .testimonials-grid).');
      return;
    }

    grid.setAttribute('aria-busy','true');
    if (status) status.textContent = 'Loading testimonials…';

    const data = (await fetchTestimonials()).map(normalizeItem);

    grid.innerHTML = '';
    if (!data.length) {
      if (empty) empty.hidden = false;
      if (status) status.textContent = 'No testimonials are available yet.';
      grid.setAttribute('aria-busy','false');
      return;
    }
    if (empty) empty.hidden = true;

    data.forEach(item => grid.appendChild(renderGridCard(item)));

    grid.setAttribute('aria-busy','false');
    if (status) status.textContent = '';

    // Smooth-scroll to hash if present
    const hash = (location.hash||'').replace(/^#/,'');
    if (hash) {
      const el = grid.querySelector(`#${CSS.escape(hash)}`) || grid.querySelector(`[data-id="${CSS.escape(hash)}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // ------- Boot -------
  ready(async ()=>{
    await Promise.all([
      hydrateHomepage(),
      hydratePage()
    ]);
  });
})();
