import { BASE_URL, getHeaders } from './config';


async function fetchFromTMDB(endpoint: string) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}?language=tr-TR&page=1`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Hatası: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`${endpoint} isteği sırasında hata oluştu:`, error);
    throw error;
  }
}

// Ana Sayfa Şeritleri İçin Endpoint Servisleri
export const movieService = {
  // Günün Trend İçerikleri
  getTrending: () => fetchFromTMDB('/trending/all/day'),
  
  // Popüler Filmler
  getPopularMovies: () => fetchFromTMDB('/movie/popular'),
  
  // Popüler Diziler
  getPopularTV: () => fetchFromTMDB('/tv/popular'),
  
  // Vizyondaki Filmler
  getNowPlaying: () => fetchFromTMDB('/movie/now_playing'),
  
  // En Yüksek Puan Alanlar
  getTopRated: () => fetchFromTMDB('/movie/top_rated'),
};