export async function loadFlickrSettings() {
  const r = await fetch('/json/flickr-settings.json', { cache: 'no-store' });
  if (!r.ok) throw new Error('Unable to load flickr-settings.json');
  return r.json();
}
function photoUrl(p, size){ return `https://live.staticflickr.com/${p.server}/${p.id}_${p.secret}_${size}.jpg`; }
export const flickrThumbUrl = (p)=>photoUrl(p,'q');
export const flickrMediumUrl = (p)=>photoUrl(p,'z');
export const flickrLargeUrl = (p)=>photoUrl(p,'b');

async function callProxy(query){
  const u = new URL('/php/flickr_proxy.php', location.origin);
  Object.entries(query).forEach(([k,v])=>u.searchParams.set(k,v));
  const r = await fetch(u); if(!r.ok) throw new Error('Flickr proxy HTTP error');
  const j = await r.json(); if(!j.ok) throw new Error(j.error || 'Flickr proxy error'); return j.data;
}
export const getPublicPhotos =(user_id,per_page=60,page=1)=>callProxy({method:'flickr.people.getPublicPhotos',user_id,per_page,page});
export const getPhotosetPhotos =(user_id,photoset_id,per_page=60,page=1)=>callProxy({method:'flickr.photosets.getPhotos',user_id,photoset_id,per_page,page});
