document.addEventListener('DOMContentLoaded', () => {
  const players = document.querySelectorAll('.custom-audio-player-container[data-section-id]');

  players.forEach((container) => {
    const audio = container.querySelector('.custom-audio-player-audio');
    const playButton = container.querySelector('.custom-audio-player-playpause');
    const progressFill = container.querySelector('.custom-audio-player-progress-fill');
    const currentTime = container.querySelector('.custom-audio-player-current-time');
    const languageButtons = container.querySelectorAll('.custom-audio-player-language-button');
    const subtitleRows = Array.from(container.querySelectorAll('.custom-audio-player-subtitle-row'));

    if (!audio || !playButton) return;

    let activeLanguage = container.dataset.defaultLanguage || 'hi';

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

      subtitleRows.forEach((row) => {
        const hiText = row.querySelector('.custom-audio-player-subtitle-hi');
        const enText = row.querySelector('.custom-audio-player-subtitle-en');
        if (hiText) hiText.style.display = language === 'hi' ? 'block' : 'none';
        if (enText) enText.style.display = language === 'en' ? 'block' : 'none';
      });
    };

    const setPlayState = (isPlaying) => {
      playButton.textContent = isPlaying ? 'Pause' : 'Play';
      playButton.dataset.playing = isPlaying ? 'true' : 'false';
    };

    const highlightCurrentSubtitle = () => {
      const time = audio.currentTime;
      let activeRow = null;

      subtitleRows.forEach((row) => {
        const start = parseFloat(row.dataset.start) || 0;
        const end = parseFloat(row.dataset.end) || 0;
        const isActive = time >= start && time < end;
        row.classList.toggle('active', isActive);
        if (isActive) activeRow = row;
      });

      if (activeRow) {
        activeRow.scrollIntoView({ block: 'nearest', inline: 'nearest' });
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
      highlightCurrentSubtitle();
    });

    audio.addEventListener('ended', () => {
      setPlayState(false);
    });

    updateLanguage(activeLanguage);
  });
});
