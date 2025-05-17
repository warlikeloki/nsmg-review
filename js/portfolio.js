// Portfolio Filter Logic
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.filter-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      document.querySelectorAll('.filter-buttons button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.portfolio-item').forEach(item => {
        item.classList.toggle('hidden', filter !== 'all' && !item.classList.contains(filter));
      });
    });
  });
});