
import { getImageUrl } from '../utils/api.js';

export function createCard(item) {
    const card = document.createElement('a');
    card.href = item.media_type === 'person' ? '#' : `/watch?id=${item.id}&type=${item.media_type || 'movie'}`;
    card.className = 'movie-card';
    card.dataset.id = item.id;
    card.dataset.type = item.media_type || 'movie';

    // Styling for the card is critical
    // We will insert specific styles into style.css later, but for now structure

    const imgUrl = getImageUrl(item.poster_path, 'w500');

    card.innerHTML = `
    <div class="card-image-wrapper">
      <img src="${imgUrl}" alt="${item.title || item.name}" loading="lazy" />
      <div class="card-overlay">
        <button class="play-btn">
          <svg viewBox="0 0 24 24" fill="currentColor" class="size-6"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clip-rule="evenodd" /></svg>
        </button>
      </div>
    </div>
    <div class="card-info">
      <h3>${item.title || item.name}</h3>
      <div class="meta">
        <span>${(item.release_date || item.first_air_date || '').split('-')[0]}</span>
        <span class="dot">•</span>
        <span>${item.media_type === 'tv' ? 'TV Show' : 'Movie'}</span>
      </div>
    </div>
  `;

    card.addEventListener('click', (e) => {
        e.preventDefault();
        window.history.pushState({}, '', card.href);
        window.dispatchEvent(new Event('popstate'));
    });

    return card;
}
