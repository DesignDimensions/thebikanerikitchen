const WISHLIST_STORAGE_KEY = 'wishlist';
const HEART_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-accordion icon-heart" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 5.24 8.515 3.773a4.433 4.433 0 0 0-6.21 0 4.293 4.293 0 0 0 0 6.128L10 17.495l7.695-7.593a4.293 4.293 0 0 0 0-6.128 4.433 4.433 0 0 0-6.21 0zm.765-2.177c2.113-2.084 5.538-2.084 7.65 0a5.29 5.29 0 0 1 0 7.55l-7.695 7.593a1.03 1.03 0 0 1-1.44 0l-7.696-7.594a5.29 5.29 0 0 1 0-7.549C3.697.98 7.122.98 9.234 3.063l.766.755z"/></svg>';

function getWishlist() {
  try {
    const stored = JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    return [];
  }
}

function setWishlist(items) {
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
}

function isWishlisted(productId) {
  return getWishlist().some((item) => item.id === productId);
}

function toggleWishlistItem(button) {
  const productId = Number(button.dataset.productId);
  const items = getWishlist();
  const index = items.findIndex((item) => item.id === productId);

  if (index > -1) {
    items.splice(index, 1);
  } else {
    items.push({
      id: productId,
      title: button.dataset.productTitle,
      url: button.dataset.productUrl,
      image: button.dataset.productImage,
      price: button.dataset.productPrice,
    });
  }

  setWishlist(items);
  return index === -1;
}

function setButtonState(button, wishlisted) {
  button.classList.toggle('is-wishlisted', wishlisted);
  button.setAttribute('aria-pressed', String(wishlisted));
  button.setAttribute('aria-label', wishlisted ? window.wishlistStrings.remove : window.wishlistStrings.add);
}

function renderWishlistPage() {
  const list = document.querySelector('[data-wishlist-page]');
  if (!list) return;

  const items = getWishlist();
  const emptyState = document.querySelector('[data-wishlist-empty]');

  list.innerHTML = '';

  if (items.length === 0) {
    list.hidden = true;
    if (emptyState) emptyState.hidden = false;
    return;
  }

  list.hidden = false;
  if (emptyState) emptyState.hidden = true;

  items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'grid__item';
    li.innerHTML = `
      <div class="shop-card">
        <a href="${item.url}" class="shop-card__media">
          <img src="${item.image}" alt="${item.title}" class="shop-card__image" loading="lazy">
        </a>
        <button
          type="button"
          class="shop-card__wishlist is-wishlisted"
          aria-label="${window.wishlistStrings.remove}"
          aria-pressed="true"
          data-product-id="${item.id}"
          data-product-title="${item.title}"
          data-product-url="${item.url}"
          data-product-image="${item.image}"
          data-product-price="${item.price}"
        >${HEART_ICON_SVG}</button>
        <div class="shop-card__footer">
          <h3 class="shop-card__title">
            <a href="${item.url}" class="shop-card__title-link">${item.title}</a>
          </h3>
          <span class="shop-card__price">${item.price}</span>
        </div>
      </div>
    `;
    list.appendChild(li);
    bindWishlistButton(li.querySelector('.shop-card__wishlist'));
  });
}

function bindWishlistButton(button) {
  setButtonState(button, isWishlisted(Number(button.dataset.productId)));

  button.addEventListener('click', () => {
    const wishlisted = toggleWishlistItem(button);
    setButtonState(button, wishlisted);

    if (button.closest('[data-wishlist-page]')) {
      renderWishlistPage();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.shop-card__wishlist').forEach(bindWishlistButton);
  renderWishlistPage();
});
