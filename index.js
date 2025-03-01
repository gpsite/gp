const searchBar = document.getElementById('searchBar');
const buttons = document.querySelectorAll('.sidebar button');

searchBar.addEventListener('input', () => {
    const searchText = searchBar.value.toLowerCase();

    buttons.forEach(button => {
        const buttonText = button.textContent.toLowerCase();
        if (buttonText.includes(searchText)) {
            button.classList.remove('hidden');
        } else {
            button.classList.add('hidden');
        }
    });
});