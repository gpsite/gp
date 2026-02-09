
export function createPlayer(id, type = 'movie') {
    const container = document.createElement('div');
    container.className = 'container player-container';

    const iframeUrl = type === 'movie'
        ? `https://vidsrc.xyz/embed/movie?tmdb=${id}`
        : `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=1&episode=1`; // Default to S1E1 for now

    container.innerHTML = `
    <div class="back-link" style="margin-bottom: 2rem;">
        <a href="/" id="back-home" style="display: flex; align-items: center; gap: 0.5rem; color: #a1a1aa;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Home
        </a>
    </div>
    <div class="iframe-wrapper">
      <iframe src="${iframeUrl}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>
    </div>
    <div style="margin-top: 1.5rem;">
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">Now Playing</h1>
        <p style="color: #a1a1aa;">If the video doesn't load, please try switching servers (Coming Soon).</p>
    </div>
  `;

    container.querySelector('#back-home').addEventListener('click', (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new Event('popstate'));
    });

    return container;
}
