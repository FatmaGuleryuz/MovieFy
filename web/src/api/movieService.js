import apiClient from './client';

export const movieService = {
  getTrending: async () => {
    try {
      const response = await apiClient.get('/trending/movie/week?language=tr-TR');
      return response.data.results;
    } catch (error) {
      console.error("Trend filmler çekilemedi:", error);
      throw error;
    }
  },
  getPopular: async () => {
    try {
      const response = await apiClient.get('/movie/popular?language=tr-TR');
      return response.data.results;
    } catch (error) {
      console.error("Popüler filmler çekilemedi:", error);
      throw error;
    }
  }
};