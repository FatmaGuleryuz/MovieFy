import React, { useEffect, useState } from "react";
import { getMovieDetails, getTVDetails, getTVSeasonDetails } from "../api/movieService";
import { getImageUrl } from "../api/imageHelper";
import "./MovieModal.css";
import Player from "./Player";

const MovieModal = ({ movieId, mediaType = "movie", onClose, onSelectPerson }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  
  // PLAYER
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  useEffect(() => {
    if (!movieId) return;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        let result = mediaType === "tv" ? await getTVDetails(movieId) : await getMovieDetails(movieId);
        setData(result);
        if (mediaType === "tv" && result?.seasons?.length > 0) {
          const firstSeason = result.seasons.find(s => s.season_number > 0) || result.seasons[0];
          setSelectedSeason(firstSeason.season_number);
        }
      } catch (err) {
        console.error("Detay verisi çekilemedi:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [movieId, mediaType]);

  useEffect(() => {
    if (mediaType !== "tv" || !movieId || !selectedSeason) return;
    const fetchEpisodes = async () => {
      setEpisodesLoading(true);
      try {
        const seasonData = await getTVSeasonDetails(movieId, selectedSeason);
        setEpisodes(seasonData?.episodes || []);
      } catch (err) {
        console.error("Bölümler çekilemedi:", err);
      } finally {
        setEpisodesLoading(false);
      }
    };
    fetchEpisodes();
  }, [movieId, selectedSeason, mediaType]);

  if (!movieId) return null;

  const isTV = mediaType === "tv";
  const title = data?.title || data?.name;
  const releaseYear = (data?.release_date || data?.first_air_date)?.slice(0, 4);
  const trailer = data?.videos?.results?.find((vid) => vid.type === "Trailer" || vid.type === "Teaser");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* TAM EKRAN VE SİYAH BOŞLUKSUZ PLAYER ALANI */}
        {isPlayerOpen ? (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#000', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button 
              onClick={() => setIsPlayerOpen(false)}
              style={{
                position: 'absolute', top: '20px', right: '30px', zIndex: 100000,
                backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
                color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%',
                width: '50px', height: '50px', cursor: 'pointer', fontSize: '20px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,0,0,0.5)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            >
              ✕
            </button>
            <div style={{ width: '100%', height: '100%' }}>
              <Player movieId={movieId} />
            </div>
          </div>
        ) : (
          /* DETAYLAR ALANI */
          <>
            <button className="modal-close-btn" onClick={onClose}>✕</button>

            {loading ? (
              <div className="modal-loading">Yükleniyor...</div>
            ) : data ? (
              <>
                <div
                  className="modal-banner"
                  style={{
                    backgroundImage: `linear-gradient(to top, #0c0d10 10%, transparent 100%), url(${getImageUrl(data.backdrop_path || data.poster_path, "original")})`,
                  }}
                >
                  <div className="modal-banner-info">
                    <h2>{title}</h2>
                    <div className="modal-meta">
                      <span className="rating"> {data.vote_average?.toFixed(1)}</span>
                      <span>{releaseYear}</span>
                      {!isTV && data.runtime && <span>{data.runtime} dk</span>}
                      {isTV && data.number_of_seasons && <span>{data.number_of_seasons} Sezon</span>}
                    </div>
                    
                    {/* YENİ ÇERÇEVESİZ, METALİK MOR OYNAT BUTONU (Zorunlu Sola Yaslı Div ile) */}
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', marginTop: '15px' }}>
                      <button 
                        onClick={() => setIsPlayerOpen(true)}
                        style={{
                          background: 'linear-gradient(135deg, #c084fc 0%, #9333ea 50%, #581c87 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundColor: 'transparent',
                          border: 'none',
                          fontSize: '40px', 
                          cursor: 'pointer',
                          transition: 'transform 0.3s ease, filter 0.3s ease',
                          filter: 'drop-shadow(0 4px 10px rgba(172, 93, 246, 0.4))',
                          padding: 0,
                          margin: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'flex-start'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.15)';
                          e.currentTarget.style.filter = 'drop-shadow(0 6px 15px rgba(147, 51, 234, 0.7))';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.filter = 'drop-shadow(0 4px 10px rgba(147, 51, 234, 0.4))';
                        }}
                      >
                        ▶
                      </button>
                    </div>

                  </div>
                </div>

                <div className="modal-body">
                  <p className="modal-overview">{data.overview || "Özet bulunamadı."}</p>
                  
                  <div className="modal-genres">
                    {data.genres?.map((genre) => (<span key={genre.id} className="genre-badge">{genre.name}</span>))}
                  </div>

                  {data.credits?.cast?.length > 0 && (
                    <div className="modal-section">
                      <h3>Oyuncu Kadrosu</h3>
                      <div className="cast-list">
                        {data.credits.cast.slice(0, 8).map((actor) => (
                          <div key={actor.id} className="cast-card" style={{ cursor: 'pointer' }} onClick={() => { if (typeof onSelectPerson === "function") onSelectPerson(actor.id); }}>
                            <img src={getImageUrl(actor.profile_path, "w185")} alt={actor.name} onError={(e) => { e.target.src = "https://via.placeholder.com/130x73?text=No+Image"; }} />
                            <p className="actor-name">{actor.name}</p>
                            <p className="character-name">{actor.character}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="modal-error">Detaylar yüklenemedi.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MovieModal;