import { BASE_URL, getHeaders } from './config';

// options parametresi eklenerek signal (AbortController) geçişi sağlandı
async function fetchFromTMDB(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
      ...options, // signal buraya aktarılır
    });

    if (!response.ok) {
      throw new Error(`API Hatası: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // İptal edilen isteklerde konsola hata basıp uygulamayı kirletmeyelim
    if (error.name === 'AbortError') {
      console.log(`${endpoint} isteği iptal edildi.`);
      return null;
    }
    console.error(`${endpoint} isteği sırasında hata oluştu:`, error);
    throw error;
  }
}

export const movieService = {
  // ANA SAYFA İÇİN TOPLU VERİ ÇEKME
  getHomeFeed: async () => {
    const [trending, popularMovies, popularTV, nowPlaying, topRated, animationMovies, horrorMovies, nolanMovies] = await Promise.all([
      fetchFromTMDB('/trending/all/day?language=tr-TR'),
      fetchFromTMDB('/movie/popular?language=tr-TR'),
      fetchFromTMDB('/tv/popular?language=tr-TR'),
      fetchFromTMDB('/movie/now_playing?language=tr-TR'),
      fetchFromTMDB('/movie/top_rated?language=tr-TR'),
      fetchFromTMDB('/discover/movie?language=tr-TR&with_genres=16'), // Animasyon
      fetchFromTMDB('/discover/movie?language=tr-TR&with_genres=27'), // Korku
      fetchFromTMDB('/discover/movie?language=tr-TR&with_crew=525&sort_by=popularity.desc'), // Christopher Nolan
    ]);

    return {
      trending: trending?.results || [],
      popularMovies: popularMovies?.results || [],
      popularTV: popularTV?.results || [],
      nowPlaying: nowPlaying?.results || [],
      topRated: topRated?.results || [],
      animationMovies: animationMovies?.results || [],
      horrorMovies: horrorMovies?.results || [],
      nolanMovies: nolanMovies?.results || [],
    };
  },

  // TEKİL İSTEKLER (Gerektiğinde başka ekranlarda çağırmak için)
  getTrending: (mediaType = 'all', timeWindow = 'day') =>
    fetchFromTMDB(`/trending/${mediaType}/${timeWindow}?language=tr-TR`),

  getPopularMovies: (page = 1) =>
    fetchFromTMDB(`/movie/popular?language=tr-TR&page=${page}`),

  getNowPlaying: (page = 1) =>
    fetchFromTMDB(`/movie/now_playing?language=tr-TR&page=${page}`),

  getTopRatedMovies: (page = 1) =>
    fetchFromTMDB(`/movie/top_rated?language=tr-TR&page=${page}`),

  getDetails: (id, type = 'movie') =>
    fetchFromTMDB(`/${type}/${id}?language=tr-TR&append_to_response=credits,videos,similar`),

  getSeasonDetails: (tvId, seasonNumber) =>
    fetchFromTMDB(`/tv/${tvId}/season/${seasonNumber}?language=tr-TR`),

  // OYUNCU DETAYI & FILMOGRAFİ
  getPersonDetails: (personId) =>
    fetchFromTMDB(`/person/${personId}?language=tr-TR&append_to_response=combined_credits`),

  // MULTI-SEARCH
  multiSearch: (query, page = 1, signal = null) =>
    fetchFromTMDB(
      `/search/multi?query=${encodeURIComponent(query)}&page=${page}&language=tr-TR`,
      { signal }
    ),

  // ARAMA ÖNERİLERİ
  getSearchSuggestions: async () => {
    const [recommended, popularTV] = await Promise.all([
      fetchFromTMDB('/trending/movie/day?language=tr-TR'),
      fetchFromTMDB('/tv/popular?language=tr-TR'),
    ]);

    return {
      recommended: recommended?.results || [],
      popularTV: popularTV?.results || [],
    };
  },

  // KEŞFET & FİLTRELEME
  getGenres: () => fetchFromTMDB('/genre/movie/list?language=tr-TR'),

  discoverMovies: (genreId = '', year = '', sortBy = 'popularity.desc', page = 1) => {
    let endpoint = `/discover/movie?language=tr-TR&sort_by=${sortBy}&page=${page}`;
    if (genreId) endpoint += `&with_genres=${genreId}`;
    if (year) endpoint += `&primary_release_year=${year}`;
    return fetchFromTMDB(endpoint);
  },

  // 🎬 ÖZEL FİLTRELER (fetchFromTMDB uyumlu)
  getAnimationMovies: (page = 1) =>
    fetchFromTMDB(`/discover/movie?language=tr-TR&with_genres=16&page=${page}`),

  getHorrorMovies: (page = 1) =>
    fetchFromTMDB(`/discover/movie?language=tr-TR&with_genres=27&page=${page}`),

  getNolanMovies: (page = 1) =>
    fetchFromTMDB(`/discover/movie?language=tr-TR&with_crew=525&sort_by=popularity.desc&page=${page}`),
};