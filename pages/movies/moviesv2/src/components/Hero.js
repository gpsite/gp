
import { getImageUrl } from '../utils/api.js';

export function createHero(movie) {
    const hero = document.createElement('div');
    hero.className = 'hero';

    const backdropUrl = getImageUrl(movie.backdrop_path, 'original');

    hero.innerHTML = `
    <img src="${backdropUrl}" class="hero-backdrop" alt="Hero Backdrop">
    <div class="hero-overlay"></div>
    <div class="hero-content container">
      <h1 class="hero-title animate-scale-in">${movie.title || movie.name}</h1>
      <div class="hero-meta">
        <span>${new Date(movie.release_date || movie.first_air_date).getFullYear()}</span>
        <span>•</span>
        <span>${movie.vote_average.toFixed(1)} Rating</span>
        <span>•</span>
        <span>${movie.media_type === 'tv' ? 'TV Series' : 'Movie'}</span>
      </div>
      <p class="hero-desc">${movie.overview}</p>
      <div class="hero-actions" style="display: flex; gap: 1rem;">
        <a href="/watch?id=${movie.id}&type=${movie.media_type || 'movie'}" class="btn btn-primary" id="hero-play" style="display: flex; align-items: center; gap: 0.5rem;">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clip-rule="evenodd" /></svg>
          Watch Now
        </a>
        <button class="btn btn-glass">Add to List</button>
      </div>
    </div>
  `;

    hero.querySelector('#hero-play').addEventListener('click', (e) => {
        e.preventDefault();
        window.history.pushState({}, '', e.currentTarget.getAttribute('href'));
        window.dispatchEvent(new Event('popstate'));
    });

    return hero;
}
