document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.shop-card__wishlist').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.loggedIn !== 'true') {
        window.location.href = routes.account_login_url;
        return;
      }

      if (button.getAttribute('aria-busy') === 'true') return;

      const productId = Number(button.dataset.productId);
      const wasWishlisted = button.classList.contains('is-wishlisted');
      const setState = (wishlisted) => {
        button.classList.toggle('is-wishlisted', wishlisted);
        button.setAttribute('aria-pressed', String(wishlisted));
        button.setAttribute('aria-label', wishlisted ? window.wishlistStrings.remove : window.wishlistStrings.add);
      };

      button.setAttribute('aria-busy', 'true');
      setState(!wasWishlisted);

      fetch(routes.wishlist_toggle_url, {
        ...fetchConfig(),
        body: JSON.stringify({ product_id: productId }),
      })
        .then((response) => {
          if (!response.ok) throw new Error(`Wishlist toggle failed: ${response.status}`);
          return response.json();
        })
        .then((result) => {
          setState(result.wishlisted);

          const wishlistPage = button.closest('[data-wishlist-page]');
          if (wishlistPage && !result.wishlisted) {
            const card = button.closest('li');
            if (card) card.remove();
          }
        })
        .catch((error) => {
          console.error(error);
          setState(wasWishlisted);
        })
        .finally(() => {
          button.removeAttribute('aria-busy');
        });
    });
  });
});
