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

  // GÜN 07: OYUNCU DETAYI & FILMOGRAFİ
  getPersonDetails: (personId) =>
    fetchFromTMDB(`/person/${personId}?language=tr-TR&append_to_response=combined_credits`),

  // GÜN 08: MULTI-SEARCH (Sayfalama ve İptal Sinyali Desteğiyle)
  multiSearch: (query, page = 1, signal = null) =>
    fetchFromTMDB(
      `/search/multi?query=${encodeURIComponent(query)}&page=${page}&language=tr-TR`,
      { signal }
    ),

  // ARAMA EKRANI İÇİN ÖNERİLER (Arama yapılmadığı durumlarda)
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

  // KESFET & FILTRELEME
  // 1. Film Türlerini Getirme (Aksiyon, Komedi vs.)
  getGenres: () => fetchFromTMDB('/genre/movie/list?language=tr-TR'),

  // 2. Tür, Yıl ve Sıralama Parametreleriyle Keşfet Arama
  discoverMovies: (genreId = '', year = '', sortBy = 'popularity.desc', page = 1) => {
    let endpoint = `/discover/movie?language=tr-TR&sort_by=${sortBy}&page=${page}`;
    if (genreId) endpoint += `&with_genres=${genreId}`;
    if (year) endpoint += `&primary_release_year=${year}`;
    return fetchFromTMDB(endpoint);
  },
}; 

5