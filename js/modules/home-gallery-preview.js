import { loadFlickrSettings, getPublicPhotos, getPhotosetPhotos, flickrMediumUrl, flickrLargeUrl } from './flickr.js';

const state = { list:[], idx:0 };

function openLB(i){
  state.idx=i; const p=state.list[i];
  let lb=document.getElementById('home-flickr-lightbox');

  // Create lightbox if it doesn't exist
  if(!lb){
    lb=document.createElement('div');
    lb.id='home-flickr-lightbox';
    lb.hidden=true;
    lb.innerHTML=`
      <button id="home-flickr-close" aria-label="Close">&times;</button>
      <img id="home-flickr-lightbox-img" alt="">
      <div id="home-flickr-lightbox-cap"></div>
      <button id="home-flickr-prev" class="flickr-nav" aria-label="Previous">&#10094;</button>
      <button id="home-flickr-next" class="flickr-nav" aria-label="Next">&#10095;</button>
    `;
    document.body.appendChild(lb);

    // Attach event listeners
    document.getElementById('home-flickr-close').addEventListener('click',closeLB);
    document.getElementById('home-flickr-prev').addEventListener('click',()=>navLB(-1));
    document.getElementById('home-flickr-next').addEventListener('click',()=>navLB(1));
    document.addEventListener('keydown',e=>{
      const lb=document.getElementById('home-flickr-lightbox'); if(!lb || lb.hidden) return;
      if(e.key==='Escape') closeLB();
      if(e.key==='ArrowLeft') navLB(-1);
      if(e.key==='ArrowRight') navLB(1);
    });
  }

  const img=document.getElementById('home-flickr-lightbox-img');
  const cap=document.getElementById('home-flickr-lightbox-cap');
  img.src=flickrLargeUrl(p); img.alt=p.title||''; cap.textContent=p.title||''; lb.hidden=false;
}

function closeLB(){
  const lb=document.getElementById('home-flickr-lightbox');
  if(lb) lb.hidden=true;
}

function navLB(d){
  if(!state.list.length) return;
  state.idx=(state.idx+d+state.list.length)%state.list.length;
  openLB(state.idx);
}

async function init(){
  const mount=document.getElementById('home-gallery-preview'); if(!mount) return;
  const s=await loadFlickrSettings(); if(!s.homepage_preview?.enabled) return;
  let list=[];
  if(s.homepage_preview.source==='photoset' && s.homepage_preview.photoset_id){
    const d=await getPhotosetPhotos(s.user_id, s.homepage_preview.photoset_id, s.homepage_preview.count||8, 1);
    list=(d.photoset && d.photoset.photo)||[];
  } else {
    const d=await getPublicPhotos(s.user_id, s.homepage_preview.count||8, 1);
    list=(d.photos && d.photos.photo)||[];
  }

  // Store list for lightbox navigation
  state.list=list;

  const ul=document.createElement('ul'); ul.className='flickr-home-strip';
  list.forEach((p,i)=>{
    const li=document.createElement('li');
    const img=document.createElement('img');
    img.src=flickrMediumUrl(p); img.alt=p.title||''; img.loading='lazy'; img.decoding='async';
    img.style.cursor='pointer';
    li.appendChild(img);

    // Make image clickable to open lightbox
    li.addEventListener('click',()=>openLB(i));

    ul.appendChild(li);
  });
  mount.innerHTML=''; mount.appendChild(ul);
}
init().catch(console.error);
