/*
document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.getElementById('gallery');

  fetch('/php/get_images.php')
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch images.");
      return response.json();
    })
    .then(images => {
      images.forEach(image => {
        const imgElement = document.createElement('img');
        imgElement.src = '/media/photos/' + image;
        imgElement.alt = image;
        imgElement.classList.add('gallery-item');
        imgElement.addEventListener('click', () => openLightbox(imgElement.src));
        gallery.appendChild(imgElement);
      });
    })
    .catch(error => {
      console.error('Backend image loading error:', error);
    });

  // Lightbox functionality and listeners already handled globally
});
*/


/* The following code will be commented out once moved to backend functionality. */
document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.getElementById('gallery');

  fetch('/json/images.json')
    .then(response => response.json())
    .then(images => {
      images.forEach(image => {
        let imgElement = document.createElement('img');
        imgElement.src = '/media/photos/' + image;
        imgElement.alt = image;
        imgElement.classList.add('gallery-item');
        imgElement.addEventListener('click', () => openLightbox(imgElement.src));
        gallery.appendChild(imgElement);
      });
    })
    .catch(error => console.error('Error fetching images:', error));

  // Lightbox close on click background
  const lightbox = document.getElementById('lightbox');
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Close on ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeLightbox();
    }
  });
});

function openLightbox(src) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  lightbox.classList.add('active');
  lightboxImg.src = src;
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  lightbox.classList.remove('active');
  document.getElementById('lightbox-img').src = '';
}
