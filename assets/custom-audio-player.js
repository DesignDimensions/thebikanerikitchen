document.addEventListener('DOMContentLoaded', () => {
  const players = document.querySelectorAll('.custom-audio-player-container[data-section-id]');

  players.forEach((container) => {
    const audio = container.querySelector('.custom-audio-player-audio');
    const playButton = container.querySelector('.custom-audio-player-playpause');
    const playIcon = container.querySelector('.custom-audio-player-icon-play');
    const pauseIcon = container.querySelector('.custom-audio-player-icon-pause');
    const progressFill = container.querySelector('.custom-audio-player-progress-fill');
    const currentTime = container.querySelector('.custom-audio-player-current-time');
    const languagePill = container.querySelector('.custom-audio-player-language-pill');
    const languageButtons = container.querySelectorAll('.custom-audio-player-language-button');
    const subtitlesViewport = container.querySelector('.custom-audio-player-subtitles');
    const subtitlesTrack = container.querySelector('.custom-audio-player-subtitles-track');
    const lines = Array.from(container.querySelectorAll('.custom-audio-player-subtitle-line'));

    if (!audio || !playButton) return;

    const hasGsap = typeof window.gsap !== 'undefined';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fx = hasGsap && !reduceMotion;

    let activeLanguage = container.dataset.defaultLanguage || 'hi';
    let activeLine = null;

    const formatTime = (seconds) => {
      if (!seconds || Number.isNaN(seconds)) return '0:00';
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
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

      lines.forEach((line) => {
        const hiText = line.querySelector('.custom-audio-player-subtitle-hi');
        const enText = line.querySelector('.custom-audio-player-subtitle-en');
        if (hiText) hiText.style.display = language === 'hi' ? 'block' : 'none';
        if (enText) enText.style.display = language === 'en' ? 'block' : 'none';
      });
    };

    // 'timeupdate' only fires a handful of times a second, which makes a
    // width update driven purely by it look stepped. Polling audio.currentTime
    // on every animation frame while playing (via gsap.ticker) instead keeps
    // the fill gliding continuously, matching the audio clock itself.
    const renderProgress = () => {
      if (!audio.duration) return;
      progressFill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
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

    const setPlayState = (isPlaying) => {
      const wasPlaying = playButton.classList.contains('is-playing');
      playButton.classList.toggle('is-playing', isPlaying);
      playButton.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
      playButton.dataset.playing = isPlaying ? 'true' : 'false';

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

    const updateActiveLine = () => {
      if (!lines.length) return;
      const time = audio.currentTime;
      let current = lines[0];

      lines.forEach((line) => {
        const start = parseFloat(line.dataset.start) || 0;
        if (start <= time) current = line;
      });

      if (current === activeLine) return;

      const previous = activeLine;
      if (previous) previous.classList.remove('active');
      current.classList.add('active');
      activeLine = current;

      if (fx) {
        if (previous) gsap.to(previous, { opacity: 0.42, duration: 0.4, ease: 'power2.out' });
        gsap.fromTo(current, { opacity: 0.42, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
      }

      if (subtitlesViewport && subtitlesTrack) {
        const centerOffset = subtitlesViewport.clientHeight / 2 - current.offsetTop - current.clientHeight / 2;
        if (fx) {
          gsap.to(subtitlesTrack, { y: centerOffset, duration: 0.6, ease: 'power3.out' });
        } else {
          subtitlesTrack.style.transform = `translateY(${centerOffset}px)`;
        }
      }
    };

    playButton.addEventListener('click', () => {
      bumpPlayButton();
      if (audio.paused) {
        audio.play();
        setPlayState(true);
      } else {
        audio.pause();
        setPlayState(false);
      }
    });

    languageButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (button.dataset.language === activeLanguage) return;
        updateLanguage(button.dataset.language);
      });
    });

    audio.addEventListener('loadedmetadata', () => {
      currentTime.textContent = formatTime(0);
    });

    audio.addEventListener('timeupdate', () => {
      setPlayState(!audio.paused);
      currentTime.textContent = formatTime(audio.currentTime);
      updateActiveLine();
    });

    audio.addEventListener('seeked', () => {
      renderProgress();
      updateActiveLine();
    });

    audio.addEventListener('ended', () => {
      setPlayState(false);
      renderProgress();
    });

    updateLanguage(activeLanguage, false);
    updateActiveLine();

    window.addEventListener('resize', () => {
      const activeButton = container.querySelector('.custom-audio-player-language-button.active');
      placePill(activeButton, false);
    });
  });
});
