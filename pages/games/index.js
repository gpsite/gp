// --- THEME ENGINE ---
    const html = document.documentElement;
    const currentTheme = localStorage.getItem('gp-final-theme') || 'dark';
    html.setAttribute('data-theme', currentTheme);

    window.addEventListener('storage', (e) => {
      if (e.key === 'gp-final-theme') {
        html.setAttribute('data-theme', e.newValue);
      }
    });

    // --- DATA & LOGIC ---
    const SHEET_URL = 'https://sheets.googleapis.com/v4/spreadsheets/1nw0SDop0IeFr6q776thp_eSCZZulaxZBtM55ECrHD5A/values/games?key=AIzaSyBdnupZe6bJH43XE0Hj77n0AmlR3wVfN9M';

    let allGames = [];
    let categories = new Set();
    let fuse;
    let currentGameUrl = null;

    const topGrid = document.getElementById('topGrid');
    const mainGrid = document.getElementById('mainGrid');
    const searchInput = document.getElementById('searchInput');
    const filterBtn = document.getElementById('filterBtn');
    const filterMenu = document.getElementById('filterMenu');
    const gameOverlay = document.getElementById('gameOverlay');
    const gameWrapper = document.getElementById('gameWrapper');
    const gameContainer = document.getElementById('gameContainer');
    const videoLoader = document.getElementById('videoLoader');

    const favBtn = document.getElementById('favBtn');
    const favModal = document.getElementById('favModal');
    const closeFavBtn = document.getElementById('closeFavBtn');
    const favList = document.getElementById('favList');
    const overlayFavBtn = document.getElementById('overlayFavBtn');

    let favorites = JSON.parse(localStorage.getItem('gp-favorites')) || [];

    async function fetchGames() {
      try {
        const res = await fetch(SHEET_URL);
        const data = await res.json();
        const rows = data.values;
        const headers = rows.shift(); // Remove header row

        const titleIdx = headers.indexOf('Title');
        const catIdx = headers.indexOf('Category');
        const urlIdx = headers.indexOf('URL');
        const thumbIdx = headers.indexOf('Thumbnail');

        allGames = rows.map(row => {
          let rawTitle = row[titleIdx] || '';
          let isFeatured = false;

          // Check for * prefix (handle optional space)
          if (rawTitle.trim().startsWith('*')) {
            isFeatured = true;
            rawTitle = rawTitle.trim().substring(1).trim();
          }

          const cats = row[catIdx] ? row[catIdx].split(',').map(c => c.trim()) : [];
          cats.forEach(c => categories.add(c));

          return {
            title: rawTitle,
            isFeatured: isFeatured,
            categories: cats,
            url: row[urlIdx] ? row[urlIdx].trim() : '',
            thumbnail: row[thumbIdx],
            titleNoSpace: rawTitle.toLowerCase().replace(/\s+/g, '')
          };
        }).filter(g => g.title && g.url);

        initFuse();
        populateFilters();
        renderAll(allGames);
        lucide.createIcons();

      } catch (err) {
        console.error('Failed to load games:', err);
        topGrid.innerHTML = '<div class="loader" style="color:var(--accent);">Failed to load games. Check connection.</div>';
      }
    }

    function initFuse() {
      fuse = new Fuse(allGames, {
        keys: [
          { name: 'title', weight: 0.7 },
          { name: 'titleNoSpace', weight: 0.5 },
          { name: 'categories', weight: 0.3 }
        ],
        threshold: 0.4,
        distance: 100,
        includeScore: true
      });
    }

    function populateFilters() {
      filterMenu.innerHTML = '<div class="filter-option" onclick="filterBy(\'All\')">All Categories</div>';
      const sortedCats = Array.from(categories).sort();
      sortedCats.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'filter-option';
        div.textContent = cat;
        div.onclick = () => filterBy(cat);
        filterMenu.appendChild(div);
      });
    }

    function filterBy(cat) {
      filterMenu.classList.remove('active');
      if (cat === 'All') {
        renderAll(allGames);
      } else {
        const filtered = allGames.filter(g => g.categories.includes(cat));
        renderAll(filtered);
      }
    }

    // Toggle Filter Menu
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      filterMenu.classList.toggle('active');
    });

    // Close menu on click outside
    document.addEventListener('click', (e) => {
      if (!filterMenu.contains(e.target) && !filterBtn.contains(e.target)) {
        filterMenu.classList.remove('active');
      }
    });

    // --- FAVORITES SYSTEM ---
    function updateFavoritesUI() {
      if (!favorites || favorites.length === 0) {
        favList.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-secondary);">No favorites yet.</div>';
        return;
      }

      favList.innerHTML = '';
      favorites.forEach(gameTitle => {
        const game = allGames.find(g => g.title === gameTitle);
        if (!game) return;

        const item = document.createElement('div');
        item.className = 'fav-item';
        item.innerHTML = `
                <img src="${game.thumbnail || 'https://via.placeholder.com/40'}" alt="${game.title}">
                <div class="fav-item-info">
                    <div class="fav-item-title">${game.title}</div>
                </div>
                <button class="fav-item-remove" onclick="removeFavorite('${game.title}', event)"><i data-lucide="trash-2"></i></button>
            `;
        item.addEventListener('click', (e) => {
          if (!e.target.closest('.fav-item-remove')) {
            closeFavMenu();
            openGame(game);
          }
        });
        favList.appendChild(item);
      });
      lucide.createIcons();
    }

    function removeFavorite(title, e) {
      if (e) e.stopPropagation();
      favorites = favorites.filter(t => t !== title);
      localStorage.setItem('gp-favorites', JSON.stringify(favorites));
      updateFavoritesUI();

      // Update overlay button if currently open game is removed
      if (currentGameUrl) {
        const openGameObj = allGames.find(g => g.url === currentGameUrl);
        if (openGameObj && openGameObj.title === title) {
          checkOverlayFavStatus(openGameObj);
        }
      }
    }

    function toggleCurrentFavorite() {
      if (!currentGameUrl) return;
      const game = allGames.find(g => g.url === currentGameUrl);
      if (!game) return;

      const index = favorites.indexOf(game.title);
      if (index === -1) {
        favorites.push(game.title);
      } else {
        favorites.splice(index, 1);
      }
      localStorage.setItem('gp-favorites', JSON.stringify(favorites));
      checkOverlayFavStatus(game);
      updateFavoritesUI();
    }

    function checkOverlayFavStatus(game) {
      if (!game) return;
      const isFav = favorites.includes(game.title);

      // Lucide replaces <i> with <svg> at runtime, so we must check for both.
      // We prioritize SVG if it exists.
      const icon = overlayFavBtn.querySelector('svg') || overlayFavBtn.querySelector('i');

      // Safety check: if icon is not found for some reason, abort to prevent crash
      if (!icon) return;

      if (isFav) {
        overlayFavBtn.style.background = 'var(--accent)';
        overlayFavBtn.style.color = '#fff';
        // Removed fill as requested by user
        if (icon.hasAttribute('fill')) icon.removeAttribute('fill');
      } else {
        overlayFavBtn.style.background = '';
        overlayFavBtn.style.color = '';
        if (icon.hasAttribute('fill')) icon.removeAttribute('fill');
      }
    }

    // Modal Events
    favBtn.addEventListener('click', () => {
      updateFavoritesUI();
      favModal.classList.add('active');
      document.body.classList.add('no-scroll');
      document.body.classList.add('blur-active');
    });

    function closeFavMenu() {
      favModal.classList.remove('active');
      document.body.classList.remove('no-scroll');
      document.body.classList.remove('blur-active');
    }

    closeFavBtn.addEventListener('click', closeFavMenu);

    // Close on outside click
    document.addEventListener('mousedown', (e) => {
      if (favModal.classList.contains('active') &&
        !favModal.contains(e.target) &&
        !favBtn.contains(e.target)) {
        closeFavMenu();
      }
    });

    function createCard(game) {
      const card = document.createElement('div');
      card.className = 'game-card';
      card.innerHTML = `
                <div class="card-image-wrapper">
                    <img src="${game.thumbnail || 'https://via.placeholder.com/300?text=No+Image'}" alt="${game.title}" loading="lazy">
                </div>
                <div class="card-info">
                    <div class="card-title">${game.title}</div>
                    <div class="card-meta">${game.categories.slice(0, 2).join(', ')}</div>
                </div>
            `;
      card.onclick = () => openGame(game);
      return card;
    }

    function renderAll(games) {
      topGrid.innerHTML = '';
      mainGrid.innerHTML = '';

      if (games.length === 0) {
        topGrid.innerHTML = '<div class="loader">No games found.</div>';
        return;
      }

      const isFullList = games.length === allGames.length;

      if (isFullList) {
        // Default View: Featured (*) in Top Grid, Rest in Main
        const featured = games.filter(g => g.isFeatured);
        const rest = games.filter(g => !g.isFeatured);

        if (featured.length > 0) {
          featured.forEach(g => topGrid.appendChild(createCard(g)));
        } else {
          topGrid.style.display = 'none'; // Hide if none
          document.querySelector('.featured-divider').style.display = 'none';
        }

        rest.forEach(g => mainGrid.appendChild(createCard(g)));
      } else {
        // Search Results / Filter View: Hide Featured Section, dump all in Main for clarity
        topGrid.style.display = 'none';
        document.querySelector('.featured-divider').style.display = 'none';
        games.forEach(g => mainGrid.appendChild(createCard(g)));
      }

      // Re-show sections if we reset and there are featured games
      if (isFullList && topGrid.children.length > 0) {
        topGrid.style.display = 'grid';
        document.querySelector('.featured-divider').style.display = 'flex';
      }
    }

    // --- SEARCH ---
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {
        if (!query) {
          renderAll(allGames);
          return;
        }

        if (fuse) {
          const results = fuse.search(query).map(r => r.item);
          renderAll(results);
        }
      }, 300);
    });

    // --- OVERLAY & PLAYER ---

    async function openGame(game) {
      currentGameUrl = game.url;

      // Ensure Favorites Menu is closed and effects are reset
      favModal.classList.remove('active');
      document.body.classList.remove('blur-active');

      // 1. Reset & Show Overlay with Loader
      gameContainer.innerHTML = '';
      videoLoader.style.display = 'flex';
      gameOverlay.style.display = 'flex';
      requestAnimationFrame(() => gameOverlay.classList.add('active'));
      document.body.classList.add('no-scroll');

      checkOverlayFavStatus(game);

      // 2. Determine Type
      // Check for .swf (case insensitive, allowing query params)
      const isSwf = /\.swf($|\?)/i.test(game.url);

      if (isSwf) {
        await loadSwfGame(game.url);
      } else {
        await loadIframeGame(game.url);
      }
    }

    function loadSwfGame(url) {
      return new Promise((resolve) => {
        // Create Ruffle Player
        const ruffle = window.RufflePlayer.newest();
        const player = ruffle.createPlayer();

        player.style.width = '100%';
        player.style.height = '100%';
        player.id = 'gameObject'; // for fullscreen

        // Hide initially
        player.style.opacity = '0';
        player.style.transition = 'opacity 0.5s ease';

        gameContainer.appendChild(player);

        // Load
        player.load(url).then(() => {
          console.log("Ruffle loaded SWF");
          // 2-second delay for branding/smoothness
          setTimeout(() => {
            videoLoader.style.display = 'none';
            player.style.opacity = '1';
            resolve();
          }, 2000);
        }).catch(e => {
          console.error("Ruffle failed to load:", e);
          videoLoader.innerHTML = '<div style="color:red">Failed to load content.</div>';
        });
      });
    }

    function loadIframeGame(url) {
      return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.allow = "autoplay; fullscreen";
        iframe.id = "gameIframe";
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.opacity = '0';
        iframe.style.transition = 'opacity 0.5s ease';

        iframe.onload = () => {
          setTimeout(() => {
            videoLoader.style.display = 'none';
            iframe.style.opacity = '1';
            resolve();
          }, 2000); // 2 second delay
        };

        gameContainer.appendChild(iframe);
      });
    }

    function closeOverlay() {
      gameOverlay.classList.remove('active');
      document.body.classList.remove('no-scroll');
      document.body.classList.remove('blur-active'); // Force removal of blur
      currentGameUrl = null;
      setTimeout(() => {
        gameOverlay.style.display = 'none';
        gameContainer.innerHTML = '';
        videoLoader.style.display = 'none'; // reset
      }, 300);
    }

    function toggleFullscreen() {
      const el = document.querySelector("#gameIframe") || document.querySelector("#gameObject");
      if (!el) return;
      if (!document.fullscreenElement) {
        el.requestFullscreen().catch(err => console.error(err));
      } else {
        document.exitFullscreen();
      }
    }

    function openWindowed() {
      if (!currentGameUrl) return;

      const win = window.open('about:blank', '_blank');
      if (!win) return;

      // Check for .swf (case insensitive, allowing query params)
      const isSwf = /\.swf($|\?)/i.test(currentGameUrl);

      if (isSwf) {
        // Embed Ruffle in new window
        win.document.write(`
          <!DOCTYPE html>
          <html style="margin:0; padding:0; height:100%; overflow:hidden; background:#000;">
          <head>
            <title>GEORGE PICKENS</title>
            <script src="https://unpkg.com/@ruffle-rs/ruffle"><\/script>
            <style>
              body { margin:0; padding:0; height:100vh; width:100vw; background:#000; display:flex; justify-content:center; align-items:center; overflow:hidden; font-family: sans-serif; }
              #player { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.5s; }
              ruffle-player { width: 100vh !important; height: 100vh !important; }
              
              /* Loader */
              .video-loader {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: #000;
                z-index: 10;
              }
              .spinner {
                width: 50px;
                height: 50px;
                border: 3px solid rgba(255, 255, 255, 0.1);
                border-top-color: #60a5fa;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 15px;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
              .loader-text {
                color: #fff;
                font-size: 14px;
                letter-spacing: 1px;
                text-transform: uppercase;
                opacity: 0.8;
                font-weight: 500;
              }
            </style>
          </head>
          <body>
            <div class="video-loader" id="loader">
              <div class="spinner"></div>
              <div class="loader-text">George Pickens</div>
            </div>
            <div id="player"></div>
            
              window.RufflePlayer = window.RufflePlayer || {};
              window.addEventListener('DOMContentLoaded', () => {
                  const ruffle = window.RufflePlayer.newest();
                  const player = ruffle.createPlayer();
                  const container = document.getElementById('player');
                  const loader = document.getElementById('loader');
                  
                  container.appendChild(player);
                  
                  player.load("${currentGameUrl}").then(() => {
                    setTimeout(() => {
                      loader.style.display = 'none';
                      container.style.opacity = '1';
                    }, 2000);
                  });
              });
            <\/script>
          </body>
          </html>
        `);
        win.document.close();
      } else {
        // Generic Iframe
        win.document.write(`
          <!DOCTYPE html>
          <html style="margin:0; padding:0; height:100%; overflow:hidden; background:#000;">
          <head>
            <title>GEORGE PICKENS</title>
            <style>
              body { margin:0; padding:0; height:100vh; width:100vw; background:#000; overflow:hidden; font-family: sans-serif; }
              iframe { border:0; width:100vw; height:100vh; opacity: 0; transition: opacity 0.5s; }
              
              /* Loader */
              .video-loader {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: #000;
                z-index: 10;
              }
              .spinner {
                width: 50px;
                height: 50px;
                border: 3px solid rgba(255, 255, 255, 0.1);
                border-top-color: #60a5fa;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 15px;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
              .loader-text {
                color: #fff;
                font-size: 14px;
                letter-spacing: 1px;
                text-transform: uppercase;
                opacity: 0.8;
                font-weight: 500;
              }
            </style>
          </head>
          <body>
            <div class="video-loader" id="loader">
              <div class="spinner"></div>
              <div class="loader-text">George Pickens</div>
            </div>
            <iframe id="gameFrame" src="${currentGameUrl}" allow="autoplay; fullscreen"></iframe>
            
              const iframe = document.getElementById('gameFrame');
              const loader = document.getElementById('loader');
              
              iframe.onload = () => {
                setTimeout(() => {
                  loader.style.display = 'none';
                  iframe.style.opacity = '1';
                }, 2000);
              };
            <\/script>
          </body>
          </html>
        `);
        win.document.close();
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && gameOverlay.classList.contains('active')) {
        closeOverlay();
      }
    });

    fetchGames();