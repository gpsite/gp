
import { createCard } from './Card.js';

export function createSection(title, items) {
    const section = document.createElement('section');
    section.className = 'content-section';

    const header = document.createElement('div');
    header.className = 'section-header container';
    header.innerHTML = `<h2>${title}</h2>`;

    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'scroll-container';

    items.forEach(item => {
        if (item.poster_path) {
            scrollContainer.appendChild(createCard(item));
        }
    });

    section.appendChild(header);
    section.appendChild(scrollContainer);

    return section;
}
