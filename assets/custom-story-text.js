document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.custom-story-text').forEach((section) => {
    const heading = section.querySelector('.custom-story-text-heading');
    const body = section.querySelector('.custom-story-text-body');
    const elements = [heading, body].filter(Boolean);
    if (!elements.length || !window.initScrollReveal) return;

    window.initScrollReveal(elements[0], elements, {
      from: { opacity: 0, y: 44 },
      stagger: 0.15,
      threshold: 0.3,
    });
  });
});
