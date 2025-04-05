console.log('Shared scripts loaded successfully.');

// Ensure toggleFullscreen is defined
if (typeof toggleFullscreen === 'undefined') {
    function toggleFullscreen() {
        const gameContainer = document.querySelector('.game-container');
        if (!document.fullscreenElement) {
            gameContainer.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
}

// Fetch navbar and log errors if any
fetch('https://georgepickenssite.github.io/georgepickens/dev/navbar.html')
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to load navbar.html: ${response.statusText}`);
        }
        return response.text();
    })
    .then(data => {
        console.log('Navbar HTML fetched successfully.');
        const template = document.createElement('template');
        template.innerHTML = data.trim();
        const navbarTemplate = template.content.querySelector('#navbar-template');
        if (!navbarTemplate) {
            throw new Error('No element with ID #navbar-template found in navbar.html.');
        }
        document.getElementById('navbar').appendChild(navbarTemplate.content.cloneNode(true));
    })
    .catch(error => {
        console.error('Error loading navbar:', error);
    });
