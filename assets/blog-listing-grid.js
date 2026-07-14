document.addEventListener('DOMContentLoaded', () => {
  const roots = document.querySelectorAll('.blog-listing-grid[data-section-id]');

  const GRID_PATTERN = [
    { col: '1', aspect: '3 / 4' },
    { col: '2', aspect: '16 / 10' },
    { col: '1 / -1', aspect: '21 / 9' },
  ];

  roots.forEach((root) => {
    const filterButtons = Array.from(root.querySelectorAll('[data-filter-tag]'));
    const items = Array.from(root.querySelectorAll('.blog-listing-grid-item[data-tags]'));
    if (!items.length) return;

    let activeTag = null;

    const layout = () => {
      const visibleItems = items.filter((item) => !item.hidden);
      const total = visibleItems.length;

      visibleItems.forEach((item, index) => {
        const patternIndex = total === 1 ? 2 : index % 3;
        const { col, aspect } = GRID_PATTERN[patternIndex];
        item.style.setProperty('--grid-col', col);
        item.style.setProperty('--grid-aspect', aspect);
      });
    };

    const applyFilter = () => {
      items.forEach((item) => {
        const tags = (item.dataset.tags || '')
          .split(',')
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean);
        item.hidden = !!activeTag && !tags.includes(activeTag.toLowerCase());
      });
      layout();
    };

    layout();

    if (!filterButtons.length) return;

    const resetButton = filterButtons.find((button) => !button.dataset.filterTag);
    if (resetButton) resetButton.classList.add('is-active');

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const tag = button.dataset.filterTag || '';
        const wasActive = button.classList.contains('is-active');

        filterButtons.forEach((btn) => btn.classList.remove('is-active'));

        if (!tag) {
          activeTag = null;
          button.classList.add('is-active');
        } else if (wasActive) {
          activeTag = null;
          if (resetButton) resetButton.classList.add('is-active');
        } else {
          activeTag = tag;
          button.classList.add('is-active');
        }

        applyFilter();
      });
    });
  });
});
