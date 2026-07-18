document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.header__search').forEach((wrapper) => {
    const details = wrapper.querySelector('details');
    const summary = wrapper.querySelector('summary');
    const modal = wrapper.querySelector('.search-modal--fullscreen');
    if (!details || !summary || !modal) return;

    const form = modal.querySelector('.search-modal__form');
    const popularLabel = modal.querySelector('.search-modal__popular-label');
    const popularLinks = modal.querySelectorAll('.search-modal__popular-link');
    const closeButton = modal.querySelector('.search-modal__close-button');

    // Deliberately NOT using the native "toggle" event: per spec it fires via
    // a queued task, not synchronously with the open attribute changing, which
    // leaves a real gap for the browser to paint one frame of the modal in its
    // plain, fully-visible resting state before any of this runs. The click on
    // summary that causes the open is synchronous with no paint in between, so
    // hooking that instead guarantees the hidden gsap.set() below is in place
    // before the modal is ever visible.
    summary.addEventListener('click', () => {
      const isOpening = !details.hasAttribute('open');
      if (!isOpening) return;

      const hasGsap = typeof window.gsap !== 'undefined';
      const designMode = window.Shopify && window.Shopify.designMode;
      if (!hasGsap || reduceMotion || designMode) return;

      // Curtain: the maroon panel itself slides down into place first.
      gsap.set(modal, { yPercent: -100 });
      // Content stays hidden until the curtain lands, then each group gets its
      // own entrance direction so the reveal doesn't feel like one repeated tween.
      gsap.set(form, { opacity: 0, y: 26 });
      gsap.set(popularLabel, { opacity: 0, y: 16 });
      gsap.set(popularLinks, { opacity: 0, x: -22 });
      gsap.set(closeButton, { opacity: 0, scale: 0.6 });

      // The panel switches from display:none to visible this same tick, so
      // its first layout/paint is still "cold". Starting the tween one frame
      // later lets the browser settle that before anything moves.
      requestAnimationFrame(() => {
        gsap
          .timeline()
          .to(modal, { yPercent: 0, duration: 0.9, ease: 'power4.inOut' })
          .to(form, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }, '-=0.35')
          .to(closeButton, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, '-=0.45')
          .to(popularLabel, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.2')
          .to(
            popularLinks,
            { opacity: 1, x: 0, duration: 0.45, stagger: 0.09, ease: 'power2.out' },
            '-=0.15'
          );
      });
    });
  });
});
