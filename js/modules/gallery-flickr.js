import { loadFlickrSettings, getPublicPhotos, getPhotosetPhotos, flickrThumbUrl, flickrLargeUrl } from './flickr.js';

const state = { list:[], idx:0 };

function card(p,i){
  const f=document.createElement('figure'); f.className='flickr-card';
  const img=document.createElement('img'); img.src=flickrThumbUrl(p); img.alt=p.title||'';
  img.loading='lazy'; img.decoding='async'; f.appendChild(img);
  f.addEventListener('click',()=>openLB(i)); return f;
}
function openLB(i){
  state.idx=i; const p=state.list[i];
  const lb=document.getElementById('flickr-lightbox');
  const img=document.getElementById('flickr-lightbox-img');
  const cap=document.getElementById('flickr-lightbox-cap');
  img.src=flickrLargeUrl(p); img.alt=p.title||''; cap.textContent=p.title||''; lb.hidden=false;
}
function closeLB(){ document.getElementById('flickr-lightbox').hidden=true; }
function navLB(d){ if(!state.list.length) return; state.idx=(state.idx+d+state.list.length)%state.list.length; openLB(state.idx); }

async function render(sel, settings){
  const mount=document.getElementById('portfolio-flickr-root'); if(!mount) return;
  mount.innerHTML='<p class="muted">Loading…</p>';
  let data;
  if(sel.type==='photoset' && sel.id){
    data=await getPhotosetPhotos(settings.user_id, sel.id, settings.default_per_page, 1);
    state.list=(data.photoset && data.photoset.photo)||[];
  } else {
    data=await getPublicPhotos(settings.user_id, settings.default_per_page, 1);
    state.list=(data.photos && data.photos.photo)||[];
  }
  mount.innerHTML='';
  const grid=document.createElement('section'); grid.className='flickr-grid'; mount.appendChild(grid);
  state.list.forEach((p,i)=>grid.appendChild(card(p,i)));
}

async function init(){
  const settings=await loadFlickrSettings(); if(!settings.enabled) return;
  const selEl=document.getElementById('flickr-album-select');
  if(selEl){
    selEl.innerHTML='';
    settings.albums.forEach((a,i)=>{ const o=document.createElement('option'); o.value=String(i); o.textContent=a.title; selEl.appendChild(o); });
    selEl.addEventListener('change',()=>render(settings.albums[parseInt(selEl.value,10)], settings));
  }
  // lightbox events
  document.getElementById('flickr-close').addEventListener('click',closeLB);
  document.getElementById('flickr-prev').addEventListener('click',()=>navLB(-1));
  document.getElementById('flickr-next').addEventListener('click',()=>navLB(1));
  document.addEventListener('keydown',e=>{
    const lb=document.getElementById('flickr-lightbox'); if(lb.hidden) return;
    if(e.key==='Escape') closeLB();
    if(e.key==='ArrowLeft') navLB(-1);
    if(e.key==='ArrowRight') navLB(1);
  });
  const first=settings.albums[0]||{title:'All Public Photos',type:'public',id:''};
  await render(first, settings);
}
init().catch(e=>{ const m=document.getElementById('portfolio-flickr-root'); if(m) m.innerHTML=`<p class="error">Error: ${e.message}</p>`; console.error(e); });
