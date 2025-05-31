const OMDB_API_KEY = '54d76e21'; // Replace with your OMDB API key

// NEW: Function to get poster from the new API
function getMoviePoster(imdbID) {
    const url = `https://movie-database-by-based-api.p.rapidapi.com/v1/movies/?i=${imdbID}`;
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': '03dbb49dbcmshbb458e36e78bcffp101756jsn615f428efc88',
            'x-rapidapi-host': 'movie-database-by-based-api.p.rapidapi.com'
        }
    };
    return fetch(url, options)
        .then(response => response.json())
        .then(data => {
            // Adjust according to actual API response structure
            if (data && data.poster) {
                return data.poster;
            } else if (data && data.results && data.results[0] && data.results[0].poster) {
                return data.results[0].poster;
            } else {
                throw new Error("Poster not found");
            }
        })
        .catch(err => {
            console.error('Poster fetch failed:', err);
            return 'https://via.placeholder.com/300x450?text=No+Poster'; // fallback image
        });
}

function getMovieInfo(imdbID) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `https://www.omdbapi.com/?i=${imdbID}&apikey=${OMDB_API_KEY}`,
            method: 'GET',
            success: function(response) {
                if (response.Response === "True") {
                    const movieInfo = {
                        title: response.Title,
                        year: response.Year,
                        // Don't use OMDB's Poster anymore!
                        rated: response.Rated,
                        genre: response.Genre,
                        ratings: response.imdbRating,
                        plot : response.Plot,
                        actors: response.Actors
                    };
                    resolve(movieInfo);
                } else {
                    reject('Movie not found');
                }
            },
            error: function() {
                reject('Failed to fetch movie details');
            }
        });
    });
}

function getFormattedDate(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
}

const getDateString = () => {
    const currentDate = new Date();

    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);

    const tomorrow = new Date(currentDate);
    tomorrow.setDate(currentDate.getDate() + 1);

    const formattedYesterday = getFormattedDate(yesterday);
    const formattedToday = getFormattedDate(currentDate);
    const formattedTomorrow = getFormattedDate(tomorrow);

    return formattedYesterday + formattedToday + formattedTomorrow;
};

function getURL(link, tt) {
    const longDateString = getDateString();
    const url = link + longDateString;
    const srcvp = document.getElementById('videoplayer');
    const srcvs = document.getElementById('vidsource');
    srcvp.src = url;
    srcvs.src = url;
    const subs = document.getElementById('subs');
    subs.src = "https://rips.cc/subs/" + tt + ".vtt";
    window.scrollTo(0, 0);
}

function createMovie(link, imdbID) {
  getMovieInfo(imdbID).then(movieInfo => {
    getMoviePoster(imdbID).then(posterUrl => {
      const genreList = movieInfo.Genre ? movieInfo.Genre.toLowerCase().split(',').map(g => g.trim()) : ['uncategorized'];

      genreList.forEach(genre => {
        if (!movieCategories[genre]) movieCategories[genre] = [];
        movieCategories[genre].push({ ...movieInfo, posterUrl, link, imdbID });
      });

      displayMoviesByCategory();
    });
  });
}

function displayMoviesByCategory() {
  const container = document.getElementById('gamecards-container');
  container.innerHTML = '';

  const genres = Object.keys(movieCategories);

  genres.forEach((genre, index) => {
    const categoryRow = document.createElement('div');
    categoryRow.className = 'category-row';

    const title = document.createElement('div');
    title.className = 'category-title';
    title.textContent = genre.toUpperCase();

    const rowContainer = document.createElement('div');
    rowContainer.className = 'category-container';

    movieCategories[genre].forEach(movie => {
      const card = document.createElement('button');
      card.className = 'gamecard';
      card.onclick = () => getURL(movie.link, movie.imdbID);

      card.innerHTML = `
        <img src="${movie.posterUrl}" alt="${movie.Title}">
        <div class="overlay"><span class="title">${movie.Title}</span></div>
      `;

      rowContainer.appendChild(card);
    });

    const leftArrow = document.createElement('button');
    leftArrow.className = 'scroll-arrow left';
    leftArrow.innerHTML = '&#9664;';
    leftArrow.onclick = () => scrollCategory(rowContainer, 'left');

    const rightArrow = document.createElement('button');
    rightArrow.className = 'scroll-arrow right';
    rightArrow.innerHTML = '&#9654;';
    rightArrow.onclick = () => scrollCategory(rowContainer, 'right');

    categoryRow.appendChild(leftArrow);
    categoryRow.appendChild(title);
    categoryRow.appendChild(rowContainer);
    categoryRow.appendChild(rightArrow);
    container.appendChild(categoryRow);

    if (index < genres.length - 1) {
      const line = document.createElement('div');
      line.className = 'line';
      line.style.setProperty('--random-delay', `${Math.random() * 5}s`);
      container.appendChild(line);
    }
  });
}

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

fetch('https://georgepickenssite.github.io/georgepickens/dev/navbar.html')
    .then(response => response.text())
    .then(data => {
        const template = document.createElement('template');
        template.innerHTML = data;
        const navbar = template.content.querySelector('#navbar-template').content;
        document.getElementById('navbar').appendChild(navbar);
    });

function toggleDescription(event) {
    event.stopPropagation();
    const button = event.target;
    const description = button.previousElementSibling;
    if (description.style.display === 'none' || description.style.display === '') {
        description.style.display = 'block';
        button.textContent = 'Close';
    } else {
        description.style.display = 'none';
        button.textContent = 'Expand';
    }
}
