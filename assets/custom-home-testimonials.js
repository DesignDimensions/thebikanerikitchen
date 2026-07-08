document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.custom-home-testimonials-container[data-section-id]');

  sections.forEach((root) => {
    const viewport = root.querySelector('.custom-home-testimonials-viewport');
    const track = root.querySelector('.custom-home-testimonials-track');
    const originalCards = Array.from(root.querySelectorAll('.custom-home-testimonials-card'));
    const prevButton = root.querySelector('.custom-home-testimonials-nav-prev');
    const nextButton = root.querySelector('.custom-home-testimonials-nav-next');
    if (!viewport || !track || originalCards.length === 0) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasGsap = typeof window.gsap !== 'undefined';
    const revealEnabled = root.dataset.animationsEnabled === 'true' && !reduceMotion && hasGsap;
    const autoScrollEnabled = root.dataset.autoplay === 'true' && !reduceMotion;
    const autoplayInterval = (parseFloat(root.dataset.autoplaySpeed) || 3) * 1000;

    const realCount = originalCards.length;
    const getCardsPerView = () => {
      const width = window.innerWidth;
      if (width >= 990) return 3;
      if (width >= 750) return 2;
      return 1;
    };

    const canLoop = realCount > getCardsPerView();

    // Extra copies so stepping can continue in either direction; once we've
    // drifted a full copy away from the middle we silently jump back one
    // copy-width — the content there is identical, so the wrap is invisible.
    const COPIES = 5;
    const START_COPY = 2;

    function initReveal() {
      gsap.set(originalCards, { opacity: 0, y: 60, scale: 0.94 });
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            gsap.to(originalCards, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.9,
              ease: 'back.out(1.4)',
              stagger: 0.15,
            });
            observer.disconnect();
          });
        },
        { threshold: 0.25 }
      );
      observer.observe(viewport);
    }

    const updateNav = () => {
      const hide = !canLoop;
      if (prevButton) prevButton.style.display = hide ? 'none' : '';
      if (nextButton) nextButton.style.display = hide ? 'none' : '';
    };
    updateNav();

    if (!canLoop) {
      if (revealEnabled) initReveal();
      return;
    }

    if (canLoop) {
      for (let i = 1; i < COPIES; i += 1) {
        originalCards.forEach((card) => {
          const clone = card.cloneNode(true);
          Array.from(clone.attributes).forEach((attr) => {
            if (attr.name.startsWith('data-shopify')) clone.removeAttribute(attr.name);
          });
          track.appendChild(clone);
        });
      }
    }

    let setWidth = track.scrollWidth / COPIES;
    let cardStep = setWidth / realCount;
    viewport.scrollLeft = setWidth * START_COPY;

    let isDragging = false;
    let dragStartScrollLeft = 0;

    const correctBounds = () => {
      if (viewport.scrollLeft >= setWidth * (COPIES - 2)) {
        viewport.scrollLeft -= setWidth;
        if (isDragging) dragStartScrollLeft -= setWidth;
      } else if (viewport.scrollLeft < setWidth) {
        viewport.scrollLeft += setWidth;
        if (isDragging) dragStartScrollLeft += setWidth;
      }
    };

    // Correct once scrolling has settled, so a native smooth-scroll or
    // touch-momentum animation never gets cut short mid-flight.
    let settleTimer = null;
    viewport.addEventListener('scroll', () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(correctBounds, 120);
    });

    const stepForward = () => {
      viewport.scrollBy({ left: cardStep, behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    const stepBackward = () => {
      viewport.scrollBy({ left: -cardStep, behavior: reduceMotion ? 'auto' : 'smooth' });
    };

    let autoplayTimer = null;
    const stopAutoplay = () => {
      if (autoplayTimer) clearInterval(autoplayTimer);
      autoplayTimer = null;
    };
    const startAutoplay = () => {
      if (!autoScrollEnabled) return;
      stopAutoplay();
      autoplayTimer = setInterval(stepForward, autoplayInterval);
    };
    startAutoplay();

    let resumeTimer = null;
    const pauseAutoplay = () => {
      stopAutoplay();
      if (resumeTimer) clearTimeout(resumeTimer);
    };
    const scheduleResume = (delay = 2000) => {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(startAutoplay, delay);
    };

    // Native touch scrolling already gives smooth momentum; only add custom
    // dragging for mouse/pen input, which has no built-in drag-to-scroll.
    let dragStartX = 0;

    viewport.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch') return;
      isDragging = true;
      pauseAutoplay();
      dragStartX = event.clientX;
      dragStartScrollLeft = viewport.scrollLeft;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(event.pointerId);
    });

    viewport.addEventListener('pointermove', (event) => {
      if (!isDragging) return;
      viewport.scrollLeft = dragStartScrollLeft - (event.clientX - dragStartX);
    });

    const endDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      viewport.classList.remove('is-dragging');
      scheduleResume();
    };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    viewport.addEventListener('touchstart', pauseAutoplay, { passive: true });
    viewport.addEventListener('touchend', () => scheduleResume(1200), { passive: true });

    viewport.addEventListener('mouseenter', pauseAutoplay);
    viewport.addEventListener('mouseleave', () => {
      if (!isDragging) scheduleResume(500);
    });

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        pauseAutoplay();
        stepForward();
        scheduleResume();
      });
    }
    if (prevButton) {
      prevButton.addEventListener('click', () => {
        pauseAutoplay();
        stepBackward();
        scheduleResume();
      });
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setWidth = track.scrollWidth / COPIES;
        cardStep = setWidth / realCount;
        correctBounds();
      }, 150);
    });

    if (revealEnabled) initReveal();

    root.addEventListener('shopify:block:select', (event) => {
      const index = originalCards.indexOf(event.target);
      if (index === -1) return;
      pauseAutoplay();
      if (revealEnabled) gsap.set(originalCards, { opacity: 1, y: 0, scale: 1 });
      viewport.scrollLeft = setWidth * START_COPY + index * cardStep;
    });
  });
});
