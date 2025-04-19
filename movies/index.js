const OMDB_API_KEY = '54d76e21'; // Replace with your OMDB API key

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
                        imageUrl: response.Poster,
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
        const container = document.getElementById('gamecards-container');
        const card = document.createElement('button');
        card.classList.add('gamecard');
        card.innerHTML = `
            <img src="https://georgepickenssite.github.io/georgepickens/img/poster/${imdbID}.png" alt="${movieInfo.title}">
            <div class="title">${movieInfo.title}</div>
            <div class="subtitle"><strong>Genre</strong>: ${movieInfo.genre}</div>
            <div class="description">
            <p><strong>Description:</strong> ${movieInfo.plot}</p>
             <p><strong>Actors:</strong> ${movieInfo.actors}</p>
            <p><strong>Rated:</strong> ${movieInfo.rated}</p>
            <p><strong><i class="fa fa-star"></i></strong> ${movieInfo.ratings}</p>
        </div>
        <button class="expand-btn" onclick="toggleDescription(event)">Details</button>
        `;
        card.onclick = () => getURL(link, imdbID);
        container.appendChild(card);
    }).catch(error => {
        console.error(error);
    });
}

function searchGameCards() {
    const input = document.querySelector('.search-bar');
    const filter = input.value.toLowerCase();
    const gamecards = document.querySelectorAll('.gamecard');

    gamecards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const matchesInput = text.includes(input);
        const matchesDropdown = dropdown === "" || text.includes(dropdown);

        if (matchesInput && matchesDropdown) {
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
    }};


