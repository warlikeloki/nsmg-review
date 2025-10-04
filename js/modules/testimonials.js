// /js/modules/testimonials.js
// Fetches from /php/get_testimonials.php (SQL). In non-HTTP preview, falls back to data-src or inline JSON.

(() => {
  const SELECTORS = ['#homepage-testimonials-container', '#testimonials-container', '.testimonials-slider'];
  const qs  = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const isHttpLike = () => location.protocol === 'http:' || location.protocol === 'https:';
  const pageDir = () => {
    const p = location.pathname || '/';
    return p.endsWith('/') ? p : p.slice(0, p.lastIndexOf('/') + 1);
  };

  function escHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function escAttr(s){return escHTML(s).replace(/"/g,'&quot;');}

  function normalize(items){
    return items.map((it, idx)=>({
      id: it.id ?? idx,
      quote: it.quote ?? it.content ?? it.text ?? '',
      author: it.author ?? it.name ?? 'Anonymous',
      rating: Number(it.rating ?? it.stars ?? 0) || 0,
      created_at: it.created_at ?? it.date ?? ''
    })).filter(t => t.quote.trim().length);
  }

  async function fetchJson(url){
    const res = await fetch(url, { cache:'no-store', credentials:'same-origin' });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  function readInlineScript(){
    const el = document.getElementById('testimonials-json');
    if(!el) return null;
    try{
      const data = JSON.parse(el.textContent || '[]');
      return Array.isArray(data) ? data : (Array.isArray(data.testimonials)? data.testimonials : (Array.isArray(data.items)? data.items : null));
    }catch{return null;}
  }

  async function getTestimonials(root){
    const diag = { ok:'', notes:[] };
    const phpRel = 'php/get_testimonials.php?limit=8&order=newest';
    const phpAbs = '/php/get_testimonials.php?limit=8&order=newest';
    const override = root.getAttribute('data-src') || '';
    const rel1 = override || 'json/testimonials.json';
    const rel2 = './json/testimonials.json';
    const rel3 = pageDir() + 'json/testimonials.json';
    const abs1 = '/json/testimonials.json';

    const candidates = isHttpLike()
      ? [phpRel, phpAbs, rel1, rel2, rel3, abs1]
      : [rel1, rel2, rel3, abs1]; // VS Code preview (no PHP)

    for (const url of Array.from(new Set(candidates))) {
      try{
        const data = await fetchJson(url);
        const arr = Array.isArray(data) ? data
                  : Array.isArray(data.data) ? data.data
                  : Array.isArray(data.items) ? data.items
                  : null;
        if (arr && arr.length) {
          diag.ok = `Loaded ${arr.length} item(s) from ${url}`;
          return { list: normalize(arr), diag };
        } else {
          diag.notes.push(`No items in ${url} (empty or unexpected shape).`);
        }
      }catch(e){
        diag.notes.push(`Failed: ${url} — ${e.message}`);
      }
    }

    // Inline fallback (preview)
    const inline = readInlineScript();
    if(inline && inline.length){
      diag.ok = `Loaded ${inline.length} item(s) from inline <script>`;
      return { list: normalize(inline), diag };
    }

    return { list: [], diag };
  }

  function ensureStructure(root){
    let track = qs('.ts-track', root);
    if (!track){ track = document.createElement('div'); track.className='ts-track'; root.appendChild(track); }
    return track;
  }

  function renderSlides(track, list){
    track.innerHTML = '';
    const frag = document.createDocumentFragment();
    for(const t of list){
      const el = document.createElement('article');
      el.className = 'ts-slide';
      el.setAttribute('tabindex','-1');
      el.innerHTML = `
        <figure class="ts-card">
          <blockquote class="ts-quote">“${escHTML(t.quote)}”</blockquote>
          <figcaption class="ts-meta">
            <span class="ts-author">${escHTML(t.author)}</span>
          </figcaption>
          ${renderRating(t.rating)}
        </figure>`;
      frag.appendChild(el);
    }
    track.appendChild(frag);
  }

  function renderRating(r){
    const rating = Math.max(0, Math.min(5, Math.round(r)));
    if(!rating) return '';
    return `<div class="ts-rating" aria-label="${rating} out of 5">${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</div>`;
  }

  function initCarousel(root){
    const slider = root;
    const track  = qs('.ts-track', slider);
    const slides = qsa('.ts-slide', track);
    if(!slides.length) return;

    let prev = qs('.ts-prev', slider) || mkBtn('ts-prev','Previous testimonial','‹', slider);
    let next = qs('.ts-next', slider) || mkBtn('ts-next','Next testimonial','›', slider);
    let stat = qs('.ts-status',slider) || mkStatus(slider);

    slider.setAttribute('role','region');
    slider.setAttribute('aria-label','Testimonials');
    track.setAttribute('role','list');
    slides.forEach((s,i)=>{ s.setAttribute('role','listitem'); s.setAttribute('aria-hidden', i===0 ? 'false':'true'); });

    let idx=0, timer=null, paused=false;
    const autoplayMs = Number(slider.getAttribute('data-autoplay')||'5000');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canAuto = autoplayMs>0 && !reduce;

    const announce = ()=> stat.textContent = `Testimonial ${idx+1} of ${slides.length}`;
    const go = (i, focus=false)=>{
      idx = (i + slides.length) % slides.length;
      track.style.transform = `translateX(${-idx*100}%)`;
      slides.forEach((s,si)=>{ const on = si===idx; s.classList.toggle('is-active', on); s.setAttribute('aria-hidden', on?'false':'true'); if(on&&focus) s.focus(); });
      announce();
    };
    const nextF = ()=> go(idx+1);
    const prevF = ()=> go(idx-1);
    const start = ()=> { if(!canAuto || paused) return; stop(); timer=setInterval(nextF, autoplayMs); };
    const stop  = ()=> { if(timer) { clearInterval(timer); timer=null; } };

    next.addEventListener('click', ()=>{ stop(); nextF(); start(); });
    prev.addEventListener('click', ()=>{ stop(); prevF(); start(); });

    slider.addEventListener('mouseenter', ()=>{ paused=true; stop(); });
    slider.addEventListener('mouseleave', ()=>{ paused=false; start(); });
    slider.addEventListener('focusin',  ()=>{ paused=true; stop(); });
    slider.addEventListener('focusout', ()=>{ paused=false; start(); });

    slider.addEventListener('keydown', (e)=>{
      if(e.key==='ArrowRight'){ e.preventDefault(); stop(); nextF(); start(); }
      if(e.key==='ArrowLeft'){  e.preventDefault(); stop(); prevF(); start(); }
      if(e.key==='Home'){       e.preventDefault(); stop(); go(0,true); }
      if(e.key==='End'){        e.preventDefault(); stop(); go(slides.length-1,true); }
    });

    track.style.willChange = 'transform';
    go(0); start();
  }

  function mkBtn(cls,label,text,root){
    const b=document.createElement('button'); b.className=cls; b.type='button'; b.setAttribute('aria-label',label); b.textContent=text; root.appendChild(b); return b;
  }
  function mkStatus(root){
    const s=document.createElement('div'); s.className='ts-status'; s.setAttribute('aria-live','polite'); s.setAttribute('aria-atomic','true'); root.appendChild(s); return s;
  }

  function diagBox(root, msg, notes){
    if (isHttpLike() && msg) return; // quiet in prod if it worked
    let box = qs('.ts-diag', root);
    if (!box) { box = document.createElement('div'); box.className='ts-diag'; root.appendChild(box); }
    const list = (notes||[]).map(n=>`<li>${escHTML(n)}</li>`).join('');
    box.innerHTML = `<div class="ts-diag-inner"><strong>Testimonials debug:</strong><div>${escHTML(msg||'No data')}</div>${list?`<ul>${list}</ul>`:''}</div>`;
  }

  async function initAll(){
    const roots = new Set(); SELECTORS.forEach(s => qsa(s).forEach(el => roots.add(el)));
    if(!roots.size) return;
    for (const root of roots) {
      const track = ensureStructure(root);
      const { list, diag } = await getTestimonials(root);
      if (list.length) { renderSlides(track, list); initCarousel(root); }
      else if (!track.children.length) { track.innerHTML = '<div class="ts-empty">Testimonials will appear here.</div>'; }
      diagBox(root, diag.ok, diag.notes);
    }
  }

  function ensureStructure(root){ let t=qs('.ts-track',root); if(!t){t=document.createElement('div'); t.className='ts-track'; root.appendChild(t);} return t; }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll, { once:true });
  else initAll();
})();
