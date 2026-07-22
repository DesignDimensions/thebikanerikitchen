document.addEventListener('DOMContentLoaded', () => {
  const players = document.querySelectorAll('.custom-audio-player-container[data-section-id]');

  players.forEach((container) => {
    const audio = container.querySelector('.custom-audio-player-audio');
    const playButton = container.querySelector('.custom-audio-player-playpause');
    const playIcon = container.querySelector('.custom-audio-player-icon-play');
    const pauseIcon = container.querySelector('.custom-audio-player-icon-pause');
    const progressBar = container.querySelector('.custom-audio-player-progress-bar');
    const progressFill = container.querySelector('.custom-audio-player-progress-fill');
    const progressHandle = container.querySelector('.custom-audio-player-progress-handle');
    const languagePill = container.querySelector('.custom-audio-player-language-pill');
    const languageButtons = container.querySelectorAll('.custom-audio-player-language-button');
    const transcript = container.querySelector('.custom-audio-player-transcript');
    const transcriptHi = container.querySelector('.custom-audio-player-transcript-hi');
    const transcriptEn = container.querySelector('.custom-audio-player-transcript-en');
    const cursorTag = container.querySelector('.custom-audio-player-cursor-tag');
    const cursorTagFlip = container.querySelector('.custom-audio-player-cursor-tag-flip');
    const cursorTagText = container.querySelector('.custom-audio-player-cursor-tag-text');

    if (!audio || !playButton) return;

    const hasGsap = typeof window.gsap !== 'undefined';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fx = hasGsap && !reduceMotion;

    // Whole-section click-to-toggle and the cursor tag share this exclusion
    // list so seeking, switching language or pressing the button itself
    // never also fires the section-wide toggle underneath them.
    const CURSOR_EXCLUDED_SELECTOR =
      '.custom-audio-player-playpause, .custom-audio-player-progress-bar, .custom-audio-player-language-switcher';

    let activeLanguage = container.dataset.defaultLanguage || 'hi';
    let currentAudioSrc = null;

    const audioSources = {
      hi: audio.dataset.srcHi || audio.dataset.srcEn || '',
      en: audio.dataset.srcEn || audio.dataset.srcHi || '',
    };

    const placePill = (button, animate) => {
      if (!languagePill || !button) return;
      const x = button.offsetLeft;
      const width = button.offsetWidth;
      if (animate && fx) {
        gsap.to(languagePill, { x, width, duration: 0.45, ease: 'power3.out' });
      } else {
        if (hasGsap) gsap.killTweensOf(languagePill);
        languagePill.style.transform = `translateX(${x}px)`;
        languagePill.style.width = `${width}px`;
      }
    };

    // Switching language mid-playback swaps the <audio> src but keeps the
    // same position and play state, so the story doesn't restart underneath
    // the reader — it just carries on in the other language.
    const switchAudioSource = (language) => {
      const nextSrc = audioSources[language];
      if (!nextSrc || nextSrc === currentAudioSrc) {
        currentAudioSrc = nextSrc || currentAudioSrc;
        return;
      }

      const wasPlaying = !audio.paused;
      const resumeAt = audio.currentTime;
      currentAudioSrc = nextSrc;
      audio.src = nextSrc;

      audio.addEventListener(
        'loadedmetadata',
        () => {
          if (resumeAt) audio.currentTime = resumeAt;
          if (wasPlaying) audio.play();
        },
        { once: true }
      );
    };

    const crossfadeTranscript = (language, animate) => {
      if (!transcript) return;
      const outgoing = language === 'hi' ? transcriptEn : transcriptHi;
      const incoming = language === 'hi' ? transcriptHi : transcriptEn;

      if (animate && fx && outgoing && incoming && outgoing !== incoming) {
        gsap.killTweensOf([outgoing, incoming]);
        gsap.to(outgoing, {
          opacity: 0,
          y: -6,
          duration: 0.25,
          ease: 'power2.out',
          onComplete() {
            transcript.dataset.language = language;
            gsap.fromTo(incoming, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' });
          },
        });
      } else {
        transcript.dataset.language = language;
        if (hasGsap) gsap.set([transcriptHi, transcriptEn].filter(Boolean), { clearProps: 'opacity,transform' });
      }
    };

    const updateLanguage = (language, animate = true) => {
      activeLanguage = language;
      let activeButton = null;

      languageButtons.forEach((button) => {
        const isActive = button.dataset.language === language;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        if (isActive) activeButton = button;
      });

      placePill(activeButton, animate);
      crossfadeTranscript(language, animate);
      switchAudioSource(language);
    };

    // 'timeupdate' only fires a handful of times a second, which makes a
    // width update driven purely by it look stepped. Polling audio.currentTime
    // on every animation frame while playing (via gsap.ticker) instead keeps
    // the fill gliding continuously, matching the audio clock itself.
    const renderProgress = () => {
      if (!audio.duration) return;
      const ratio = audio.currentTime / audio.duration;
      progressFill.style.width = `${ratio * 100}%`;
      if (progressHandle) progressHandle.style.left = `${ratio * 100}%`;
      progressBar.setAttribute('aria-valuenow', Math.round(ratio * 100));
    };
    const tickProgress = () => renderProgress();
    const startProgressTicker = () => hasGsap && gsap.ticker.add(tickProgress);
    const stopProgressTicker = () => hasGsap && gsap.ticker.remove(tickProgress);

    const morphIcon = (isPlaying) => {
      if (!fx || !playIcon || !pauseIcon) return;
      const showing = isPlaying ? pauseIcon : playIcon;
      const hiding = isPlaying ? playIcon : pauseIcon;
      gsap.killTweensOf([showing, hiding]);
      gsap.set(hiding, { display: 'none' });
      gsap.fromTo(
        showing,
        { display: 'flex', opacity: 0, scale: 0.5, rotate: isPlaying ? -35 : 35 },
        { opacity: 1, scale: 1, rotate: 0, duration: 0.35, ease: 'back.out(2.4)' }
      );
    };

    // Same masked-rise motion as the site's heading signature (see
    // .ha-mask/.ha-unit in site-animations.js, e.g. custom-story-text-heading)
    // — the mask clips while the label rises up into place. Run on demand
    // for a repeated text swap instead of that script's one-time scroll
    // reveal, since this label changes with playback state, not once on
    // scroll-enter: the outgoing label rises up and out, then the incoming
    // one rises up from below, in the same continuous upward direction.
    const updateCursorTagLabel = (text) => {
      if (!cursorTagText || cursorTagText.textContent === text) return;
      if (!fx) {
        cursorTagText.textContent = text;
        return;
      }
      gsap
        .timeline()
        .to(cursorTagText, { yPercent: -120, duration: 0.3, ease: 'power3.in' })
        .call(() => {
          cursorTagText.textContent = text;
        })
        .set(cursorTagText, { yPercent: 120 })
        .to(cursorTagText, { yPercent: 0, duration: 0.5, ease: 'power4.out' });
    };

    const setPlayState = (isPlaying) => {
      const wasPlaying = playButton.classList.contains('is-playing');
      playButton.classList.toggle('is-playing', isPlaying);
      playButton.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
      playButton.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
      playButton.dataset.playing = isPlaying ? 'true' : 'false';
      updateCursorTagLabel(isPlaying ? 'Pause audio' : 'Play audio');

      if (wasPlaying === isPlaying) return;
      if (isPlaying) startProgressTicker();
      else stopProgressTicker();
      morphIcon(isPlaying);
    };

    const bumpPlayButton = () => {
      if (!fx) return;
      gsap.killTweensOf(playButton);
      gsap.fromTo(playButton, { scale: 0.86 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.55)' });
    };

    const togglePlayback = () => {
      bumpPlayButton();
      if (audio.paused) {
        audio.play();
        setPlayState(true);
      } else {
        audio.pause();
        setPlayState(false);
      }
    };

    playButton.addEventListener('click', togglePlayback);

    languageButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (button.dataset.language === activeLanguage) return;
        updateLanguage(button.dataset.language);
      });
    });

    // --- Timeline scrubbing -------------------------------------------------
    if (progressBar) {
      const ratioFromEvent = (event) => {
        const rect = progressBar.getBoundingClientRect();
        if (!rect.width) return 0;
        return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      };

      const seekToRatio = (ratio) => {
        if (!audio.duration) return;
        audio.currentTime = ratio * audio.duration;
        renderProgress();
      };

      progressBar.addEventListener('pointerdown', (event) => {
        progressBar.classList.add('is-scrubbing');
        progressBar.setPointerCapture(event.pointerId);
        seekToRatio(ratioFromEvent(event));
      });

      progressBar.addEventListener('pointermove', (event) => {
        if (!progressBar.classList.contains('is-scrubbing')) return;
        seekToRatio(ratioFromEvent(event));
      });

      ['pointerup', 'pointercancel'].forEach((eventName) => {
        progressBar.addEventListener(eventName, () => {
          progressBar.classList.remove('is-scrubbing');
        });
      });

      progressBar.addEventListener('keydown', (event) => {
        if (!audio.duration) return;
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
          event.preventDefault();
          audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
          renderProgress();
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
          event.preventDefault();
          audio.currentTime = Math.max(0, audio.currentTime - 5);
          renderProgress();
        }
      });
    }

    // --- Cursor-attached "play/pause" tag -----------------------------------
    // Only enabled with GSAP + motion allowed + a fine hover-capable pointer,
    // so the section never depends on it — the play button above always works.
    const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // Sits to the right of the real (still visible) cursor rather than
    // replacing it, offset by this many px from the pointer's own x.
    const CURSOR_TAG_OFFSET_X = 22;
    // Drag-inertia tilt: how far a frame's raw pointer movement can rotate
    // the tag, and the px-of-movement-to-degrees factor. Sign is inverted
    // from the movement direction so the tag reads as trailing/lagging
    // behind the cursor like it has weight, not rigidly glued to it.
    // Vertical movement is weighted heavier than horizontal: the tag is a
    // wide, short pill, so for the same px of movement, dragging it
    // vertically reads as more pronounced than dragging it sideways.
    const CURSOR_TILT_MAX = 28;
    const CURSOR_TILT_FACTOR = 0.85;
    const CURSOR_TILT_VERTICAL_BOOST = 1.6;

    if (cursorTag && cursorTagFlip && fx && supportsFinePointer) {
      container.classList.add('has-cursor-tag');

      // cursorTag (outer, position:fixed) only ever gets translated to
      // follow the pointer. cursorTagFlip (inner) only ever rotates.
      // Combining percentage-based translation (xPercent/yPercent below)
      // with 3D rotation on the SAME element produced a sheared
      // parallelogram instead of a clean flip — confirmed by tweening
      // rotationX alone with the drag-tilt fully zeroed out and still
      // seeing the shear. Splitting the two transforms across two
      // elements removes any interaction between them entirely.
      gsap.set(cursorTag, { xPercent: 0, yPercent: -50 });
      gsap.set(cursorTagFlip, {
        transformOrigin: 'center center',
        transformPerspective: 200,
        rotationX: -100,
        opacity: 0,
      });

      const moveX = gsap.quickTo(cursorTag, 'x', { duration: 0.55, ease: 'power3' });
      const moveY = gsap.quickTo(cursorTag, 'y', { duration: 0.55, ease: 'power3' });
      // 'rotation' (GSAP's canonical Z-rotation name), not 'rotate' — quickTo
      // needs to read/cache the property's current value, and its alias
      // resolution for the CSS-style 'rotate' name doesn't fully support
      // that path (logs "rotate not eligible for reset"). Plain to/fromTo
      // calls elsewhere in this file accept 'rotate' fine; quickTo doesn't.
      // power2 gives the reading toward each new target a bit of its own
      // roll-off instead of power1's near-linear snap, so it reads as a
      // fluid drag rather than a jittery twitch, while still being quick
      // enough to feel tied to the pointer.
      const setTilt = gsap.quickTo(cursorTagFlip, 'rotation', { duration: 0.3, ease: 'power2' });

      let suppressed = false;
      let isOpen = false;
      // True for the duration of the open/close tween itself — the drag
      // tilt is suppressed while this is true so it can't blend with the
      // rotationX flip and skew it into a parallelogram. Z stays pinned at
      // 0 through the whole flip and only resumes reacting to movement
      // once the tag is fully open and at rest.
      let isFlipping = false;
      let rawX = 0;
      let rawY = 0;
      let prevRawX = 0;
      let prevRawY = 0;

      // Backwards 3D flip open/close instead of a plain fade — hinges on
      // rotationX so it tilts back away from the viewer when hidden and
      // flips forward to face them when shown.
      const openTag = () => {
        if (isOpen) return;
        isOpen = true;
        isFlipping = true;
        gsap.set(cursorTagFlip, { rotation: 0 });
        gsap.to(cursorTagFlip, {
          rotationX: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'back.out(1.15)',
          onComplete: () => {
            isFlipping = false;
          },
        });
      };

      const closeTag = () => {
        if (!isOpen) return;
        isOpen = false;
        isFlipping = true;
        gsap.set(cursorTagFlip, { rotation: 0 });
        gsap.to(cursorTagFlip, {
          rotationX: -100,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.inOut',
          onComplete: () => {
            isFlipping = false;
          },
        });
      };

      // Sampled every animation frame (not just on pointermove) so the
      // tilt is driven by actual frame-to-frame velocity and naturally
      // eases back to upright once the pointer stops moving.
      const tickTilt = () => {
        const deltaX = rawX - prevRawX;
        const deltaY = rawY - prevRawY;
        prevRawX = rawX;
        prevRawY = rawY;
        if (isFlipping) return;
        const raw = -deltaX + deltaY * CURSOR_TILT_VERTICAL_BOOST;
        setTilt(gsap.utils.clamp(-CURSOR_TILT_MAX, CURSOR_TILT_MAX, raw * CURSOR_TILT_FACTOR));
      };

      let isTracking = false;

      // 'pointerenter' only fires on an actual outside-to-inside transition —
      // if the page loads (or a section re-renders in the editor) with the
      // pointer already resting over this section, it never fires at all,
      // and the tag would silently stay at its initial opacity:0 forever no
      // matter how much the pointer moves. Bootstrapping from the first
      // 'pointermove' too, guarded by isTracking, covers that case as well.
      const beginTracking = (event) => {
        isTracking = true;
        rawX = event.clientX;
        rawY = event.clientY;
        prevRawX = event.clientX;
        prevRawY = event.clientY;
        gsap.set(cursorTag, { x: event.clientX + CURSOR_TAG_OFFSET_X, y: event.clientY });
        suppressed = !!event.target.closest(CURSOR_EXCLUDED_SELECTOR);
        if (!suppressed) openTag();
        gsap.ticker.add(tickTilt);
      };

      container.addEventListener('pointerenter', beginTracking);

      container.addEventListener('pointermove', (event) => {
        if (!isTracking) {
          beginTracking(event);
          return;
        }

        rawX = event.clientX;
        rawY = event.clientY;
        moveX(event.clientX + CURSOR_TAG_OFFSET_X);
        moveY(event.clientY);

        const overExcluded = !!event.target.closest(CURSOR_EXCLUDED_SELECTOR);
        if (overExcluded !== suppressed) {
          suppressed = overExcluded;
          if (suppressed) closeTag();
          else openTag();
        }
      });

      container.addEventListener('pointerleave', () => {
        isTracking = false;
        suppressed = false;
        closeTag();
        gsap.ticker.remove(tickTilt);
        setTilt(0);
      });

      container.addEventListener('click', (event) => {
        if (event.target.closest(CURSOR_EXCLUDED_SELECTOR)) return;
        togglePlayback();
      });
    }

    audio.addEventListener('loadedmetadata', renderProgress);

    audio.addEventListener('timeupdate', () => {
      setPlayState(!audio.paused);
      renderProgress();
    });

    audio.addEventListener('seeked', renderProgress);

    audio.addEventListener('ended', () => {
      setPlayState(false);
      renderProgress();
    });

    updateLanguage(activeLanguage, false);

    window.addEventListener('resize', () => {
      const activeButton = container.querySelector('.custom-audio-player-language-button.active');
      placePill(activeButton, false);
    });
  });
});
