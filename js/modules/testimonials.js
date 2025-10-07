// /js/modules/testimonials.js
// Homepage testimonials carousel (looping version)
// Supports author/role/location/short/full/rating/photo keys.

(function(){
  const SLIDER_SEL = '[data-module="home-testimonials"]';
  const JSON_URL   = '/json/testimonials.json';

  function ready(fn){
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else { fn(); }
  }

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

  function createEl(tag, attrs={}, html='') {
    const el = document.createElement(tag);
    for (const [k,v] of Object.entries(attrs)) if (v!=null) el.setAttribute(k,v);
    if (html) el.innerHTML = html;
    return el;
  }

  function renderSkeleton(container){
    container.innerHTML = `
      <div class="ts-viewport" aria-live="polite">
        <div class="ts-track" role="list"></div>
      </div>
      <button type="button" class="ts-prev" aria-label="Previous testimonial">&#10094;</button>
      <button type="button" class="ts-next" aria-label="Next testimonial">&#10095;</button>
      <div class="ts-dots" role="tablist" aria-label="Testimonials"></div>
    `;
    container.dataset.hydrated = 'false';
  }

  function escapeHtml(s){
    return String(s ?? '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function formatMeta(t){
    const parts = [];
    if (t.role) parts.push(t.role);
    if (t.location) parts.push(t.location);
    return parts.join(' • ');
  }

  function pickQuote(t){ return t.short || t.quote || t.text || t.full || ''; }

  function renderSlides(track, data){
    if (!data?.length) {
      const empty = createEl('div', { class: 'ts-empty ts-slide', role: 'listitem' },
        `<em>No testimonials are available yet.</em>`);
      track.appendChild(empty);
      return 0;
    }

    data.forEach((t,i)=>{
      const avatar = (t.photo||'').trim() || '/media/photos/default-avatar.jpg';
      const name   = t.author || t.name || 'Anonymous';
      const meta   = formatMeta(t);
      const quote  = pickQuote(t);
      const rating = Number.isFinite(t.rating)?Math.min(5,Math.max(0,Math.round(t.rating))):null;

      const slide = createEl('article',{
        class:'ts-slide',role:'listitem',tabindex:'-1',
        'aria-roledescription':'slide','aria-label':`Testimonial ${i+1} of ${data.length}`
      },`
        <figure class="ts-card">
          <img class="ts-avatar" src="${avatar}" alt="${escapeHtml(name)}">
          <blockquote class="ts-quote">“${escapeHtml(quote)}”</blockquote>
          <figcaption class="ts-meta">
            <strong>${escapeHtml(name)}</strong>${meta?` <span>• ${escapeHtml(meta)}</span>`:''}
            ${rating!==null?`<span class="sr-only"> — Rating ${rating}/5</span>`:''}
          </figcaption>
        </figure>`);
      track.appendChild(slide);
    });
    return data.length;
  }

  function renderDots(dotsEl,count){
    dotsEl.innerHTML='';
    for(let i=0;i<count;i++){
      dotsEl.appendChild(createEl('button',{
        class:'ts-dot',type:'button',role:'tab',
        'aria-selected':i===0?'true':'false',
        'aria-current':i===0?'true':'false',
        'aria-label':`Go to testimonial ${i+1}`,
        'data-idx':String(i)
      }));
    }
  }

  function initCarousel(root,count){
    const viewport=root.querySelector('.ts-viewport');
    const track=root.querySelector('.ts-track');
    const prevBtn=root.querySelector('.ts-prev');
    const nextBtn=root.querySelector('.ts-next');
    const dots=root.querySelector('.ts-dots');
    const slides=[...track.children];
    const prefersReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let idx=0,x0=0,xf=0,drag=false;

    function go(to,focus=false){
      const len=slides.length;
      if(len===0) return;
      // wrap index
      if(to<0) idx=len-1;
      else if(to>=len) idx=0;
      else idx=to;

      const offset=-idx*viewport.clientWidth;
      if(prefersReduced) track.style.transition='none';
      track.style.transform=`translateX(${offset}px)`;
      updateDots();
      if(focus){
        slides[idx].setAttribute('tabindex','0');
        slides[idx].focus({preventScroll:true});
        slides.forEach((s,i)=>{if(i!==idx)s.setAttribute('tabindex','-1');});
      }
      if(prefersReduced) requestAnimationFrame(()=>track.style.removeProperty('transition'));
    }
    const next=()=>go(idx+1);
    const prev=()=>go(idx-1);

    function updateDots(){
      dots.querySelectorAll('.ts-dot').forEach((d,i)=>{
        const sel=i===idx;
        d.setAttribute('aria-selected',sel);
        d.setAttribute('aria-current',sel);
      });
    }

    const ro=new ResizeObserver(()=>go(idx));
    ro.observe(viewport);

    prevBtn.addEventListener('click',prev);
    nextBtn.addEventListener('click',next);
    dots.addEventListener('click',e=>{
      const b=e.target.closest('.ts-dot');
      if(!b)return;
      const n=parseInt(b.dataset.idx,10);
      if(Number.isFinite(n))go(n,true);
    });

    root.addEventListener('keydown',e=>{
      if(e.key==='ArrowLeft'){e.preventDefault();prev();}
      if(e.key==='ArrowRight'){e.preventDefault();next();}
    });

    // swipe
    const start=x=>{drag=true;x0=xf=x;};
    const move=x=>{
      if(!drag)return;
      xf=x;
      const dx=xf-x0;
      track.style.transition='none';
      track.style.transform=`translateX(${-idx*viewport.clientWidth+dx}px)`;
    };
    const end=()=>{
      if(!drag)return;
      drag=false;
      const dx=xf-x0;
      track.style.removeProperty('transition');
      const thresh=viewport.clientWidth*0.2;
      if(dx>thresh)prev(); else if(dx<-thresh)next(); else go(idx);
    };

    viewport.addEventListener('pointerdown',e=>{
      e.preventDefault();
      viewport.setPointerCapture(e.pointerId);
      start(e.clientX);
    });
    viewport.addEventListener('pointermove',e=>move(e.clientX));
    viewport.addEventListener('pointerup',()=>end());
    viewport.addEventListener('pointercancel',()=>end());

    root.dataset.hydrated='true';
    go(0);
  }

  async function hydrate(container){
    renderSkeleton(container);
    const track=container.querySelector('.ts-track');
    const dots=container.querySelector('.ts-dots');
    const data=await fetchTestimonials();
    const count=renderSlides(track,data);
    if(count<=1){
      container.querySelector('.ts-prev').style.display='none';
      container.querySelector('.ts-next').style.display='none';
      dots.style.display='none';
      container.dataset.hydrated='true';
      return;
    }
    renderDots(dots,count);
    initCarousel(container,count);
  }

  ready(()=>{
    const el=document.querySelector(SLIDER_SEL);
    if(el) hydrate(el);
  });
})();
