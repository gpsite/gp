
export function createHeader() {
  const header = document.createElement('header');
  header.className = 'header';

  header.innerHTML = `
    <div class="container nav-content">
      <a href="/" class="logo">GP<span>Movies</span></a>
      
      <div class="search-bar">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-search"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="text" placeholder="Search movies..." id="search-input">
      </div>
      
      <div class="nav-links" style="display: flex; gap: 1rem; align-items: center;">
        <a href="/" class="btn btn-glass">Home</a>
        <a href="/platforms" class="btn btn-glass">Platforms</a>
      </div>
    </div>
  `;

  // Scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Search functionality
  const input = header.querySelector('#search-input');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = input.value.trim();
      if (query) {
        window.history.pushState({}, '', `/search?q=${encodeURIComponent(query)}`);
        window.dispatchEvent(new Event('popstate'));
      }
    }
  });

  // Logo click
  header.querySelector('.logo').addEventListener('click', (e) => {
    e.preventDefault();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
  });

  return header;
}
