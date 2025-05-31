if (!window.__gamesScriptLoaded__) {
  window.__gamesScriptLoaded__ = true;

  // Declare game data
  let allGameData = [];

  // Google tag (gtag.js)
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', 'G-S8PZFKDPMN');

  const SHEET_URL = 'https://sheets.googleapis.com/v4/spreadsheets/1nw0SDop0IeFr6q776thp_eSCZZulaxZBtM55ECrHD5A/values/games?key=AIzaSyBdnupZe6bJH43XE0Hj77n0AmlR3wVfN9M';

  async function fetchGameData() {
    try {
      const response = await fetch(SHEET_URL);
      const data = await response.json();
      const rows = data.values;

      const headers = rows.shift();
      const titleIndex = headers.indexOf('Title');
      const categoryIndex = headers.indexOf('Category');
      const urlIndex = headers.indexOf('URL');
      const thumbnailIndex = headers.indexOf('Thumbnail');

      const gameMap = new Map();

      rows.forEach(row => {
        const title = row[titleIndex];
        const url = row[urlIndex];
        const thumbnail = row[thumbnailIndex];
        const rawCategories = row[categoryIndex];
        const categoryList = rawCategories ? rawCategories.split(',').map(c => c.trim().toLowerCase()) : [];

        const key = title.toLowerCase();

        if (!gameMap.has(key)) {
          gameMap.set(key, {
            title,
            url,
            thumbnail,
            categories: new Set(categoryList)
          });
        } else {
          categoryList.forEach(cat => gameMap.get(key).categories.add(cat));
        }
      });

      allGameData = Array.from(gameMap.values()).map(game => ({
        ...game,
        categories: Array.from(game.categories)
      }));

      displayGames(allGameData);
    } catch (error) {
      console.error('Error fetching game data:', error);
    }
  }

  function displayGames(games) {
    const container = document.getElementById('gamecards-container');
    container.innerHTML = '';

    if (games.length === 0) {
      container.innerHTML = '<p style="color: white; text-align: center;">Game not found.</p>';
      return;
    }

    const categories = {};

    games.forEach(game => {
      game.categories.forEach(category => {
        if (!categories[category]) categories[category] = [];
        categories[category].push(game);
      });
    });

    const categoryKeys = Object.keys(categories);

    categoryKeys.forEach((category, index) => {
      const categoryRow = document.createElement('div');
      categoryRow.className = 'category-row';

      const categoryTitle = document.createElement('div');
      categoryTitle.className = 'category-title';
      categoryTitle.textContent = category.toUpperCase();

      const categoryContainer = document.createElement('div');
      categoryContainer.className = 'category-container';

      categories[category].forEach(game => {
        const card = document.createElement('button');
        card.className = 'gamecard';
        card.onclick = () => {
          location.href = `game-frame/index.html?gameUrl=${encodeURIComponent(game.url)}`;
        };

        const img = document.createElement('img');
        img.src = game.thumbnail;
        img.alt = game.title;

        const overlay = document.createElement('div');
        overlay.className = 'overlay';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'title';
        titleSpan.textContent = game.title;

        overlay.appendChild(titleSpan);
        card.appendChild(img);
        card.appendChild(overlay);
        categoryContainer.appendChild(card);
      });

      const leftArrow = document.createElement('button');
      leftArrow.className = 'scroll-arrow left';
      leftArrow.innerHTML = '&#9664;';
      leftArrow.onclick = () => scrollCategory(categoryContainer, 'left');

      const rightArrow = document.createElement('button');
      rightArrow.className = 'scroll-arrow right';
      rightArrow.innerHTML = '&#9654;';
      rightArrow.onclick = () => scrollCategory(categoryContainer, 'right');

      categoryRow.appendChild(leftArrow);
      categoryRow.appendChild(categoryTitle);
      categoryRow.appendChild(categoryContainer);
      categoryRow.appendChild(rightArrow);

      container.appendChild(categoryRow);

      if (index < categoryKeys.length - 1) {
        const line = document.createElement('div');
        line.className = 'line';
        const randomDelay = Math.random() * 5;
        line.style.setProperty('--random-delay', `${randomDelay}s`);
        container.appendChild(line);
      }
    });
  }

  function searchGameCards() {
    const input = document.querySelector('.search-bar').value.toLowerCase().trim();
    const dropdown = document.getElementById('category-dropdown').value.toLowerCase();
    const container = document.getElementById('gamecards-container');

    if (input === "" && dropdown === "") {
      displayGames(allGameData);
      return;
    }

    container.innerHTML = "";

    const filteredGames = allGameData.filter(game => {
      const titleMatch = input === "" || game.title.toLowerCase().includes(input);
      const categoryMatch = dropdown === "" || game.categories.some(cat => cat.toLowerCase() === dropdown);
      return titleMatch && categoryMatch;
    });

    if (filteredGames.length === 0) {
      container.innerHTML = '<p style="color: white; text-align: center;">Game not found.</p>';
      return;
    }

    filteredGames.forEach(game => {
      const card = document.createElement('button');
      card.className = 'gamecard';
      card.onclick = () => {
        location.href = `game-frame/index.html?gameUrl=${encodeURIComponent(game.url)}`;
      };

      card.innerHTML = `
        <img src="${game.thumbnail}" alt="${game.title}">
        <div class="title">${game.title}</div>
      `;

      container.appendChild(card);
    });
  }

  function scrollCategory(container, direction) {
    const scrollAmount = 300;
    const currentScroll = container.scrollLeft;
    const targetScroll = direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount;

    const startTime = performance.now();
    const duration = 10;

    function animateScroll(currentTime) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

      container.scrollLeft = currentScroll + (targetScroll - currentScroll) * ease;

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    }

    requestAnimationFrame(animateScroll);
  }

  function shuffleGameCards() {
    // Optional future functionality
  }

  // Load navbar and data
  document.addEventListener('DOMContentLoaded', () => {
    fetchGameData();

    fetch('https://georgepickenssite.github.io/georgepickens/dev/navbar.html')
      .then(response => response.text())
      .then(data => {
        const template = document.createElement('template');
        template.innerHTML = data;
        const navbar = template.content.querySelector('#navbar-template').content;
        document.getElementById('navbar').appendChild(navbar);
      });

    const lines = document.querySelectorAll('.line');
    lines.forEach(line => {
      const randomDelay = Math.random() * 5;
      line.style.setProperty('--random-delay', `${randomDelay}s`);
    });
  });
}
