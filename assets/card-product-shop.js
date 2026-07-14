document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.shop-card__size-select').forEach((select) => {
    select.addEventListener('change', () => {
      const form = select.closest('form');
      if (!form) return;

      const option = select.options[select.selectedIndex];
      const idInput = form.querySelector('.shop-card__variant-id');
      const priceEl = form.querySelector('.shop-card__price');

      if (idInput) idInput.value = option.value;
      if (priceEl && option.dataset.price) priceEl.textContent = option.dataset.price;
    });
  });
});
