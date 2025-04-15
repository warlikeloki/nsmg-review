// gallery.js (or whatever you name it)
/* This portion is commented out due to being for backend functionality and not currently needed.
document.addEventListener("DOMContentLoaded", () => {
    const gallery = document.getElementById('gallery');

    fetch('/php/get_images.php')
        .then(response => response.json())
        .then(images => {
            images.forEach(image => {
                let imgElement = document.createElement('img');
                imgElement.src = '/media/photos/' + image; // Relative path from gallery.html
                imgElement.alt = image;
                imgElement.classList.add('gallery-item');
                imgElement.addEventListener('click', () => openLightbox(imgElement.src));
                gallery.appendChild(imgElement);
            });
        })
        .catch(error => console.error('Error fetching images:', error));
});

// Lightbox functionality
function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    lightbox.style.display = 'flex';
    lightboxImg.src = src;
}

function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
}
This is the end of the commented out portion. */
/* The following code will be commented out once moved to backend functionality. */
document.addEventListener("DOMContentLoaded", () => {
    const gallery = document.getElementById('gallery');
  
    fetch('/json/images.json')
      .then(response => response.json())
      .then(images => {
        images.forEach(image => {
          let imgElement = document.createElement('img');
          imgElement.src = '/media/photos/' + image; // Path relative to public directory
          imgElement.alt = image;
          imgElement.classList.add('gallery-item');
          imgElement.addEventListener('click', () => openLightbox(imgElement.src));
          gallery.appendChild(imgElement);
        });
      })
      .catch(error => console.error('Error fetching images:', error));
  });
  
  // Lightbox functionality
  function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    lightbox.style.display = 'flex';
    lightboxImg.src = src;
  }
  
  function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
  }