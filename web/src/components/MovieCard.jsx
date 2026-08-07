import React from "react";
import { getImageUrl } from "../api/imageHelper";

const MovieCard = ({ movie, mediaType, onSelect, isFavorite, onToggleFavorite }) => {
  const rating = movie?.vote_average ? movie.vote_average.toFixed(1) : "0.0";
  const currentMediaType = movie?.media_type || mediaType || "movie";

  return (
    <div 
      className="movie-card" 
      onClick={() => onSelect && onSelect(movie.id, currentMediaType)}
      style={{ 
        width: '100%', 
        height: 'auto', 
        cursor: 'pointer',
        position: 'relative'
      }}
    >
      <span className="rating-badge">{rating}</span>

      {/* FAVORİ (KALP) BUTONU */}
      <button
        onClick={(e) => {
          e.stopPropagation(); 
          if (onToggleFavorite) onToggleFavorite(movie);
        }}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
          color: isFavorite ? '#c084fc' : 'white', // Beğenildiyse mor renk
          fontSize: '18px',
          transition: 'transform 0.2s ease, color 0.2s ease',
          filter: isFavorite ? 'drop-shadow(0 0 6px rgba(192, 132, 252, 0.6))' : 'none'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        title={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
      >
        {isFavorite ? '♥' : '♡'}
      </button>

      {movie?.poster_path ? (
        <img 
          src={getImageUrl(movie.poster_path, 'w500')} 
          alt={movie.title || movie.name} 
          className="movie-poster"
          loading="lazy" // 🌟 PERFORMANS İÇİN LAZY LOADING EKLENDİ 🌟
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
        />
      ) : (
        <div className="no-image">Resim Yok</div>
      )}
    </div>
  );
};

export default MovieCard;