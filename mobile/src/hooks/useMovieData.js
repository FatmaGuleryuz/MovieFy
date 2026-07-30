import { useState, useEffect } from 'react';
import { movieService } from '../api/services';

export const useMovieData = () => {
  const [trending, setTrending] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [animationMovies, setAnimationMovies] = useState([]);
  const [horrorMovies, setHorrorMovies] = useState([]);
  const [nolanMovies, setNolanMovies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [
          trendingRes,
          moviesRes,
          tvRes,
          nowPlayingRes,
          topRatedRes,
          animationRes,
          horrorRes,
          nolanRes,
        ] = await Promise.all([
          movieService.getTrending('all', 'day'),
          movieService.getPopularMovies(),
          movieService.getTrending('tv', 'week'),
          movieService.getNowPlaying(),
          movieService.getTopRatedMovies(),
          movieService.getAnimationMovies(),
          movieService.getHorrorMovies(),
          movieService.getNolanMovies(),
        ]);

        setTrending(trendingRes.results || []);
        setPopularMovies(moviesRes.results || []);
        setPopularTV(tvRes.results || []);
        setNowPlaying(nowPlayingRes.results || []);
        setTopRated(topRatedRes.results || []);
        setRecommended(moviesRes.results ? [...moviesRes.results].reverse() : []);
        setAnimationMovies(animationRes.results || []);
        setHorrorMovies(horrorRes.results || []);
        setNolanMovies(nolanRes.results || []);
      } catch (err) {
        setError('Veriler yüklenirken bir sorun oluştu.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return {
    trending,
    popularMovies,
    popularTV,
    nowPlaying,
    topRated,
    recommended,
    animationMovies,
    horrorMovies,
    nolanMovies,
    loading,
    error,
  };
};