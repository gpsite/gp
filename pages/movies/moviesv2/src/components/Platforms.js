
import { getImageUrl } from '../utils/api.js';

export function createPlatforms(providers) {
    const container = document.createElement('div');
    container.className = 'container';
    container.style.paddingTop = '6rem';

    const title = document.createElement('h2');
    title.textContent = 'Browse by Platform';
    title.style.marginBottom = '2rem';
    container.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'platforms-grid';
    // Add styles for this grid to style.css

    providers.forEach(provider => {
        const card = document.createElement('div');
        card.className = 'platform-card';
        card.style.cursor = 'pointer';

        const logoUrl = getImageUrl(provider.logo_path, 'original'); // Logos are small

        card.innerHTML = `
            <div class="platform-logo-wrapper">
                <img src="${logoUrl}" alt="${provider.provider_name}" />
            </div>
            <span class="platform-name">${provider.provider_name}</span>
        `;

        card.addEventListener('click', () => {
            window.history.pushState({}, '', `/platforms/${provider.provider_id}`);
            window.dispatchEvent(new Event('popstate'));
        });

        grid.appendChild(card);
    });

    container.appendChild(grid);
    return container;
}

export function createPlatformResults(providerName, items) {
    // Re-use Card Grid logic or Section logic
    const container = document.createElement('div');
    container.className = 'container';
    container.style.paddingTop = '6rem';

    container.innerHTML = `
        <div style="margin-bottom: 2rem; display: flex; align-items: center; gap: 1rem;">
             <a href="/platforms" class="btn btn-glass" style="padding: 0.5rem 1rem; border-radius: 999px; text-decoration: none;">← Back</a>
             <h2>Popular on ${providerName}</h2>
        </div>
      `;

    // Import createCard dynamically or pass it in? 
    // Better to assume global or imported at top of file.
    // For now, let's just make the grid structure and fill it in main.js

    const grid = document.createElement('div');
    grid.className = 'movies-grid'; // Re-use or create new
    // We will populate this in main.js to keep imports clean or import createCard here

    return { container, grid };
}

export function createPlatformRow(providers) {
    const rowContainer = document.createElement('div');
    rowContainer.className = 'container platform-row-container';

    // Header
    const header = document.createElement('div');
    header.className = 'platform-row-header';
    header.innerHTML = `
        <h2>Browse by Platform</h2>
        <a href="/platforms" class="text-sm" style="color: #a1a1aa; text-decoration: none; font-size: 0.875rem;">View All</a>
    `;
    rowContainer.appendChild(header);

    // Scroll Wrapper
    const scrollWrapper = document.createElement('div');
    scrollWrapper.className = 'platform-scroll-wrapper';

    // Target specific platforms with specific brands and high-quality SVGs
    const targetPlatforms = [
        { name: 'Netflix', brand: 'brand-netflix', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg' },
        { name: 'Disney Plus', brand: 'brand-disney', logo: 'https://commons.wikimedia.org/wiki/Special:FilePath/Disney+_logo.svg' },
        { name: 'Amazon Prime Video', brand: 'brand-prime', logo: 'https://commons.wikimedia.org/wiki/Special:FilePath/Amazon_Prime_Video_logo.svg' },
        { name: 'Max', brand: 'brand-max', logo: 'https://commons.wikimedia.org/wiki/Special:FilePath/Max_logo.svg' },
        { name: 'Paramount+', brand: 'brand-paramount', logo: 'https://commons.wikimedia.org/wiki/Special:FilePath/Paramount+_logo.svg' },
        { name: 'Hulu', brand: 'brand-hulu', logo: 'https://commons.wikimedia.org/wiki/Special:FilePath/Hulu_logo_(2014).svg' },
        { name: 'Crunchyroll', brand: 'brand-crunchyroll', logo: 'https://commons.wikimedia.org/wiki/Special:FilePath/Crunchyroll_Logo.svg' }
    ];

    targetPlatforms.forEach(target => {
        // Find provider
        const provider = providers.find(p => p.provider_name.includes(target.name) || target.name.includes(p.provider_name));

        if (!provider) return;

        const card = document.createElement('div');
        card.className = `platform-card-tmovie ${target.brand}`;
        card.title = provider.provider_name;

        // Use the specific high-quality SVG if defined, otherwise fallback to TMDB
        const logoUrl = target.logo || getImageUrl(provider.logo_path, 'original');

        card.innerHTML = `
            <div class="platform-bg-gradient"></div>
            <div class="platform-content">
                <img src="${logoUrl}" alt="${provider.provider_name}">
            </div>
            <div class="platform-label-overlay">
                <p class="platform-name-text">${provider.provider_name}</p>
            </div>
            <div class="platform-shine">
                <div class="shine-inner"></div>
            </div>
        `;

        card.addEventListener('click', () => {
            window.history.pushState({}, '', `/platforms/${provider.provider_id}`);
            window.dispatchEvent(new Event('popstate'));
        });

        scrollWrapper.appendChild(card);
    });

    // "View All" card
    const seeAllCard = document.createElement('div');
    seeAllCard.className = 'platform-see-all-card';
    seeAllCard.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        <span style="font-size: 0.875rem; font-weight: 500;">View All</span>
    `;
    seeAllCard.addEventListener('click', () => {
        window.history.pushState({}, '', '/platforms');
        window.dispatchEvent(new Event('popstate'));
    });
    scrollWrapper.appendChild(seeAllCard);

    rowContainer.appendChild(scrollWrapper);

    return rowContainer;
}
