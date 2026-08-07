import React, { useState, useEffect, lazy, Suspense } from 'react';
import './App.css'; 
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import MovieRow from './components/MovieRow';
import { 
  getDailyTrending, 
  getPopularMovies, 
  getPopularTV,
  getNowPlayingMovies,
  getTopRatedMovies,
  getMoviesByGenre,
  getTVByGenre
} from './api/movieService';

// 🌟 LAZY COMPONENTLER DOSYANIN EN ÜSTÜNE TAŞINDI (Böylece her renderda sıfırlanmazlar)
const MovieModal = lazy(() => import('./components/MovieModal'));
const PersonModal = lazy(() => import('./components/PersonModal'));

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
  
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const [favoriteMovies, setFavoriteMovies] = useState(() => {
    const savedData = localStorage.getItem('my_favorites_data');
    return savedData ? JSON.parse(savedData) : [];
  });

  const [favorites, setFavorites] = useState(() => {
    const savedData = localStorage.getItem('my_favorites_data');
    const parsed = savedData ? JSON.parse(savedData) : [];
    return new Set(parsed.map(m => m.id));
  });

  const toggleFavorite = (movie) => {
    setFavorites((prevFavorites) => {
      const newFavorites = new Set(prevFavorites);
      let newFavMovies = [...favoriteMovies];
      
      if (newFavorites.has(movie.id)) { 
        newFavorites.delete(movie.id); 
        newFavMovies = newFavMovies.filter(m => m.id !== movie.id); 
      } else {
        newFavorites.add(movie.id); 
        newFavMovies.push(movie); 
      }
      
      setFavoriteMovies(newFavMovies);
      localStorage.setItem('my_favorites_data', JSON.stringify(newFavMovies));
      
      return newFavorites;
    });
  };

  const handleSelectGenre = async (genreId, type = 'movie') => {
    setShowOnlyFavorites(false); 
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
    const allFetchedMovies = [...trendingMovies, ...nowPlaying, ...topRated, ...popularMovies, ...popularTV];

    if (allFetchedMovies.length === 0) return;

    const keys = Object.keys(localStorage);
    const cwItems = keys
      .filter(key => key.startsWith('continue_watch_'))
      .map(key => JSON.parse(localStorage.getItem(key)))
      .sort((a, b) => b.updatedAt - a.updatedAt); 

    const matchedMovies = cwItems.map(item => {
      return allFetchedMovies.find(m => String(m.id) === String(item.movieId));
    }).filter(Boolean); 

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
      <Navbar 
        onSelectMedia={handleSelectMedia}
        onSelectPerson={(id) => setSelectedPersonId(id)}
        onSelectGenre={handleSelectGenre}
        onShowFavorites={() => {
          setShowOnlyFavorites(true);
          setSelectedGenre(null);
        }}
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
          {!showOnlyFavorites && heroMovie && <HeroBanner movie={heroMovie} />}

          <div className="main-container" style={{ marginTop: !showOnlyFavorites && heroMovie ? '-60px' : '40px', position: 'relative', zIndex: '2', width: '100%', paddingLeft: '4%', boxSizing: 'border-box' }}>
            
            {showOnlyFavorites ? (
              <div style={{ padding: '20px 0 50px 0' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '20px', color: '#fff' }}>Listem</h1>
                {favoriteMovies.length > 0 ? (
                  <MovieRow 
                    title="" 
                    movies={favoriteMovies} 
                    onSelectMovie={handleSelectMedia} 
                    onSelectMedia={handleSelectMedia}
                    favorites={favorites} 
                    onToggleFavorite={toggleFavorite}
                  />
                ) : (
                  <div style={{ color: '#aaa', fontSize: '1.1rem', marginTop: '20px' }}>
                    Henüz favorilere eklenmiş bir içerik yok. Kartlardaki kalp ikonuna tıklayarak listeni oluşturabilirsin! ♥
                  </div>
                )}
              </div>
            ) : selectedGenre !== null ? (
              <MovieRow 
                title={`Seçilen Türe Ait ${genreMediaType === 'tv' ? 'Diziler' : 'Filmler'}`}
                movies={filteredMovies} 
                isLoading={loading}
                mediaType={genreMediaType}
                onSelectMovie={handleSelectMedia}
                onSelectMedia={handleSelectMedia}
                favorites={favorites} 
                onToggleFavorite={toggleFavorite}
              />
            ) : (
              <>
                {favoriteMovies.length > 0 && (
                  <MovieRow 
                    title="Listem" 
                    movies={favoriteMovies} 
                    onSelectMovie={handleSelectMedia} 
                    onSelectMedia={handleSelectMedia}
                    favorites={favorites} 
                    onToggleFavorite={toggleFavorite}
                  />
                )}

                {continueWatching.length > 0 && (
                  <MovieRow 
                    title="İzlemeye Devam Et" 
                    movies={continueWatching} 
                    isLargeRow={true} 
                    onSelectMovie={handleSelectMedia} 
                    onSelectMedia={handleSelectMedia}
                    favorites={favorites} 
                    onToggleFavorite={toggleFavorite}
                  />
                )}

                {trendingMovies.length > 0 && (
                  <MovieRow title="Günün Trendleri" movies={trendingMovies} isLoading={loading} onSelectMovie={handleSelectMedia} onSelectMedia={handleSelectMedia} favorites={favorites} onToggleFavorite={toggleFavorite} />
                )}
                <MovieRow title="Vizyondakiler" movies={nowPlaying} isLoading={loading} mediaType="movie" onSelectMovie={handleSelectMedia} onSelectMedia={handleSelectMedia} favorites={favorites} onToggleFavorite={toggleFavorite} />
                <MovieRow title="En Yüksek Puanlılar" movies={topRated} isLoading={loading} mediaType="movie" onSelectMovie={handleSelectMedia} onSelectMedia={handleSelectMedia} favorites={favorites} onToggleFavorite={toggleFavorite} />
                <MovieRow title="Popüler Filmler" movies={popularMovies} isLoading={loading} mediaType="movie" onSelectMovie={handleSelectMedia} onSelectMedia={handleSelectMedia} favorites={favorites} onToggleFavorite={toggleFavorite} />
                <MovieRow title="Popüler Diziler" movies={popularTV} isLoading={loading} mediaType="tv" onSelectMovie={handleSelectMedia} onSelectMedia={handleSelectMedia} favorites={favorites} onToggleFavorite={toggleFavorite} />
              </>
            )}

          </div>
        </>
      )}

      {/* 🌟 SUSPENSE İLE SARMALANAN LAZY MODALLAR */}
      <Suspense fallback={null}>
        {selectedMedia && (
          <MovieModal 
            movieId={selectedMedia.id} 
            mediaType={selectedMedia.mediaType}
            onClose={() => setSelectedMedia(null)} 
            onSelectPerson={(personId) => setSelectedPersonId(personId)}
            favorites={favorites} 
            onToggleFavorite={toggleFavorite}
          />
        )}

        {selectedPersonId && (
          <PersonModal
            personId={selectedPersonId}
            onClose={() => setSelectedPersonId(null)}
            onSelectMedia={(id, mediaType) => setSelectedMedia({ id, mediaType })} 
          />
        )}
      </Suspense>
    </div>
  );
};

export default App;