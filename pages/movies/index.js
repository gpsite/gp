// CONFIG & STATE
        const CONFIG_SHEET_URL = "https://sheets.googleapis.com/v4/spreadsheets/1nw0SDop0IeFr6q776thp_eSCZZulaxZBtM55ECrHD5A/values/movies?key=AIzaSyBdnupZe6bJH43XE0Hj77n0AmlR3wVfN9M";
        let GP_BASE = "";
        let TVMAZE_API = "";
        let TMDB_API_KEY = ""; // Loaded from Sheet

        // TESTING: Uncomment the line below to use local proxy instead of AWS
        // GP_BASE = "http://localhost:8080/";

        // Dynamic List (Populated from Sheet)
        let DYNAMIC_LIST = [];

        let allMovies = [];
        let currentMovie = null;
        let currentSeason = 1;
        let currentEpisode = 1;
        let tvCache = {};
        let watchTimer = null;

        // Performance: Cache IMDb API responses
        const imdbCache = new Map();
        let isSearching = false; // Prevent duplicate searches
        let searchController = null; // AbortController for cancelling searches
        let fuseInstance = null; // Fuse.js instance for local search

        // Local Storage Lists
        let favorites = JSON.parse(localStorage.getItem('gp-movie-favorites')) || [];
        let watched = JSON.parse(localStorage.getItem('gp-movie-watched')) || [];

        // Theme Init
        const html = document.documentElement;
        const currentTheme = localStorage.getItem('gp-final-theme') || 'dark';
        html.setAttribute('data-theme', currentTheme);

        window.addEventListener('storage', (e) => {
            if (e.key === 'gp-final-theme') {
                html.setAttribute('data-theme', e.newValue);
            }
        });

        // DOM ELEMENTS
        const heroTitle = document.getElementById('heroTitle');
        const heroBg = document.getElementById('heroBg');
        const heroMeta = document.getElementById('heroMeta');
        const heroDesc = document.getElementById('heroDesc');
        const heroPlayBtn = document.getElementById('heroPlayBtn');
        const movieGrid = document.getElementById('movieGrid');
        const gridTitle = document.getElementById('gridTitle');

        // Modal / Overlay Elements
        const overlay = document.getElementById('overlay');
        const favModal = document.getElementById('favModal');
        const watchedModal = document.getElementById('watchedModal');

        // --- FETCH & INIT ---
        async function init() {
            lucide.createIcons();

            // 1. Config & Library
            await fetchConfigAndLibrary();

            // Loading State
            heroTitle.innerText = "Loading Library...";
            heroTitle.parentElement.classList.add('loading-pulse');

            // 2. Parallel Fetch (OPTIMIZED: Limit to first 20 for faster load)
            const listToLoad = DYNAMIC_LIST.length > 0 ? DYNAMIC_LIST.slice(0, 20) : ["The Matrix"];

            const promises = listToLoad.map(title => fetchMovie(title));
            const results = await Promise.all(promises);

            allMovies = results.filter(m => m).map(m => ({
                id: m.id,
                title: m.title,
                titleNoSpace: m.title.toLowerCase().replace(/\s+/g, ''),
                original_title: m.title, // IMDb "l" is the title
                overview: m.overview, // Subtitle from IMDb
                date: m.date,
                poster: m.poster,
                rating: 'N/A', // IMDb suggest doesn't give rating
                type: 'movie' // Default, suggest doesn't explicitly distinguish easy
            }));

            // Clear loading
            heroTitle.parentElement.classList.remove('loading-pulse');

            if (allMovies.length > 0) {
                setupHero(allMovies);
                renderGrid(allMovies);
            } else {
                heroTitle.innerText = "Failed to Load";
                heroDesc.innerText = "Could not load the movie library. Please check the configuration.";
            }
        }

        async function fetchConfigAndLibrary() {
            try {
                const res = await fetch(CONFIG_SHEET_URL);
                const data = await res.json();
                if (data && data.values) {
                    // Config (Rows 2-6 approx, generic loop)
                    data.values.slice(1).forEach((row) => {
                        const key = row[0]; const value = row[1];
                        if (key === 'GP_BASE') GP_BASE = value;
                        if (key === 'TVMAZE_API') TVMAZE_API = value;
                        if (key === 'TMDB_API_KEY') TMDB_API_KEY = value;
                    });

                    // Dynamic Titles: Column C (Index 2), Starting Row 7 (Index 6)
                    const titleRows = data.values.slice(6);
                    DYNAMIC_LIST = titleRows
                        .map(row => row[2]) // Column C
                        .filter(t => t && t.trim().length > 0); // content only

                    console.log("Loaded Titles:", DYNAMIC_LIST.length);
                }
            } catch (err) {
                console.error("Config Error", err);
            }
        }

        async function fetchImdb(query, signal = null) {
            try {
                const safeQuery = query.toLowerCase().trim();
                if (!safeQuery) return [];

                // OPTIMIZATION: Check cache first
                if (imdbCache.has(safeQuery)) {
                    console.log('Using cached result for:', safeQuery);
                    return imdbCache.get(safeQuery);
                }

                const firstChar = safeQuery.charAt(0);
                // Construct IMDb Suggest URL
                const imdbUrl = `https://sg.media-imdb.com/suggests/${firstChar}/${encodeURIComponent(safeQuery)}.json`;

                // Use Proxy
                const proxyUrl = GP_BASE + imdbUrl;

                const res = await fetch(proxyUrl, { signal });
                const text = await res.text();

                // Parse JSONP: imdb$query({...})
                const jsonStart = text.indexOf('(');
                const jsonEnd = text.lastIndexOf(')');
                if (jsonStart === -1 || jsonEnd === -1) return [];

                const jsonStr = text.substring(jsonStart + 1, jsonEnd);
                const data = JSON.parse(jsonStr);

                if (data && data.d) {
                    // OPTIMIZATION: Limit to 20 results max to reduce DOM load
                    const results = data.d.slice(0, 20).map(item => {
                        // CRITICAL: Parse type from IMDb 'q' field
                        // q can be: "feature", "TV series", "TV mini-series", "video", etc.
                        let itemType = 'movie'; // default
                        if (item.q) {
                            const qLower = item.q.toLowerCase();
                            if (qLower.includes('tv') || qLower.includes('series')) {
                                itemType = 'tv';
                            }
                        }

                        return {
                            id: item.id,
                            title: item.l,
                            poster: item.i ? item.i[0] : null,
                            date: item.y ? item.y.toString() : (item.s && item.s.match(/\d{4}/) ? item.s.match(/\d{4}/)[0] : ''),
                            overview: item.s || '', // Use the subtitle as overview
                            type: itemType
                        };
                    });

                    // OPTIMIZATION: Cache the results
                    imdbCache.set(safeQuery, results);
                    return results;
                }
            } catch (e) {
                if (e.name === 'AbortError') {
                    console.log('Search cancelled:', query);
                } else {
                    console.warn("IMDb Fetch Error", query, e);
                }
            }
            return [];
        }

        async function fetchMovie(title) {
            const results = await fetchImdb(title);
            if (results && results.length > 0) {
                // Try to find exact match
                const exact = results.find(r => r.title.toLowerCase() === title.toLowerCase());
                return exact || results[0];
            }
            return null;
        }

        async function searchMovies(query) {
            return await fetchImdb(query);
        }

        // --- RENDERING ---
        function posterUrl(path) {
            // IMDb returns full URLs
            if (path && path.startsWith('http')) return path;
            return path || ''; // Fallback
        }

        function setupHero(movies) {
            const featured = movies[Math.floor(Math.random() * movies.length)];
            heroTitle.innerText = featured.title;
            heroDesc.innerText = featured.overview;
            heroMeta.innerHTML = `
                <span>${featured.date?.split('-')[0]}</span>
                <span>•</span>
                <span><i data-lucide="star" style="width:16px; display:inline;"></i> ${featured.rating}</span>
            `;
            heroBg.style.backgroundImage = `url('${posterUrl(featured.poster)}')`;
            heroPlayBtn.onclick = () => openOverlay(featured);
            // Icons will be created once at init
        }

        function renderGrid(movies) {
            movieGrid.innerHTML = '';
            movies.forEach(m => {
                const card = document.createElement('div');
                card.className = 'movie-card';
                card.innerHTML = `
                    <img src="${posterUrl(m.poster)}" loading="lazy">
                    <div class="movie-info-mini">
                        <div class="movie-title">${m.title}</div>
                        <div class="movie-year">${m.date?.split('-')[0]}</div>
                    </div>
                `;
                card.onclick = () => openOverlay(m);
                movieGrid.appendChild(card);
            });
        }

        // --- SEARCH ---
        const searchInput = document.getElementById('searchInput');
        let searchDebounce;
        searchInput.addEventListener('input', (e) => {
            const q = e.target.value.trim();
            clearTimeout(searchDebounce);

            // Cancel any pending search requests
            if (searchController) {
                searchController.abort();
                searchController = null;
            }

            searchDebounce = setTimeout(async () => {
                if (!q) {
                    renderGrid(allMovies);
                    gridTitle.innerText = "Featured";
                    isSearching = false;
                    return;
                }

                // OPTIMIZATION: Minimum 2 characters before searching
                if (q.length < 2) {
                    gridTitle.innerText = "Type at least 2 characters...";
                    movieGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;">Type at least 2 characters to search</div>';
                    return;
                }

                // OPTIMIZATION: Prevent duplicate searches
                if (isSearching) return;
                isSearching = true;

                gridTitle.innerText = `Searching for "${q}"...`;
                movieGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;">Searching...</div>';

                // TWO-TIER SEARCH STRATEGY
                let localResults = [];
                let externalResults = [];

                // 1. FIRST: Search locally with Fuse.js for instant results
                if (!fuseInstance && allMovies.length > 0) {
                    fuseInstance = new Fuse(allMovies, {
                        keys: ['title', 'original_title'],
                        threshold: 0.3,
                        ignoreLocation: true
                    });
                }

                if (fuseInstance) {
                    const fuseResults = fuseInstance.search(q);
                    localResults = fuseResults.map(r => r.item);

                    // Show local results immediately if found
                    if (localResults.length > 0) {
                        renderGrid(localResults);
                        gridTitle.innerText = `Found ${localResults.length} local result${localResults.length !== 1 ? 's' : ''} for "${q}"`;
                    }
                }

                // 2. SECOND: If local results < 5, augment with external API
                // OPTIMIZATION: Only call API if we don't already have enough results
                if (localResults.length < 5) {
                    try {
                        searchController = new AbortController();
                        externalResults = await fetchImdb(q, searchController.signal);
                        searchController = null;

                        // Merge and deduplicate results
                        const allResults = [...localResults];
                        externalResults.forEach(ext => {
                            if (!allResults.find(loc => loc.id === ext.id)) {
                                allResults.push(ext);
                            }
                        });

                        if (allResults.length > 0) {
                            renderGrid(allResults);
                            gridTitle.innerText = `Found ${allResults.length} result${allResults.length !== 1 ? 's' : ''} for "${q}"`;
                        } else {
                            movieGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;">No results found.</div>';
                            gridTitle.innerText = `No results for "${q}"`;
                        }
                    } catch (e) {
                        // If aborted, local results are already shown
                        if (e.name !== 'AbortError') {
                            console.error('Search error:', e);
                        }
                        // If error and we have local results, keep showing them
                        if (localResults.length > 0) {
                            // Already rendered above, do nothing
                        } else {
                            movieGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;">Search failed. Please try again.</div>';
                            gridTitle.innerText = `Error searching for "${q}"`;
                        }
                    }
                }

                isSearching = false;
            }, 400); // OPTIMIZATION: Reduced debounce since local search is instant
        });


        // --- OVERLAY & VIDEO ---

        async function openOverlay(movie) {
            currentMovie = movie;

            // Check Fav/Watched status
            updateOverlayButtons();

            // Set Watch Timer (10 minutes)
            clearTimeout(watchTimer);
            watchTimer = setTimeout(() => markAsWatched(movie), 600000); // 10 mins

            document.getElementById('overlayTitle').innerText = movie.title;
            document.getElementById('overlayDesc').innerText = movie.overview;
            document.getElementById('overlayMeta').innerText = "";

            // TV Check
            const isTV = (movie.type === 'tv' || movie.type === 'series');
            document.getElementById('tvPanel').style.display = isTV ? 'block' : 'none';

            if (isTV) {
                currentSeason = 1; currentEpisode = 1;
                document.getElementById('overlayMeta').innerText = "S1:E1";
                // Load TV Meta
                const meta = await fetchTvMeta(movie.title);
                renderTvControls(meta);
            }

            // Related
            fetchRelated(movie);

            // Load Video
            loadVideo(movie, currentSeason, currentEpisode);

            overlay.style.display = 'flex';
            document.body.classList.add('no-scroll');
            // Slight delay for animation
            setTimeout(() => overlay.classList.add('active'), 50);
        }

        async function loadVideo(movie, s, e) {
            const container = document.getElementById('videoContainer');
            const loader = document.getElementById('videoLoader');

            container.innerHTML = '';
            loader.style.display = 'flex';

            let tmdbId = movie.id; // Fallback to imdb id if fetch fails (rarely works but safe)

            try {
                // Convert IMDb ID to TMDB ID
                const convertedId = await fetchTmdbId(movie.id);
                if (convertedId) tmdbId = convertedId;
            } catch (err) {
                console.warn('TMDB Conversion Failed', err);
            }

            // Use multiembed.mov with TMDB ID (proxied as requested)
            // Format: https://multiembed.mov/?video_id={tmdb_id}&tmdb=1
            // Format: https://multiembed.mov/?video_id={tmdb_id}&tmdb=1&s={season}&e={episode}

            let playerUrl = "";

            if (movie.type === 'tv' || movie.type === 'series') {
                playerUrl = `${GP_BASE}https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${s}&e=${e}`;
            } else {
                playerUrl = `${GP_BASE}https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
            }

            const src = playerUrl;

            const iframe = document.createElement('iframe');
            // Ad-blocking will be handled at proxy level for better compatibility
            iframe.referrerPolicy = 'no-referrer';
            iframe.allow = "autoplay; fullscreen";

            // Monitor for popup attempts from iframe
            let popupMonitor = null;
            let knownWindows = new Set([window]);

            // Check for new windows every 500ms and close them
            const startPopupMonitoring = () => {
                popupMonitor = setInterval(() => {
                    // Get all windows
                    const allWindows = [window];
                    for (let i = 0; i < allWindows.length; i++) {
                        try {
                            if (allWindows[i].opener === window && !knownWindows.has(allWindows[i])) {
                                console.warn('Detected and closing popup window');
                                allWindows[i].close();
                            }
                        } catch (e) {
                            // Cross-origin, can't access
                        }
                    }
                }, 500);
            };

            // onload event
            iframe.onload = () => {
                // Ensure Loader stays for at least 2 seconds (user requested ~2s, but added message for blank screen)
                setTimeout(() => {
                    loader.style.display = 'none';
                    iframe.style.opacity = '1';
                }, 2000);

                // Start monitoring for popups after iframe loads
                startPopupMonitoring();
            };

            iframe.src = src;
            container.appendChild(iframe);

            // Store monitor reference to clear it later
            if (!window.activePopupMonitors) window.activePopupMonitors = [];
            window.activePopupMonitors.push(popupMonitor);
        }

        function closeOverlay() {
            clearTimeout(watchTimer);
            watchTimer = null;

            // Clear all popup monitors
            if (window.activePopupMonitors) {
                window.activePopupMonitors.forEach(monitor => {
                    if (monitor) clearInterval(monitor);
                });
                window.activePopupMonitors = [];
            }

            overlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
            setTimeout(() => {
                overlay.style.display = 'none';
                document.getElementById('videoContainer').innerHTML = ''; // Kill iframe
            }, 300);
        }

        document.getElementById('closeOverlayBtn').onclick = closeOverlay;

        // --- DATA HELPERS ---
        async function fetchTmdbId(imdbId) {
            if (!TMDB_API_KEY) {
                console.error("TMDB_API_KEY is missing!");
                return null;
            }
            try {
                const url = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.movie_results && data.movie_results.length > 0) {
                    return data.movie_results[0].id;
                }
                if (data.tv_results && data.tv_results.length > 0) {
                    return data.tv_results[0].id;
                }
            } catch (e) {
                console.warn("Error fetching TMDB ID:", e);
            }
            return null;
        }

        async function fetchTvMeta(title) {
            if (tvCache[title]) return tvCache[title];
            try {
                // Use TVMAZE_API constant from Google Sheet (singlesearch endpoint)
                const searchUrl = `${TVMAZE_API}?q=${encodeURIComponent(title)}`;
                console.log('Fetching TV metadata from:', searchUrl);

                const searchRes = await fetch(searchUrl);
                const show = await searchRes.json();

                if (show && show.id) {
                    const showId = show.id;

                    // Step 2: Fetch episodes for the show
                    const episodesRes = await fetch(`https://api.tvmaze.com/shows/${showId}/episodes`);
                    const episodes = await episodesRes.json();

                    if (episodes && episodes.length > 0) {
                        const seasons = {};
                        episodes.forEach(e => {
                            if (!seasons[e.season]) seasons[e.season] = 0;
                            seasons[e.season]++;
                        });
                        const meta = {
                            maxS: Math.max(...Object.keys(seasons).map(Number)),
                            counts: seasons
                        };
                        tvCache[title] = meta;
                        console.log(`Loaded ${episodes.length} episodes for "${title}":`, meta);
                        return meta;
                    }
                }
            } catch (e) {
                console.warn('TVMaze fetch error for', title, e);
            }
            // Only use defaults as last resort - but use more reasonable defaults
            console.warn(`Using default values for "${title}" - API fetch failed`);
            return { maxS: 1, counts: { 1: 10 } }; // More conservative defaults: 1 season with 10 episodes
        }

        function renderTvControls(meta) {
            const sTabs = document.getElementById('seasonTabs');
            const eGrid = document.getElementById('episodeGrid');
            sTabs.innerHTML = '';
            eGrid.innerHTML = '';

            for (let s = 1; s <= meta.maxS; s++) {
                const btn = document.createElement('button');
                btn.className = `season-tab ${s === currentSeason ? 'active' : ''}`;
                btn.innerText = `Season ${s}`;
                btn.onclick = () => {
                    currentSeason = s; currentEpisode = 1;
                    renderTvControls(meta);
                    loadVideo(currentMovie, s, 1);
                    document.getElementById('overlayMeta').innerText = `S${s}:E1`;
                };
                sTabs.appendChild(btn);
            }

            const epCount = meta.counts[currentSeason] || 10; // Default to 10 if count not available
            console.log(`Rendering Season ${currentSeason} with ${epCount} episodes`);
            for (let e = 1; e <= epCount; e++) {
                const btn = document.createElement('button');
                btn.className = `episode-btn ${e === currentEpisode ? 'active' : ''}`;
                btn.innerText = e;
                btn.onclick = () => {
                    currentEpisode = e;
                    renderTvControls(meta); // update active
                    loadVideo(currentMovie, currentSeason, e);
                    document.getElementById('overlayMeta').innerText = `S${currentSeason}:E${e}`;
                };
                eGrid.appendChild(btn);
            }
        }

        async function fetchRelated(movie) {
            const grid = document.getElementById('relatedGrid');
            const section = document.getElementById('relatedSection');
            grid.innerHTML = '';
            section.style.display = 'none';

            try {
                // OPTIMIZATION: Fetch related from IMDb using title keywords
                let query = movie.title.split(':')[0].split(' ')[0]; // First word
                const results = await fetchImdb(query);

                if (results && results.length > 0) {
                    let related = results.filter(m => m.id !== movie.id && m.poster).slice(0, 6);
                    if (related.length > 0) {
                        section.style.display = 'block';
                        related.forEach(m => {
                            const el = document.createElement('div');
                            el.className = 'related-card';
                            el.innerHTML = `<img src="${posterUrl(m.poster)}" loading="lazy">`;
                            el.onclick = () => openOverlay(m);
                            grid.appendChild(el);
                        });
                    }
                }
            } catch (e) {
                console.warn('Related fetch error:', e);
            }
        }


        // --- LIST MANAGEMENT (Favs/Watched) ---
        function updateOverlayButtons() {
            const favBtn = document.getElementById('overlayFavBtn');
            const isFav = favorites.find(f => f.id === currentMovie.id);
            favBtn.classList.toggle('active', !!isFav);
        }

        document.getElementById('overlayFavBtn').onclick = () => {
            const idx = favorites.findIndex(f => f.id === currentMovie.id);
            if (idx > -1) favorites.splice(idx, 1);
            else favorites.push(currentMovie);

            localStorage.setItem('gp-movie-favorites', JSON.stringify(favorites));
            updateOverlayButtons();
            renderList('fav');
        };

        function markAsWatched(movie) {
            const isWatched = watched.find(w => w.id === movie.id);
            if (!isWatched) {
                watched.push(movie);
                localStorage.setItem('gp-movie-watched', JSON.stringify(watched));
                renderList('watched');
                console.log(`Marked "${movie.title}" as watched.`);
            }
        }

        function renderList(type) {
            const list = type === 'fav' ? favorites : watched;
            const container = type === 'fav' ? document.getElementById('favList') : document.getElementById('watchedList');

            container.innerHTML = '';
            if (list.length === 0) {
                container.innerHTML = `<div style="text-align:center;color:#666;padding:20px;">Nothing here yet.</div>`;
                return;
            }

            list.forEach(m => {
                const el = document.createElement('div');
                el.className = 'list-item';
                el.innerHTML = `
                    <img src="${posterUrl(m.poster)}">
                    <div class="list-item-info">
                        <div class="list-item-title">${m.title}</div>
                    </div>
                `;

                // Remove Button
                const rmv = document.createElement('button');
                rmv.className = 'list-item-remove';
                rmv.innerHTML = `<i data-lucide="trash-2"></i>`;
                rmv.onclick = (e) => {
                    e.stopPropagation();
                    if (type === 'fav') {
                        favorites = favorites.filter(f => f.id !== m.id);
                        localStorage.setItem('gp-movie-favorites', JSON.stringify(favorites));
                    } else {
                        watched = watched.filter(w => w.id !== m.id);
                        localStorage.setItem('gp-movie-watched', JSON.stringify(watched));
                    }
                    renderList(type);
                    if (currentMovie && currentMovie.id === m.id) updateOverlayButtons();
                };

                el.onclick = () => {
                    closeModals();
                    openOverlay(m);
                };

                el.appendChild(rmv);
                container.appendChild(el);
            });
            // OPTIMIZATION: Only create icons once, not on every list render
        }

        // Modal Toggles
        function openModal(modal) {
            closeModals(); // Close others
            modal.style.display = 'flex';
            document.body.classList.add('blur-active');
            document.body.classList.add('no-scroll');
            setTimeout(() => modal.classList.add('active'), 10);
        }
        function closeModals() {
            favModal.classList.remove('active');
            watchedModal.classList.remove('active');
            document.body.classList.remove('blur-active');
            document.body.classList.remove('no-scroll');
            setTimeout(() => {
                if (!favModal.classList.contains('active')) favModal.style.display = 'none';
                if (!watchedModal.classList.contains('active')) watchedModal.style.display = 'none';
            }, 300);
        }

        document.getElementById('favBtn').onclick = () => {
            renderList('fav');
            openModal(favModal);
        };
        document.getElementById('watchedBtn').onclick = () => {
            renderList('watched');
            openModal(watchedModal);
        };
        document.getElementById('closeFavBtn').onclick = closeModals;
        document.getElementById('closeWatchedBtn').onclick = closeModals;


        // Close Modals on Outside Click
        window.addEventListener('click', (e) => {
            if (favModal.classList.contains('active') && !favModal.contains(e.target) && !document.getElementById('favBtn').contains(e.target)) {
                closeModals();
            }
            if (watchedModal.classList.contains('active') && !watchedModal.contains(e.target) && !document.getElementById('watchedBtn').contains(e.target)) {
                closeModals();
            }
        });

        // Header Scroll
        window.addEventListener('scroll', () => {
            const hdr = document.getElementById('mainHeader');
            if (window.scrollY > 50) hdr.classList.add('scrolled');
            else hdr.classList.remove('scrolled');
        });

        // ============================================
        // AD BLOCKER - Prevent Redirects, Popups, and Downloads
        // ============================================

        // 1. Aggressive popup blocking - track and close ALL popup attempts
        let blockedPopups = 0;
        const originalWindowOpen = window.open;

        window.open = function (...args) {
            blockedPopups++;
            console.warn(`Popup #${blockedPopups} blocked by ad blocker:`, args[0]);

            // Return a fake window object to prevent errors
            return {
                closed: false,
                close: () => { },
                focus: () => { },
                blur: () => { },
                postMessage: () => { }
            };
        };

        // Also override Window.prototype.open
        Window.prototype.open = window.open;

        // 2. Block beforeunload from ads trying to redirect
        let userInitiatedClose = false;
        document.getElementById('closeOverlayBtn').addEventListener('click', function () {
            userInitiatedClose = true;
        });

        window.addEventListener('beforeunload', function (e) {
            if (!userInitiatedClose && overlay.classList.contains('active')) {
                e.preventDefault();
                e.returnValue = '';
                console.warn('Prevented ad redirect attempt');
            }
        });

        // 3. Intercept and block suspicious download attempts
        document.addEventListener('click', function (e) {
            if (e.target.tagName === 'A') {
                const href = e.target.getAttribute('href');
                // Block suspicious download links
                if (href && (
                    href.includes('.exe') ||
                    href.includes('.apk') ||
                    href.includes('.dmg') ||
                    href.includes('download') && !href.includes('multiembed')
                )) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.warn('Blocked suspicious download:', href);
                    return false;
                }
            }
        }, true);

        // 4. Block context menu manipulation (some ads use this)
        document.addEventListener('contextmenu', function (e) {
            // Allow context menu on video container
            if (e.target.closest('.video-container')) {
                return true;
            }
        });

        // 5. Block focus stealing (ads try to focus their window)
        window.addEventListener('blur', function (e) {
            if (overlay.classList.contains('active')) {
                setTimeout(() => {
                    window.focus();
                }, 100);
            }
        });

        console.log('Ad blocker initialized - Popups, redirects, and downloads blocked');


        // Init
        init().then(() => {
            // OPTIMIZATION: Create all icons once after page is loaded
            lucide.createIcons();
        });