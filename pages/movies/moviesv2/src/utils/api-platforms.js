
import { API_KEY, BASE_URL } from './api.js';

export async function fetchProviders() {
    try {
        // Fetch movie watch providers, US region
        const response = await fetch(`${BASE_URL}/watch/providers/movie?api_key=${API_KEY}&language=en-US&watch_region=US`);
        const data = await response.json();

        // TMDB returns them sorted by display_priority usually, but we can ensure it.
        // We'll take the top 50 to avoid cluttering if there are hundreds.
        return data.results
            .sort((a, b) => a.display_priority - b.display_priority)
            .slice(0, 50);
    } catch (error) {
        console.error("Failed to fetch providers:", error);
        return [];
    }
}

export async function fetchByProvider(providerId, type = 'movie') {
    try {
        const response = await fetch(`${BASE_URL}/discover/${type}?api_key=${API_KEY}&with_watch_providers=${providerId}&watch_region=US&sort_by=popularity.desc`);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error("Failed to fetch by provider:", error);
        return [];
    }
}
