import { getImageUrl } from "../api/imageHelper";

const HeroBanner = ({ movie }) => {
  if (!movie) {
    return null;
  }

  return (
    <div 
      className="hero-banner" 
      style={{ backgroundImage: `url(${getImageUrl(movie.backdrop_path, 'original')})` }}
    >
      {/* Arkadaki görseli soldan ve alttan karartacak overlay */}
      <div className="hero-overlay"></div>

      <div className="hero-content">
        {/* Başlık: Film ise title, dizi ise name özelliğini okur */}
        <h1 className="hero-title">{movie.title || movie.name}</h1>
        
        {/* Özet metni */}
        <p className="hero-overview">{movie.overview}</p>
        
        {/* Butonlar */}
        <div className="hero-buttons">
          <button className="btn-play">▶ Oynat</button>
          <button className="btn-info">ℹ Daha Fazla Bilgi</button>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;