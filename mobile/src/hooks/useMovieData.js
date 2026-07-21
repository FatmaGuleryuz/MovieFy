import { useState, useEffect } from 'react';
import { movieService } from '../api/services';

export const useMovieData = () => {
  const [data, setData] = useState({
    trending: [],
    popularMovies: [],
    popularTV: [],
    nowPlaying: [],
    topRated: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Servisimizdeki Promise.all yapısını tek satırda çağırıyoruz
      const homeData = await movieService.getHomeFeed();
      setData(homeData);
    } catch (err) {
      setError(err.message || 'Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllData();
  }, []);

  return { ...data, loading, error, refetch: getAllData };
};