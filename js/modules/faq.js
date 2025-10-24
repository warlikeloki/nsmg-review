/**
 * FAQ Accordion Module
 * Handles collapsible FAQ items on the homepage
 */

export function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  if (faqItems.length === 0) return;

  faqItems.forEach((item, index) => {
    // Wrap h3 in a button for accessibility
    const h3 = item.querySelector('h3');
    const answer = item.querySelector('div[itemscope]');

    if (!h3 || !answer) return;

    // Create button wrapper
    const button = document.createElement('button');
    button.className = 'faq-question';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', `faq-answer-${index}`);
    button.type = 'button';

    // Add toggle icon
    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'faq-toggle';
    toggleIcon.setAttribute('aria-hidden', 'true');
    toggleIcon.textContent = '+';

    // Move h3 content into button
    h3.setAttribute('id', `faq-question-${index}`);
    button.appendChild(h3);
    button.appendChild(toggleIcon);

    // Wrap answer in collapsible container
    const answerWrapper = document.createElement('div');
    answerWrapper.className = 'faq-answer';
    answerWrapper.id = `faq-answer-${index}`;
    answerWrapper.setAttribute('role', 'region');
    answerWrapper.setAttribute('aria-labelledby', `faq-question-${index}`);

    // Move answer into wrapper
    const answerContent = answer.cloneNode(true);
    answerWrapper.appendChild(answerContent);

    // Clear item and rebuild structure
    item.innerHTML = '';
    item.appendChild(button);
    item.appendChild(answerWrapper);

    // Add click handler
    button.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all other FAQ items (optional - remove these lines for multi-open behavior)
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          const otherButton = otherItem.querySelector('.faq-question');
          if (otherButton) {
            otherButton.setAttribute('aria-expanded', 'false');
          }
        }
      });

      // Toggle current item
      item.classList.toggle('active');
      button.setAttribute('aria-expanded', !isActive);
    });
  });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFAQ);
} else {
  initFAQ();
}
