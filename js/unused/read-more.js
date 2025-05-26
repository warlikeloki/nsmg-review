// Collapsible paragraphs
document.addEventListener('DOMContentLoaded', function() {
    const paragraphs = document.querySelectorAll('.collapsible-paragraph');

    paragraphs.forEach(paragraph => {
        const readMoreBtn = paragraph.querySelector('.read-more-btn');
        const fullContent = paragraph.querySelector('.full-content');

        if (readMoreBtn && fullContent) {
            readMoreBtn.addEventListener('click', function() {
                fullContent.classList.toggle('show');
                if (fullContent.classList.contains('show')) {
                    readMoreBtn.textContent = 'Read Less';
                } else {
                    readMoreBtn.textContent = 'Read More';
                }
            });
        }
    });
});