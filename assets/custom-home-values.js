// Desktop-only, mouse-only interaction. The real title is never moved or
// resized — on hover we clone it, append the clone to <body> as a
// position:fixed pill, and drive it with a lerped gsap.ticker loop so it
// chases the cursor anywhere in the row (including over the icon and past
// its own item's edges, since the pill is nearly as wide as the item
// itself). Tilt comes from how far the pill is lagging behind its target
// (a drag/pennant effect), pivoted from its top-left corner. The icon is
// never touched.
//
// The ticker is the single source of truth for position/rotation for the
// clone's entire lifetime, from first appearing to settling back at rest —
// on leave we just re-target it at the rest position instead of handing off
// to a separate tween. Handing off to a differently-eased tween mid-motion
// would keep position continuous but not velocity, which reads as a jerk
// right where the motion changes character.
document.addEventListener('DOMContentLoaded', () => {
  const hasGsap = typeof window.gsap !== 'undefined';
  if (!hasGsap) return;

  const desktopQuery = window.matchMedia('(min-width: 990px)');
  const hoverQuery = window.matchMedia('(hover: hover)');
  const pointerQuery = window.matchMedia('(pointer: fine)');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const isEligible = () =>
    desktopQuery.matches && hoverQuery.matches && pointerQuery.matches && !reducedMotionQuery.matches;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const POSITION_LERP = 0.16;
  const TILT_LERP = 0.2;
  const TILT_FACTOR = 0.16;
  const MAX_TILT_DEG = 26;
  const EDGE_INSET = 6;
  const FLOAT_SCALE = 0.8;
  const SETTLE_EPSILON = 0.75;
  // Must match .custom-home_values-title-floater's padding: the clone is
  // bigger than the original (which has no padding), so its box is offset
  // by this much to keep the *text inside it* aligned with the original's
  // text — otherwise the swap at rest pops by exactly this offset.
  const FLOATER_PAD_X = 14;
  const FLOATER_PAD_Y = 6;

  document.querySelectorAll('.custom-home_values-item-container').forEach((container) => {
    container
      .querySelectorAll('.custom-home_values-item:not(.custom-home_values-item--extra)')
      .forEach((item) => {
        const title = item.querySelector('.custom-home_values-title');
        if (!title) return;

        let clone = null;
        let tickerFn = null;
        let bounds = null;
        let hovering = false;

        const current = { x: 0, y: 0 };
        const target = { x: 0, y: 0 };
        const rotateCurrent = { x: 0, y: 0 };

        // X roams the full viewport (the pill is nearly as wide as its own
        // item, so it needs room past that item's edges — and past the row
        // container's edges too, or the first/last items would get capped
        // right where they start). Y stays within the hovered item's own
        // top/bottom.
        const measureBounds = () => {
          const itemRect = item.getBoundingClientRect();
          const titleRect = title.getBoundingClientRect();
          return {
            titleRect,
            minX: EDGE_INSET,
            maxX: window.innerWidth - EDGE_INSET - titleRect.width,
            minY: itemRect.top + EDGE_INSET,
            maxY: itemRect.bottom - EDGE_INSET - titleRect.height,
          };
        };

        const createClone = (titleRect) => {
          const el = title.cloneNode(true);
          el.classList.add('custom-home_values-title-floater');
          el.style.width = `${titleRect.width}px`;

          document.body.appendChild(el);
          gsap.set(el, {
            x: titleRect.left - FLOATER_PAD_X,
            y: titleRect.top - FLOATER_PAD_Y,
            rotateX: 0,
            rotateY: 0,
            scale: 1,
            opacity: 0,
            transformPerspective: 700,
            transformOrigin: 'left top',
          });

          return el;
        };

        const finalizeReturn = () => {
          stopTicker();
          title.style.opacity = '';
          if (clone) {
            clone.remove();
            clone = null;
          }
        };

        const startTicker = () => {
          if (tickerFn) return;
          tickerFn = () => {
            const dx = target.x - current.x;
            const dy = target.y - current.y;
            current.x += dx * POSITION_LERP;
            current.y += dy * POSITION_LERP;

            const tiltX = clamp(-dy * TILT_FACTOR, -MAX_TILT_DEG, MAX_TILT_DEG);
            const tiltY = clamp(dx * TILT_FACTOR, -MAX_TILT_DEG, MAX_TILT_DEG);
            rotateCurrent.x += (tiltX - rotateCurrent.x) * TILT_LERP;
            rotateCurrent.y += (tiltY - rotateCurrent.y) * TILT_LERP;

            gsap.set(clone, {
              x: current.x - FLOATER_PAD_X,
              y: current.y - FLOATER_PAD_Y,
              rotateX: rotateCurrent.x,
              rotateY: rotateCurrent.y,
            });

            if (!hovering && Math.hypot(dx, dy) < SETTLE_EPSILON) {
              finalizeReturn();
            }
          };
          gsap.ticker.add(tickerFn);
        };

        const stopTicker = () => {
          if (tickerFn) {
            gsap.ticker.remove(tickerFn);
            tickerFn = null;
          }
        };

        const updateTargetFromPointer = (clientX, clientY) => {
          const halfW = bounds.titleRect.width / 2;
          const halfH = bounds.titleRect.height / 2;
          target.x = clamp(clientX - halfW, bounds.minX, bounds.maxX);
          target.y = clamp(clientY - halfH, bounds.minY, bounds.maxY);
        };

        const handlePointerMove = (event) => {
          if (!clone) return;
          updateTargetFromPointer(event.clientX, event.clientY);
        };

        const handlePointerEnter = (event) => {
          if (event.pointerType !== 'mouse' || !isEligible()) return;
          hovering = true;

          bounds = measureBounds();

          if (!clone) {
            clone = createClone(bounds.titleRect);
            title.style.opacity = '0';
            current.x = bounds.titleRect.left;
            current.y = bounds.titleRect.top;
            rotateCurrent.x = 0;
            rotateCurrent.y = 0;
            target.x = current.x;
            target.y = current.y;
          }
          // If a clone is being reused mid return-flight, current/target
          // are already live values owned by the still-running ticker —
          // nothing to reset, just start steering it again below.

          item.classList.add('is-floating');
          gsap.to(clone, { opacity: 1, scale: FLOAT_SCALE, duration: 0.4, ease: 'power3.out' });

          startTicker();
          updateTargetFromPointer(event.clientX, event.clientY);
          item.addEventListener('pointermove', handlePointerMove);
        };

        const handlePointerLeave = (event) => {
          if (event.pointerType !== 'mouse' || !clone) return;
          hovering = false;

          item.classList.remove('is-floating');
          item.removeEventListener('pointermove', handlePointerMove);

          const restRect = title.getBoundingClientRect();
          target.x = restRect.left;
          target.y = restRect.top;

          // No opacity fade here — the clone stays fully visible while it
          // lerps back to rest and is only swapped out for the real title
          // (in finalizeReturn) once it actually arrives, so there's never
          // a gap where neither is visible.
          gsap.to(clone, { scale: 1, duration: 0.4, ease: 'power2.out' });
        };

        item.addEventListener('pointerenter', handlePointerEnter);
        item.addEventListener('pointerleave', handlePointerLeave);
      });
  });
});
