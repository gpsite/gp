fetch('https://georgepickenssite.github.io/georgepickens/dev/navbar.html')
.then(response => response.text())
.then(data => {
    const template = document.createElement('template');
    template.innerHTML = data;
    const navbar = template.content.querySelector('#navbar-template').content;
    document.getElementById('navbar').appendChild(navbar);
});

function toggleFullscreen() {
const gameContainer = document.querySelector('.game-container');
if (!document.fullscreenElement) {
    gameContainer.requestFullscreen();
} else {
    document.exitFullscreen();
}
}