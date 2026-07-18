document.addEventListener('DOMContentLoaded', () => {
  const roots = document.querySelectorAll('.blog-listing-header[data-section-id]');

  roots.forEach((root) => {
    const toggle = root.querySelector('[data-toggle]');
    const wrap = root.querySelector('[data-description-wrap]');
    const textEl = root.querySelector('[data-description]');
    if (!toggle || !wrap || !textEl || typeof gsap === 'undefined') return;

    const labelMore = toggle.querySelector('[data-label-more]');
    const labelLess = toggle.querySelector('[data-label-less]');

    let expanded = false;
    let currentTimeline = null;
    let words = [];
    let hiddenWords = [];
    let collapsedHeight = 0;

    const wrapWords = () => {
      const walker = document.createTreeWalker(textEl, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      let node;
      while ((node = walker.nextNode())) {
        if (node.textContent.trim() !== '') textNodes.push(node);
      }

      textNodes.forEach((textNode) => {
        const fragment = document.createDocumentFragment();
        textNode.textContent.split(/(\s+)/).forEach((chunk) => {
          if (chunk === '') return;
          if (chunk.trim() === '') {
            fragment.appendChild(document.createTextNode(chunk));
          } else {
            const span = document.createElement('span');
            span.className = 'blog-listing-header-description-word';
            span.textContent = chunk;
            fragment.appendChild(span);
          }
        });
        textNode.parentNode.replaceChild(fragment, textNode);
      });

      words = textEl.querySelectorAll('.blog-listing-header-description-word');
    };

    // Measures the real rendered (clamped) height first, so the animation's collapsed
    // target always matches what was actually on screen — no snap when the clamp is lifted.
    // Then measures the natural (unclamped) layout to find which words fall past the clamp,
    // and hands the element back to the CSS line-clamp fallback so the native "…" shows at rest.
    const measure = () => {
      if (!words.length) return;

      collapsedHeight = textEl.getBoundingClientRect().height;
      const containerTop = textEl.getBoundingClientRect().top;

      textEl.style.display = 'block';
      textEl.style.webkitLineClamp = 'unset';
      textEl.style.webkitBoxOrient = 'unset';
      textEl.style.height = 'auto';
      textEl.style.overflow = 'visible';

      hiddenWords = Array.from(words).filter((word) => {
        return word.getBoundingClientRect().top - containerTop >= collapsedHeight - 2;
      });

      const fullHeight = textEl.getBoundingClientRect().height;
      const overflows = hiddenWords.length > 0 && fullHeight > collapsedHeight + 2;

      textEl.style.display = '';
      textEl.style.webkitLineClamp = '';
      textEl.style.webkitBoxOrient = '';
      textEl.style.height = '';
      textEl.style.overflow = '';
      gsap.set(words, { clearProps: 'opacity,transform' });
      words.forEach((word) => word.classList.remove('is-hidden-word'));

      toggle.hidden = !overflows;
      wrap.classList.remove('is-expanded');
    };

    const getFullHeight = () => {
      const previousHeight = textEl.style.height;
      const previousOverflow = textEl.style.overflow;
      textEl.style.height = 'auto';
      textEl.style.overflow = 'visible';
      const height = textEl.getBoundingClientRect().height;
      textEl.style.height = previousHeight;
      textEl.style.overflow = previousOverflow;
      return height;
    };

    const scrollIntoViewIfCollapsedAboveFold = () => {
      const rect = wrap.getBoundingClientRect();
      if (rect.top < 0) {
        wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    const expand = () => {
      if (currentTimeline) currentTimeline.kill();

      expanded = true;
      toggle.setAttribute('aria-expanded', 'true');
      labelMore.hidden = true;
      labelLess.hidden = false;
      wrap.classList.add('is-expanded');

      gsap.set(textEl, {
        display: 'block',
        webkitLineClamp: 'unset',
        height: collapsedHeight,
        overflow: 'hidden',
      });
      gsap.set(hiddenWords, { opacity: 0, y: 8 });
      hiddenWords.forEach((word) => word.classList.add('is-hidden-word'));

      const fullHeight = getFullHeight();

      const timeline = gsap.timeline({
        onComplete: () => {
          textEl.style.height = 'auto';
          textEl.style.overflow = 'visible';
          hiddenWords.forEach((word) => word.classList.remove('is-hidden-word'));
          currentTimeline = null;
        },
      });
      currentTimeline = timeline;

      timeline.to(textEl, { height: fullHeight, duration: 0.6, ease: 'power2.out' }, 0);
      timeline.to(
        hiddenWords,
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.015,
          ease: 'power2.out',
        },
        0.1
      );
    };

    const collapse = () => {
      if (currentTimeline) currentTimeline.kill();

      expanded = false;
      toggle.setAttribute('aria-expanded', 'false');
      labelMore.hidden = false;
      labelLess.hidden = true;
      wrap.classList.remove('is-expanded');
      hiddenWords.forEach((word) => word.classList.add('is-hidden-word'));

      gsap.set(textEl, { height: textEl.getBoundingClientRect().height, overflow: 'hidden' });

      const timeline = gsap.timeline({
        onComplete: () => {
          currentTimeline = null;
          textEl.style.display = '';
          textEl.style.webkitLineClamp = '';
          textEl.style.webkitBoxOrient = '';
          textEl.style.height = '';
          textEl.style.overflow = '';
          gsap.set(hiddenWords, { clearProps: 'opacity,transform' });
          scrollIntoViewIfCollapsedAboveFold();
        },
      });
      currentTimeline = timeline;

      timeline.to(
        hiddenWords,
        {
          opacity: 0,
          y: 8,
          duration: 0.25,
          stagger: { each: 0.008, from: 'end' },
          ease: 'power1.in',
        },
        0
      );
      timeline.to(textEl, { height: collapsedHeight, duration: 0.45, ease: 'power2.inOut' }, 0.1);
    };

    wrapWords();
    measure();

    toggle.addEventListener('click', () => {
      if (expanded) {
        collapse();
      } else {
        expand();
      }
    });

    const debounce = (fn, wait) => {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), wait);
      };
    };

    window.addEventListener(
      'resize',
      debounce(() => {
        if (!expanded) measure();
      }, 200)
    );
  });
});
