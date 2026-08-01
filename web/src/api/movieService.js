import axios from 'axios';

// TMDB API Konfigürasyonu
const API_KEY = "6e45bcad4458802edc727bff511216fb";
const BASE_URL = "https://api.themoviedb.org/3";

// Axios Client
const client = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
    language: "tr-TR",
  },
});

// 1. Günlük Trendler
export const getDailyTrending = async () => {
  try {
    const response = await client.get("/trending/all/day");
    return response.data;
  } catch (error) {
    console.error("Trendler çekilemedi:", error);
    return { results: [] };
  }
};

// 2. Vizyondaki Filmler
export const getNowPlayingMovies = async () => {
  try {
    const response = await client.get("/movie/now_playing");
    return response.data;
  } catch (error) {
    console.error("Vizyondakiler çekilemedi:", error);
    return { results: [] };
  }
};

// 3. En Yüksek Puanlı Filmler
export const getTopRatedMovies = async () => {
  try {
    const response = await client.get("/movie/top_rated");
    return response.data;
  } catch (error) {
    console.error("En yüksek puanlılar çekilemedi:", error);
    return { results: [] };
  }
};

// 4. Popüler Filmler
export const getPopularMovies = async () => {
  try {
    const response = await client.get("/movie/popular");
    return response.data;
  } catch (error) {
    console.error("Popüler filmler çekilemedi:", error);
    return { results: [] };
  }
};

// 5. Popüler Diziler
export const getPopularTV = async () => {
  try {
    const response = await client.get("/tv/popular");
    return response.data;
  } catch (error) {
    console.error("Popüler diziler çekilemedi:", error);
    return { results: [] };
  }
};

// 6. Canlı Arama (Multi Search)
export const searchMulti = async (query) => {
  try {
    const response = await client.get("/search/multi", {
      params: { query },
    });
    return response.data.results || [];
  } catch (error) {
    console.error("Arama yapılamadı:", error);
    return [];
  }
};

// 7. Tür Listesi
export const getGenres = async () => {
  try {
    const response = await client.get("/genre/movie/list");
    return response.data.genres || [];
  } catch (error) {
    console.error("Türler çekilemedi:", error);
    return [];
  }
};

// 8. Türe Göre Filmler
export const getMoviesByGenre = async (genreId, page = 1) => {
  try {
    const response = await client.get("/discover/movie", {
      params: {
        with_genres: genreId,
        sort_by: "popularity.desc",
        page: page,
      },
    });
    return response.data.results || [];
  } catch (error) {
    console.error("Türe göre filmler çekilemedi:", error);
    return [];
  }
};

// 9. Türe Göre Diziler
export const getTVByGenre = async (genreId, page = 1) => {
  try {
    const response = await client.get("/discover/tv", {
      params: {
        with_genres: genreId,
        sort_by: "popularity.desc",
        page: page,
      },
    });
    return response.data.results || [];
  } catch (error) {
    console.error("Türe göre diziler çekilemedi:", error);
    return [];
  }
};

// 10. Film Detayları (MovieModal)
export const getMovieDetails = async (movieId) => {
  try {
    const response = await client.get(`/movie/${movieId}`, {
      params: { append_to_response: "credits,videos,similar" },
    });
    return response.data;
  } catch (error) {
    console.error("Film detayları çekilemedi:", error);
    return null;
  }
};

// 11. Dizi Detayları (MovieModal)
export const getTVDetails = async (tvId) => {
  try {
    const response = await client.get(`/tv/${tvId}`, {
      params: { append_to_response: "credits,videos,similar" },
    });
    return response.data;
  } catch (error) {
    console.error("Dizi detayları çekilemedi:", error);
    return null;
  }
};

// 12. Dizi Sezon Detayları (MovieModal)
export const getTVSeasonDetails = async (tvId, seasonNumber) => {
  try {
    const response = await client.get(`/tv/${tvId}/season/${seasonNumber}`);
    return response.data;
  } catch (error) {
    console.error("Sezon detayları çekilemedi:", error);
    return null;
  }
};

// 13. Oyuncu Detayları (PersonModal)
export const getPersonDetails = async (personId) => {
  try {
    const response = await client.get(`/person/${personId}`, {
      params: { append_to_response: "combined_credits" },
    });
    return response.data;
  } catch (error) {
    console.error("Oyuncu detayları çekilemedi:", error);
    return null;
  }
};

// Yardımcı Fonksiyonlar
export const getMovieVideos = async (movieId) => {
  try {
    const response = await client.get(`/movie/${movieId}/videos`);
    return response.data.results || [];
  } catch (error) {
    return [];
  }
};

export const getMovieCredits = async (movieId) => {
  try {
    const response = await client.get(`/movie/${movieId}/credits`);
    return response.data || {};
  } catch (error) {
    return {};
  }
};

export const getTVVideos = async (tvId) => {
  try {
    const response = await client.get(`/tv/${tvId}/videos`);
    return response.data.results || [];
  } catch (error) {
    return [];
  }
};

export const getTVCredits = async (tvId) => {
  try {
    const response = await client.get(`/tv/${tvId}/credits`);
    return response.data || {};
  } catch (error) {
    return {};
  }
};

export default client;