// /js/modules/gallery.js — NSM-86
import { loadFlickrSettings, getPublicPhotos, getPhotosetPhotos, flickrThumbUrl, flickrLargeUrl } from './flickr.js';

const state = {
  activeList: [],
  index: 0
};

function buildCard(photo, idx) {
  const url = flickrThumbUrl(photo);
  const alt = photo.title || 'Photo';
  const fig = document.createElement('figure');
  fig.className = 'gallery-card';
  const img = document.createElement('img');
  img.src = url;
  img.alt = alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  fig.appendChild(img);
  fig.addEventListener('click', () => openLightbox(idx));
  return fig;
}

function openLightbox(idx) {
  state.index = idx;
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  const cap = document.getElementById('lightboxCaption');
  const p = state.activeList[idx];
  img.src = flickrLargeUrl(p);
  img.alt = p.title || '';
  cap.textContent = p.title || '';
  lb.hidden = false;
}

function closeLightbox() {
  document.getElementById('lightbox').hidden = true;
}

function navLightbox(dir) {
  if (!state.activeList.length) return;
  state.index = (state.index + dir + state.activeList.length) % state.activeList.length;
  const p = state.activeList[state.index];
  const img = document.getElementById('lightboxImg');
  const cap = document.getElementById('lightboxCaption');
  img.src = flickrLargeUrl(p);
  img.alt = p.title || '';
  cap.textContent = p.title || '';
}

async function renderAlbum(settings, album) {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '<p class="muted">Loading…</p>';

  let data;
  if (album.type === 'photoset' && album.id) {
    data = await getPhotosetPhotos(settings.api_base, settings.user_id, album.id, settings.default_per_page, 1);
    const photos = (data.photoset && data.photoset.photo) || [];
    state.activeList = photos;
  } else {
    data = await getPublicPhotos(settings.api_base, settings.user_id, settings.default_per_page, 1);
    const photos = (data.photos && data.photos.photo) || [];
    state.activeList = photos;
  }

  grid.innerHTML = '';
  state.activeList.forEach((p, i) => grid.appendChild(buildCard(p, i)));
}

async function init() {
  const settings = await loadFlickrSettings();
  if (!settings.enabled) return;

  const select = document.getElementById('albumSelect');
  select.innerHTML = '';
  settings.albums.forEach((a, i) => {
    const opt = document.createElement('option');
    opt.value = i.toString();
    opt.textContent = a.title;
    select.appendChild(opt);
  });

  select.addEventListener('change', () => {
    const a = settings.albums[parseInt(select.value, 10)];
    renderAlbum(settings, a);
  });

  // Lightbox wiring
  document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('prevBtn').addEventListener('click', () => navLightbox(-1));
  document.getElementById('nextBtn').addEventListener('click', () => navLightbox(1));
  document.addEventListener('keydown', e => {
    const lb = document.getElementById('lightbox');
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navLightbox(-1);
    if (e.key === 'ArrowRight') navLightbox(1);
  });

  // Initial load
  const first = settings.albums[0] || { type: 'public' };
  select.value = '0';
  await renderAlbum(settings, first);
}

init().catch(err => {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = `<p class="error">Error loading portfolio: ${err.message}</p>`;
  console.error(err);
});
