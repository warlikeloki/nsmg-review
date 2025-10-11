import { loadFlickrSettings, getPublicPhotos, getPhotosetPhotos, flickrMediumUrl } from './flickr.js';

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
  const ul=document.createElement('ul'); ul.className='flickr-home-strip';
  list.forEach(p=>{ const li=document.createElement('li'); const img=document.createElement('img');
    img.src=flickrMediumUrl(p); img.alt=p.title||''; img.loading='lazy'; img.decoding='async';
    li.appendChild(img); ul.appendChild(li);
  });
  mount.innerHTML=''; mount.appendChild(ul);
}
init().catch(console.error);
