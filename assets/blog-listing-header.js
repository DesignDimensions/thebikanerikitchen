document.addEventListener('DOMContentLoaded', () => {
  const roots = document.querySelectorAll('.blog-listing-header[data-section-id]');

  roots.forEach((root) => {
    const toggle = root.querySelector('[data-toggle]');
    const wrap = root.querySelector('[data-description-wrap]');
    if (!toggle || !wrap) return;

    const labelMore = toggle.querySelector('[data-label-more]');
    const labelLess = toggle.querySelector('[data-label-less]');
    const hasGsap = typeof window.gsap !== 'undefined';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let expanded = false;
    let animating = false;
    let collapsedHeight = wrap.getBoundingClientRect().height;

    window.addEventListener('resize', () => {
      if (!expanded) collapsedHeight = wrap.getBoundingClientRect().height;
    });

    toggle.addEventListener('click', () => {
      if (animating) return;
      animating = true;

      const expanding = !expanded;
      const target = expanding ? wrap.scrollHeight : collapsedHeight;

      toggle.setAttribute('aria-expanded', String(expanding));
      labelMore.hidden = expanding;
      labelLess.hidden = !expanding;
      wrap.classList.toggle('is-expanded', expanding);

      const finish = () => {
        if (expanding) wrap.style.height = 'auto';
        animating = false;
        expanded = expanding;
      };

      if (hasGsap && !reduceMotion) {
        gsap.to(wrap, {
          height: target,
          duration: 0.65,
          ease: 'power3.inOut',
          onComplete: finish,
        });
      } else {
        wrap.style.height = `${target}px`;
        finish();
      }
    });
  });
});
