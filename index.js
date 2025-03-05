function searchGameCards() {
    const input = document.querySelector('.search-bar');
    const filter = input.value.toLowerCase();
    const gamecards = document.querySelectorAll('.gamecard');

    gamecards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(filter)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function shuffleGameCards() {
    const container = document.getElementById('gamecards-container');
    const cards = Array.from(container.children);
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        container.appendChild(cards[j]);
    }
}

document.addEventListener('DOMContentLoaded', shuffleGameCards);

fetch('dev/navbar.html')
            .then(response => response.text())
            .then(data => {
                const template = document.createElement('template');
                template.innerHTML = data;
                const navbar = template.content.querySelector('#navbar-template').content;
                document.getElementById('navbar').appendChild(navbar);
            });