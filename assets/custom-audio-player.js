document.addEventListener('DOMContentLoaded', () => {
  const players = document.querySelectorAll('.custom-audio-player-container[data-section-id]');

  players.forEach((container) => {
    const audio = container.querySelector('.custom-audio-player-audio');
    const playButton = container.querySelector('.custom-audio-player-playpause');
    const progressFill = container.querySelector('.custom-audio-player-progress-fill');
    const currentTime = container.querySelector('.custom-audio-player-current-time');
    const languageButtons = container.querySelectorAll('.custom-audio-player-language-button');
    const subtitlesViewport = container.querySelector('.custom-audio-player-subtitles');
    const subtitlesTrack = container.querySelector('.custom-audio-player-subtitles-track');
    const lines = Array.from(container.querySelectorAll('.custom-audio-player-subtitle-line'));

    if (!audio || !playButton) return;

    let activeLanguage = container.dataset.defaultLanguage || 'hi';
    let activeLine = null;

    const formatTime = (seconds) => {
      if (!seconds || Number.isNaN(seconds)) return '0:00';
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const updateLanguage = (language) => {
      activeLanguage = language;
      languageButtons.forEach((button) => {
        const isActive = button.dataset.language === language;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      lines.forEach((line) => {
        const hiText = line.querySelector('.custom-audio-player-subtitle-hi');
        const enText = line.querySelector('.custom-audio-player-subtitle-en');
        if (hiText) hiText.style.display = language === 'hi' ? 'block' : 'none';
        if (enText) enText.style.display = language === 'en' ? 'block' : 'none';
      });
    };

    const setPlayState = (isPlaying) => {
      playButton.classList.toggle('is-playing', isPlaying);
      playButton.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
      playButton.dataset.playing = isPlaying ? 'true' : 'false';
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

      if (activeLine) activeLine.classList.remove('active');
      current.classList.add('active');
      activeLine = current;

      if (subtitlesViewport && subtitlesTrack) {
        const centerOffset =
          subtitlesViewport.clientHeight / 2 - current.offsetTop - current.clientHeight / 2;
        subtitlesTrack.style.transform = `translateY(${centerOffset}px)`;
      }
    };

    playButton.addEventListener('click', () => {
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
        updateLanguage(button.dataset.language);
      });
    });

    audio.addEventListener('loadedmetadata', () => {
      currentTime.textContent = formatTime(0);
    });

    audio.addEventListener('timeupdate', () => {
      setPlayState(!audio.paused);
      progressFill.style.width = audio.duration ? `${(audio.currentTime / audio.duration) * 100}%` : '0%';
      currentTime.textContent = formatTime(audio.currentTime);
      updateActiveLine();
    });

    audio.addEventListener('seeked', updateActiveLine);

    audio.addEventListener('ended', () => {
      setPlayState(false);
    });

    updateLanguage(activeLanguage);
    updateActiveLine();
  });
});
