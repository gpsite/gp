
export const API_KEY = '3c3f3d758f294832457405350dda4f89';
export const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

// Mock data for specific "Hero" movies to match TMovie screenshots if API fails or for specific ordering
export const HERO_Mock = [
    {
        id: 533535, // Deadpool & Wolverine
        title: "Deadpool & Wolverine",
        backdrop_path: "/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg",
        overview: "A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up again with an even more reluctant Wolverine.",
        vote_average: 7.7,
        release_date: "2024-07-24",
        media_type: "movie"
    },
    {
        id: 693134, // Dune: Part Two
        title: "Dune: Part Two",
        backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
        overview: "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
        vote_average: 8.2,
        release_date: "2024-02-27",
        media_type: "movie"
    }
];

export async function fetchTrending(type = 'all', timeWindow = 'day') {
    try {
        const response = await fetch(`${BASE_URL}/trending/${type}/${timeWindow}?api_key=${API_KEY}`);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error("Failed to fetch trending:", error);
        return HERO_Mock; // Fallback
    }
}

export async function fetchDetails(id, type = 'movie') {
    try {
        const response = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}`);
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch details:", error);
        return null;
    }
}

export async function searchContent(query) {
    try {
        const response = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error("Search failed:", error);
        return [];
    }
}

export function getImageUrl(path, size = 'original') {
    if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
    return `https://image.tmdb.org/t/p/${size}${path}`;
}
