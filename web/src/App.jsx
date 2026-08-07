import React, { useState, useEffect } from 'react';
import './App.css'; 
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import MovieRow from './components/MovieRow';
import MovieModal from './components/MovieModal';
import PersonModal from './components/PersonModal';
import { 
  getDailyTrending, 
  getPopularMovies, 
  getPopularTV,
  getNowPlayingMovies,
  getTopRatedMovies,
  getMoviesByGenre,
  getTVByGenre
} from './api/movieService';

const App = () => {
  const [heroMovie, setHeroMovie] = useState(null);
  const [defaultHeroMovie, setDefaultHeroMovie] = useState(null);

  const [trendingMovies, setTrendingMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [topRated, setTopRated] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [genreMediaType, setGenreMediaType] = useState('movie');

  const handleSelectGenre = async (genreId, type = 'movie') => {
    setSelectedGenre(genreId);
    setGenreMediaType(type);

    if (genreId === null) {
      setFilteredMovies([]);
      setHeroMovie(defaultHeroMovie);
    } else {
      setLoading(true);
      const results = type === 'tv' 
        ? await getTVByGenre(genreId) 
        : await getMoviesByGenre(genreId);

      if (results && results.length > 0) {
        setHeroMovie(results[0]);
        setFilteredMovies(results.slice(1));
      } else {
        setFilteredMovies([]);
      }
      setLoading(false);
    }
  };

  const [continueWatching, setContinueWatching] = useState([]);

 useEffect(() => {
    // 1. Tüm listeler yüklendikten sonra çalışması için genel bir havuz oluşturuyoruz
    const allFetchedMovies = [...trendingMovies, ...nowPlaying, ...topRated, ...popularMovies, ...popularTV];

    if (allFetchedMovies.length === 0) return;

    // 2. LocalStorage'daki tüm 'continue_watch_' ile başlayan verileri tarayıp topluyoruz
    const keys = Object.keys(localStorage);
    const cwItems = keys
      .filter(key => key.startsWith('continue_watch_'))
      .map(key => JSON.parse(localStorage.getItem(key)))
      .sort((a, b) => b.updatedAt - a.updatedAt); // En son izlediğini en başa koy

    // 3. Elimizdeki ID'leri, ana sayfadaki filmlerle eşleştirip afiş/isim bilgilerini çekiyoruz
    const matchedMovies = cwItems.map(item => {
      return allFetchedMovies.find(m => String(m.id) === String(item.movieId));
    }).filter(Boolean); // Bulunamayanları (undefined) temizle

    // 4. Aynı filmi iki kez göstermemek için filtreleyip state'e aktarıyoruz
    const uniqueMovies = Array.from(new Set(matchedMovies.map(a => a.id)))
      .map(id => matchedMovies.find(a => a.id === id));

    setContinueWatching(uniqueMovies);
  }, [trendingMovies, nowPlaying, topRated, popularMovies, popularTV]);
  const [filteredMovies, setFilteredMovies] = useState([]);

  const handleSelectMedia = (id, mediaType = 'movie') => {
    setSelectedMedia({ id, mediaType });
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(false);

        const [trendingData, nowPlayingData, topRatedData, popularData, tvData] = await Promise.all([
          getDailyTrending(),
          getNowPlayingMovies(),
          getTopRatedMovies(),
          getPopularMovies(),
          getPopularTV()
        ]);

        const trendList = trendingData?.results || [];
        const nowPlayingList = nowPlayingData?.results || [];
        const popularList = popularData?.results || [];

        setTrendingMovies(trendList);
        setNowPlaying(nowPlayingList);
        setTopRated(topRatedData?.results || []);
        setPopularMovies(popularList);
        setPopularTV(tvData?.results || []);

        // ⚡ HERO BANNER GARANTİ SİSTEMİ:
        const fallbackHero = trendList[0] || nowPlayingList[0] || popularList[0] || null;
        setHeroMovie(fallbackHero);
        setDefaultHeroMovie(fallbackHero);

      } catch (e) {
        console.error("Veriler çekilemedi:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return (
    <div className="app" style={{ backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh', width: '100%' }}>
      {/* Navbar */}
      <Navbar 
        onSelectMedia={handleSelectMedia}
        onSelectPerson={(id) => setSelectedPersonId(id)}
        onSelectGenre={handleSelectGenre}
      />

      {error ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '80vh',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.8rem', color: '#e50914', marginBottom: '10px' }}>
            Ters giden bir şeyler oldu 😕
          </h2>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              backgroundColor: '#e50914',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Tekrar Dene
          </button>
        </div>
      ) : (
        <>
          {/* Garanti Hero Banner */}
          {heroMovie && <HeroBanner movie={heroMovie} />}

          <div className="main-container" style={{ marginTop: heroMovie ? '-60px' : '80px', position: 'relative', zIndex: '2', width: '100%', paddingLeft: '4%', boxSizing: 'border-box' }}>
            
            {selectedGenre !== null ? (
              <MovieRow 
                title={`Seçilen Türe Ait ${genreMediaType === 'tv' ? 'Diziler' : 'Filmler'}`}
                movies={filteredMovies} 
                isLoading={loading}
                mediaType={genreMediaType}
                onSelectMovie={handleSelectMedia}
                onSelectMedia={handleSelectMedia}
              />
            ) : (
              <>
                {/* 🌟 İZLEMEYE DEVAM ET ŞERİDİ BURAYA EKLENDİ 🌟 */}
                {continueWatching.length > 0 && (
                  <MovieRow 
                    title="İzlemeye Devam Et" 
                    movies={continueWatching} 
                    isLargeRow={true} 
                    onSelectMovie={handleSelectMedia} 
                    onSelectMedia={handleSelectMedia}
                  />
                )}

                {trendingMovies.length > 0 && (
                  <MovieRow title="Günün Trendleri" movies={trendingMovies} isLoading={loading} onSelectMovie={handleSelectMedia} onSelectMedia={handleSelectMedia} />
                )}
                <MovieRow title="Vizyondakiler" movies={nowPlaying} isLoading={loading} mediaType="movie" onSelectMovie={handleSelectMedia} onSelectMedia={handleSelectMedia} />
                <MovieRow title="En Yüksek Puanlılar" movies={topRated} isLoading={loading} mediaType="movie" onSelectMovie={handleSelectMedia} onSelectMedia={handleSelectMedia} />
                <MovieRow title="Popüler Filmler" movies={popularMovies} isLoading={loading} mediaType="movie" onSelectMovie={handleSelectMedia} onSelectMedia={handleSelectMedia} />
                <MovieRow title="Popüler Diziler" movies={popularTV} isLoading={loading} mediaType="tv" onSelectMovie={handleSelectMedia} onSelectMedia={handleSelectMedia} />
              </>
            )}

          </div>
        </>
      )}

      {/* Modallar */}
      {selectedMedia && (
        <MovieModal 
          movieId={selectedMedia.id} 
          mediaType={selectedMedia.mediaType}
          onClose={() => setSelectedMedia(null)} 
          onSelectPerson={(personId) => setSelectedPersonId(personId)}
        />
      )}

      {selectedPersonId && (
        <PersonModal
          personId={selectedPersonId}
          onClose={() => setSelectedPersonId(null)}
          onSelectMedia={(id, mediaType) => setSelectedMedia({ id, mediaType })} 
        />
      )}
    </div>
  );
};

export default App;