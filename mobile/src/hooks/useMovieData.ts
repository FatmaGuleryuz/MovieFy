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
  const [error, setError] = useState<string | null>(null);

  const getAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 5 farklı API istegini paralel olarak calıstırıyoruz
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


  return { ...data, loading, error, refetch: getAllData };
};