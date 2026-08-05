import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = '@search_history';
const WATCH_HISTORY_KEY = '@watch_history';
const MAX_HISTORY_LIMIT = 10;

export const historyStorage = {
  // --- ARAMA GEÇMİŞİ ---
  async getSearchHistory() {
    try {
      const data = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Arama geçmişi alınamadı:', e);
      return [];
    }
  },

  async addSearchQuery(query) {
    if (!query || !query.trim()) return;
    try {
      const history = await this.getSearchHistory();
      const filtered = history.filter(
        (item) => item.toLowerCase() !== query.trim().toLowerCase()
      );
      const updated = [query.trim(), ...filtered].slice(0, MAX_HISTORY_LIMIT);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Arama geçmişi kaydedilemedi:', e);
    }
  },

  async removeSearchQuery(query) {
    try {
      const history = await this.getSearchHistory();
      const updated = history.filter((item) => item !== query);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Arama geçmişinden silinemedi:', e);
    }
  },

  async clearSearchHistory() {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
      return [];
    } catch (e) {
      console.error('Arama geçmişi temizlenemedi:', e);
    }
  },

  // --- İZLEME GEÇMİŞİ ---
  async getWatchHistory() {
    try {
      const data = await AsyncStorage.getItem(WATCH_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('İzleme geçmişi alınamadı:', e);
      return [];
    }
  },

  async addWatchHistory(movie) {
    if (!movie || !movie.id) return;
    try {
      const history = await this.getWatchHistory();
      const filtered = history.filter((item) => item.id !== movie.id);
      const newItem = {
        id: movie.id,
        title: movie.title || movie.name,
        poster_path: movie.poster_path,
        media_type: movie.media_type || 'movie',
        watchedAt: new Date().toISOString(),
      };
      const updated = [newItem, ...filtered].slice(0, 20);
      await AsyncStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('İzleme geçmişi kaydedilemedi:', e);
    }
  },
};