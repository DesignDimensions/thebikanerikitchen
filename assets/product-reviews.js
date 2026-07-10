if (!customElements.get('product-reviews-carousel')) {
  customElements.define(
    'product-reviews-carousel',
    class ProductReviewsCarousel extends HTMLElement {
      connectedCallback() {
        this.items = Array.from(this.querySelectorAll('.product-reviews__item'));
        this.prevButton = this.querySelector('.product-reviews__nav--prev');
        this.nextButton = this.querySelector('.product-reviews__nav--next');
        this.currentEl = this.querySelector('.product-reviews__pagination-current');

        if (!this.items.length || !this.prevButton || !this.nextButton) return;

        this.index = 0;
        this.prevButton.addEventListener('click', () => this.show(this.index - 1));
        this.nextButton.addEventListener('click', () => this.show(this.index + 1));
      }

      show(index) {
        if (index < 0 || index >= this.items.length) return;

        this.items[this.index].hidden = true;
        this.index = index;
        this.items[this.index].hidden = false;

        if (this.currentEl) this.currentEl.textContent = this.index + 1;
        this.prevButton.disabled = this.index === 0;
        this.nextButton.disabled = this.index === this.items.length - 1;
      }
    }
  );
}

document.addEventListener('submit', (event) => {
  const form = event.target.closest('.product-reviews__form');
  if (!form) return;

  const bodyField = form.querySelector('.product-reviews__body-field');
  if (!bodyField) return;

  const get = (name) => form.querySelector(`[name="contact[${name}]"]`)?.value || '';
  const ratingSelect = form.querySelector('[name="contact[rating]"]');
  const ratingLabel = ratingSelect?.selectedOptions[0]?.textContent || '';

  bodyField.value = [
    `Product: ${get('product')} (${get('product_handle')})`,
    `Rating: ${ratingLabel}`,
    `Location: ${get('location')}`,
    '',
    get('review_text'),
  ].join('\n');
});
