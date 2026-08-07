import { getImageUrl } from "../api/imageHelper";

// 1. Yeni proplarımızı (isFavorite ve onToggleFavorite) ekledik
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
        position: 'relative' // Butonun kartın içine oturması için eklendi
      }}
    >
      <span className="rating-badge">{rating}</span>

      {/* 🌟 YENİ: FAVORİ (KALP) BUTONU 🌟 */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // ⚡ ÇOK KRİTİK: Tıklamanın karta sıçrayıp modalı açmasını engeller
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
          color: isFavorite ? '#e50914' : 'white', // Favoriyse Netflix kırmızısı, değilse beyaz
          fontSize: '18px',
          transition: 'transform 0.2s ease',
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
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
        />
      ) : (
        <div className="no-image">Resim Yok</div>
      )}
    </div>
  );
};

export default MovieCard;