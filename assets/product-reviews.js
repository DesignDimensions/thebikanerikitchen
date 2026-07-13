if (!customElements.get('product-reviews-carousel')) {
  customElements.define(
    'product-reviews-carousel',
    class ProductReviewsCarousel extends HTMLElement {
      static AUTOPLAY_MS = 3000;

      connectedCallback() {
        this.items = Array.from(this.querySelectorAll('.product-reviews__item'));
        this.prevButton = this.querySelector('.product-reviews__nav--prev');
        this.nextButton = this.querySelector('.product-reviews__nav--next');
        this.currentEl = this.querySelector('.product-reviews__pagination-current');

        if (!this.items.length || !this.prevButton || !this.nextButton) return;

        this.items.forEach((item) => item.removeAttribute('hidden'));

        this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.hasGsap = typeof window.gsap !== 'undefined';
        this.index = 0;
        this.isAnimating = false;
        this.autoplayId = null;

        this.items[this.index].classList.add('is-active');

        this.prevButton.addEventListener('click', () => {
          this.show(this.index - 1, 'prev');
          this.restartAutoplay();
        });
        this.nextButton.addEventListener('click', () => {
          this.show(this.index + 1, 'next');
          this.restartAutoplay();
        });

        if (this.items.length > 1) {
          this.addEventListener('mouseenter', () => this.stopAutoplay());
          this.addEventListener('mouseleave', () => this.startAutoplay());
          this.addEventListener('focusin', () => this.stopAutoplay());
          this.addEventListener('focusout', () => this.startAutoplay());
          document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.stopAutoplay();
            else this.startAutoplay();
          });

          this.startAutoplay();
        }
      }

      parts(item) {
        return {
          el: item,
          quote: item.querySelector('.product-reviews__quote'),
          stars: Array.from(item.querySelectorAll('.product-reviews__star')),
          author: item.querySelector('.product-reviews__author'),
        };
      }

      startAutoplay() {
        if (this.items.length <= 1 || this.reduceMotion) return;
        this.stopAutoplay();
        this.autoplayId = window.setInterval(() => {
          this.show(this.index + 1, 'next');
        }, ProductReviewsCarousel.AUTOPLAY_MS);
      }

      stopAutoplay() {
        if (this.autoplayId) {
          window.clearInterval(this.autoplayId);
          this.autoplayId = null;
        }
      }

      restartAutoplay() {
        if (this.autoplayId) this.startAutoplay();
      }

      show(index, direction) {
        const total = this.items.length;
        const nextIndex = ((index % total) + total) % total;

        if (this.isAnimating || nextIndex === this.index) return;

        const outgoing = this.parts(this.items[this.index]);
        const incoming = this.parts(this.items[nextIndex]);
        direction = direction || (nextIndex > this.index ? 'next' : 'prev');

        this.isAnimating = true;
        this.index = nextIndex;

        if (this.currentEl) this.currentEl.textContent = this.index + 1;

        if (this.hasGsap && !this.reduceMotion) {
          this.animateWithGsap(outgoing, incoming, direction);
        } else {
          outgoing.el.classList.remove('is-active');
          incoming.el.classList.add('is-active');
          this.isAnimating = false;
        }
      }

      animateWithGsap(outgoing, incoming, direction) {
        const xShift = direction === 'next' ? 36 : -36;

        incoming.el.classList.add('is-active');
        incoming.el.style.zIndex = 2;
        outgoing.el.style.zIndex = 1;

        gsap.set(incoming.el, { opacity: 0 });
        gsap.set(incoming.quote, { opacity: 0, x: xShift, y: 12 });
        gsap.set(incoming.stars, { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' });
        gsap.set(incoming.author, { opacity: 0, y: 10 });

        gsap
          .timeline({
            defaults: { ease: 'power3.out' },
            onComplete: () => {
              outgoing.el.classList.remove('is-active');
              outgoing.el.style.zIndex = '';
              incoming.el.style.zIndex = '';
              gsap.set(outgoing.el, { clearProps: 'opacity,transform' });
              gsap.set([incoming.el, incoming.quote, incoming.stars, incoming.author], {
                clearProps: 'opacity,transform',
              });
              this.isAnimating = false;
            },
          })
          .to(outgoing.quote, { opacity: 0, x: -xShift, y: -8, duration: 0.4, ease: 'power2.in' }, 0)
          .to(outgoing.stars, { opacity: 0, scale: 0.5, duration: 0.3, stagger: 0.02, ease: 'power2.in' }, 0)
          .to(outgoing.author, { opacity: 0, y: -8, duration: 0.3, ease: 'power2.in' }, 0.02)
          .to(outgoing.el, { opacity: 0, duration: 0.45 }, 0)
          .to(incoming.el, { opacity: 1, duration: 0.1 }, 0.3)
          .to(incoming.stars, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(2.2)' }, 0.36)
          .to(incoming.quote, { opacity: 1, x: 0, y: 0, duration: 0.55 }, 0.4)
          .to(incoming.author, { opacity: 1, y: 0, duration: 0.45 }, 0.58);
      }
    }
  );
}
