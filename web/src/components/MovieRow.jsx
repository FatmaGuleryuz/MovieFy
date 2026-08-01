import MovieCard from "./MovieCard";
import "./MovieRow.css";

const MovieRow = ({ title, movies, isLoading, mediaType = "movie", onSelectMovie }) => {
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
              <MovieCard movie={movie} mediaType={mediaType} onSelect={onSelectMovie} />
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