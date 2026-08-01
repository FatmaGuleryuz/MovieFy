import { getImageUrl } from "../api/imageHelper";
import React, { useState } from "react";
import MovieModal from "./MovieModal";

const HeroBanner = ({ movie }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!movie) return null;

  return (
    <div
      className="hero-banner"
      style={{
        backgroundImage: `url(${getImageUrl(movie.backdrop_path, "original")})`,
      }}
    >
      <div className="hero-overlay"></div>

      <div className="hero-content">
        <h1 className="hero-title">{movie.title || movie.name}</h1>
        <p className="hero-overview">{movie.overview}</p>

        {/* MODERN BUTONLAR KONTEYNERİ */}
       {/* MODERN BUTONLAR KONTEYNERİ (Daha zarif boyutlar) */}
        <div 
          className="banner-buttons" 
          style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '20px' }}
        >
          
          {/* ŞIK METALİK MOR OYNAT BUTONU */}
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 50,
              padding: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.querySelector('.play-icon').style.transform = 'scale(1.15)';
              e.currentTarget.querySelector('.play-icon').style.filter = 'drop-shadow(0 6px 15px rgba(147, 51, 234, 0.7))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.querySelector('.play-icon').style.transform = 'scale(1)';
              e.currentTarget.querySelector('.play-icon').style.filter = 'drop-shadow(0 4px 10px rgba(172, 93, 246, 0.4))';
            }}
          >
            <span
              className="play-icon"
              style={{
                background: 'linear-gradient(135deg, #c084fc 0%, #9333ea 50%, #581c87 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '40px', /* 55px'ten 40px'e küçülttük */
                transition: 'transform 0.3s ease, filter 0.3s ease',
                filter: 'drop-shadow(0 4px 10px rgba(172, 93, 246, 0.4))',
                lineHeight: 1
              }}
            >
              ▶
            </span>
            <span style={{ color: 'white', fontSize: '17px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            
            </span>
          </button>
<div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginTop: '10px' }}></div>
          {/* CAM EFEKTLİ BİLGİ BUTONU */}
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(147, 51, 234, 0.15)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(192, 132, 252, 0.3)',
              color: 'white',
              padding: '8px 20px', /* Daha kibar padding */
              borderRadius: '25px',
              fontSize: '15px', /* 18px'ten 15px'e küçülttük */
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              zIndex: 50,
              boxShadow: '0 4px 15px rgba(147, 51, 234, 0.15)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(147, 51, 234, 0.3)';
              e.currentTarget.style.border = '1px solid rgba(192, 132, 252, 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(147, 51, 234, 0.3)';
              e.currentTarget.style.border = '1px solid rgba(192, 132, 252, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
          <span style={{ 
              // 'i' harfinin çerçevesini de mor-beyaz uyumuna çektik
              border: '2px solid rgba(255,255,255,0.8)', 
              borderRadius: '50%', 
              width: '18px', height: '18px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: '12px' 
            }}>
              i
            </span>
          </button>
        </div>
      </div>

      {/* İŞTE EKSİK OLAN VE TIKLAMAYI ÇALIŞTIRACAK KISIM BURASI */}
      {isModalOpen && (
        <MovieModal
          movieId={movie.id}
          mediaType={movie.media_type || "movie"}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default HeroBanner;