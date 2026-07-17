import { useState, useEffect } from 'react';
import { movieService } from '../api/services';

// Özel hook: Ana sayfa için gerekli tüm verileri tek yerden ve güvenli yönetir
export const useMovieData = () => {
  const [data, setData] = useState({
    trending: [],
    popularMovies: [],
    popularTV: [],
    nowPlaying: [],
    topRated: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 5 farklı API isteğini paralel olarak güvenle çalıştırıyoruz
      const [trending, popularMovies, popularTV, nowPlaying, topRated] = await Promise.all([
        movieService.getTrending(),
        movieService.getPopularMovies(),
        movieService.getPopularTV(),
        movieService.getNowPlaying(),
        movieService.getTopRated(),
      ]);

      setData({
        trending,
        popularMovies,
        popularTV,
        nowPlaying,
        topRated,
      });
    } catch (err: any) {
      setError(err.message || 'Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllData();
  }, []);

  // Ekranın kullanacağı her şeyi dışarı aktarıyoruz
  return { ...data, loading, error, refetch: getAllData };
};