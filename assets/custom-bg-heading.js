document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.custom-bg-heading-container').forEach((section) => {
    const heading = section.querySelector('.custom-bg-heading');
    if (!heading || !window.initScrollReveal) return;

    window.initScrollReveal(heading, [heading], {
      from: { opacity: 0, y: 28 },
      to: { duration: 0.85 },
      threshold: 0.4,
    });
  });
});
