import MovieCard from "./MovieCard";
import "./MovieRow.css";

// 🌟 1. favorites ve onToggleFavorite proplarını bileşene ekledik
const MovieRow = ({ title, movies, isLoading, mediaType = "movie", onSelectMovie, favorites, onToggleFavorite }) => {
  const hasMovies = Array.isArray(movies) && movies.length > 0;

  return (
    <div className="movie-row" style={{ marginBottom: '30px', width: '100%', overflow: 'hidden' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '10px', color: '#e5e5e5' }}>
        {title}
      </h2>
      
      <div className="movie-row-cards">
        {isLoading ? (
          [...Array(6)].map((_, index) => (
            <div key={index} className="skeleton-card animate-pulse"></div>
          ))
        ) : hasMovies ? (
          movies.map((movie) => (
            <div key={movie.id} className="movie-row-card-wrapper">
              {/* 🌟 2. O(1) maliyetli Set kontrolünü (favorites?.has) kartlara aktardık */}
              <MovieCard 
                movie={movie} 
                mediaType={mediaType} 
                onSelect={onSelectMovie} 
                isFavorite={favorites?.has(movie.id)} 
                onToggleFavorite={onToggleFavorite}
              />
            </div>
          ))
        ) : (
          <div style={{ color: '#aaa', padding: '10px 0', fontSize: '0.9rem' }}>
            İçerik bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieRow;