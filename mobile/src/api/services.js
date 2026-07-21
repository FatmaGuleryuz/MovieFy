import { BASE_URL, getHeaders } from './config';

async function fetchFromTMDB(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Hatası: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`${endpoint} isteği sırasında hata oluştu:`, error);
    throw error;
  }
}

export const movieService = {
  getHomeFeed: async () => {
    const [trending, popularMovies, popularTV, nowPlaying, topRated] = await Promise.all([
      fetchFromTMDB('/trending/all/day?language=tr-TR'),
      fetchFromTMDB('/movie/popular?language=tr-TR'),
      fetchFromTMDB('/tv/popular?language=tr-TR'),
      fetchFromTMDB('/movie/now_playing?language=tr-TR'),
      fetchFromTMDB('/movie/top_rated?language=tr-TR'),
    ]);

    return {
      trending: trending.results || [],
      popularMovies: popularMovies.results || [],
      popularTV: popularTV.results || [],
      nowPlaying: nowPlaying.results || [],
      topRated: topRated.results || [],
    };
  },

  getDetails: (id, type = 'movie') =>
    fetchFromTMDB(`/${type}/${id}?language=tr-TR&append_to_response=credits,videos,similar`),

  getSeasonDetails: (tvId, seasonNumber) =>
    fetchFromTMDB(`/tv/${tvId}/season/${seasonNumber}?language=tr-TR`),

  // GÜN 07: OYUNCU DETAYI & FILMOGRAFİ (append_to_response=combined_credits)
  getPersonDetails: (personId) =>
    fetchFromTMDB(`/person/${personId}?language=tr-TR&append_to_response=combined_credits`),
};