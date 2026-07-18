document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.custom-images-grid_carousal-container').forEach((container) => {
    // home-animations.js claims this section on the index page and runs a
    // richer ScrollTrigger reveal instead.
    if (container.dataset.haClaimed) return;
    const images = container.querySelectorAll('img');
    if (!images.length || !window.initScrollReveal) return;

    window.initScrollReveal(container, images, {
      from: { opacity: 0, y: 32 },
      stagger: 0.1,
      threshold: 0.15,
    });
  });
});
