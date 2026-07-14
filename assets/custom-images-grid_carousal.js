document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.custom-images-grid_carousal-container').forEach((container) => {
    const images = container.querySelectorAll('img');
    if (!images.length || !window.initScrollReveal) return;

    window.initScrollReveal(container, images, {
      from: { opacity: 0, y: 32 },
      stagger: 0.1,
      threshold: 0.15,
    });
  });
});
