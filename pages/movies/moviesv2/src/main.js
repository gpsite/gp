
import './style.css';
import { createHeader } from './components/Header.js';
import { createHero } from './components/Hero.js';
import { createSection } from './components/Section.js';
import { createPlayer } from './components/Player.js';
import { createCard } from './components/Card.js';
import { createPlatforms, createPlatformResults, createPlatformRow } from './components/Platforms.js';
import { HERO_Mock, fetchTrending, searchContent } from './utils/api.js';
import { fetchProviders, fetchByProvider } from './utils/api-platforms.js';

const app = document.querySelector('#app');

// Router
const router = async () => {
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname;

  app.innerHTML = '';
  app.appendChild(createHeader());

  const main = document.createElement('main');
  app.appendChild(main);

  if (path === '/') {
    await renderHome(main);
  } else if (path === '/watch') {
    const id = params.get('id');
    const type = params.get('type');
    if (id) {
      main.appendChild(createPlayer(id, type));
    }
  } else if (path === '/search') {
    const query = params.get('q');
    await renderSearch(main, query);
  } else if (path === '/platforms') {
    // Check if there is an ID in the path e.g. /platforms/8
    // Actually, simple path matching here is limited.
    // Let's use a simple split
    await renderPlatforms(main);
  } else if (path.startsWith('/platforms/')) {
    const providerId = path.split('/')[2];
    await renderPlatformResults(main, providerId);
  } else {
    await renderHome(main); // Fallback
  }
};

async function renderPlatforms(container) {
  const providers = await fetchProviders();
  container.appendChild(createPlatforms(providers));
}

async function renderPlatformResults(container, providerId) {
  // We need the provider name. Since we don't have a separate "getProviderDetails",
  // we can fetch the list again and find it, or pass it in state. Fetching list is safer.
  const providers = await fetchProviders();
  const provider = providers.find(p => p.provider_id.toString() === providerId);
  const providerName = provider ? provider.provider_name : 'Provider';

  const results = await fetchByProvider(providerId);

  // Create the structure
  const { container: resultsContainer, grid } = createPlatformResults(providerName, results);

  // Populate grid
  results.forEach(item => {
    if (item.poster_path) {
      grid.appendChild(createCard(item));
    }
  });

  // Add grid to container
  resultsContainer.appendChild(grid);
  container.appendChild(resultsContainer);
}

async function renderHome(container) {
  // Hero Section (Use Mock Data for visual stability or first trending item)
  // We'll use the first one from mock or trending
  const trending = await fetchTrending('all', 'day');
  const heroMovie = HERO_Mock[0] || trending[0];

  container.appendChild(createHero(heroMovie));

  // Platform Row
  const providers = await fetchProviders();
  container.appendChild(createPlatformRow(providers));

  // Trending Section
  container.appendChild(createSection('Trending Now', trending));

  // Popular Movies
  const popularMovies = await fetchTrending('movie', 'week');
  container.appendChild(createSection('Popular Movies', popularMovies));

  // Popular TV
  const popularTV = await fetchTrending('tv', 'week');
  container.appendChild(createSection('Popular TV Series', popularTV));
}

async function renderSearch(container, query) {
  container.innerHTML = `<div class="container" style="padding-top: 6rem;"><h2>Search Results for "${query}"</h2></div>`;

  if (!query) return;

  const results = await searchContent(query);
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
  grid.style.gap = '1rem';
  grid.style.padding = '1rem';
  grid.className = 'container';

  results.forEach(item => {
    if (item.poster_path) {
      grid.appendChild(createCard(item));
    }
  });

  container.appendChild(grid);
}

// History API handling
window.addEventListener('popstate', router);
router();
