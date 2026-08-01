import { getImageUrl } from "../api/imageHelper";

const MovieCard = ({ movie, mediaType, onSelect }) => {
  const rating = movie?.vote_average ? movie.vote_average.toFixed(1) : "0.0";
  // Eğer movie objesinde media_type varsa onu, yoksa dışarıdan verilen mediaType'ı, o da yoksa varsayılan 'movie' kullanıyoruz
  const currentMediaType = movie?.media_type || mediaType || "movie";

  return (
    <div 
      className="movie-card" 
      onClick={() => onSelect && onSelect(movie.id, currentMediaType)}
      style={{ 
        width: '100%', 
        height: 'auto', 
        cursor: 'pointer' 
      }}
    >
      <span className="rating-badge">{rating}</span>

      {movie?.poster_path ? (
        <img 
          src={getImageUrl(movie.poster_path, 'w500')} 
          alt={movie.title || movie.name} 
          className="movie-poster"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
        />
      ) : (
        <div className="no-image">Resim Yok</div>
      )}
    </div>
  );
};

export default MovieCard;