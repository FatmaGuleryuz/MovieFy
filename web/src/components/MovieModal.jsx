import React, { useEffect, useState } from "react";
import { getMovieDetails, getTVDetails, getTVSeasonDetails } from "../api/movieService";
import { getImageUrl } from "../api/imageHelper";
import "./MovieModal.css";

const MovieModal = ({ movieId, mediaType = "movie", onClose, onSelectPerson }) => {
 // kullanici bir filmin detay penceresindeyken oyuncu fotografina tikladiginda moviemodal, onselectperson araciligiyla app.jsxe haber verecek ve oyuncu modali tetiklenecek
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dizi Sezon Yönetimi
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  // 1. Film veya Dizi Detayını Çekme
  useEffect(() => {
    if (!movieId) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        let result = null;
        // Eğer mediaType dizi (tv) ise getTVDetails, değilse getMovieDetails çağırıyoruz
        if (mediaType === "tv") {
          result = await getTVDetails(movieId);
        } else {
          result = await getMovieDetails(movieId);
        }
        setData(result);
        
        // Dizi ise ve sezonları varsa ilk sezona ayarla
        if (mediaType === "tv" && result?.seasons?.length > 0) {
          // Özel (Specials - Sezon 0) olan durumları atlayıp ilk normal sezonu seçebiliriz
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

  // 2. Sezon Değiştikçe Bölümleri Çekme (Sadece Diziler İçin)
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

  // Fragman (YouTube) Key'ini bulma
  const trailer = data?.videos?.results?.find(
    (vid) => vid.type === "Trailer" || vid.type === "Teaser"
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>

        {loading ? (
          <div className="modal-loading">Yükleniyor...</div>
        ) : data ? (
          <>
            {/* Arka Plan Görseli (Backdrop) */}
            <div
              className="modal-banner"
              style={{
                backgroundImage: `linear-gradient(to top, #0c0d10 10%, transparent 100%), url(${getImageUrl(
                  data.backdrop_path || data.poster_path,
                  "original"
                )})`,
              }}
            >
              <div className="modal-banner-info">
                <h2>{title}</h2>
                <div className="modal-meta">
                  <span className="rating">★ {data.vote_average?.toFixed(1)}</span>
                  <span>{releaseYear}</span>
                  {!isTV && data.runtime && <span>{data.runtime} dk</span>}
                  {isTV && data.number_of_seasons && (
                    <span>{data.number_of_seasons} Sezon</span>
                  )}
                </div>
              </div>
            </div>

            {/* İçerik Gövdesi */}
            <div className="modal-body">
              <p className="modal-overview">{data.overview || "Özet bulunamadı."}</p>

              {/* Türler */}
              <div className="modal-genres">
                {data.genres?.map((genre) => (
                  <span key={genre.id} className="genre-badge">
                    {genre.name}
                  </span>
                ))}
              </div>

              {/* DİZİ SEZON & BÖLÜM ALANI (Sadece Dizilerde Görünür) */}
              {isTV && data.seasons?.length > 0 && (
                <div className="modal-section episodes-section">
                  <div className="episodes-header">
                    <h3>Bölümler</h3>
                    <select
                      className="season-select"
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    >
                      {data.seasons
                        .filter((s) => s.season_number > 0) // Sezon 0 (Özel bölümleri) gizlemek için
                        .map((season) => (
                          <option key={season.id} value={season.season_number}>
                            {season.name || `${season.season_number}. Sezon`} ({season.episode_count} Bölüm)
                          </option>
                        ))}
                    </select>
                  </div>

                  {episodesLoading ? (
                    <div className="episodes-loading">Bölümler yükleniyor...</div>
                  ) : (
                    <div className="episodes-list">
                      {episodes.map((ep) => (
                        <div key={ep.id} className="episode-card">
                          <span className="episode-number">{ep.episode_number}</span>
                          <img
                            src={getImageUrl(ep.still_path, "w185")}
                            alt={ep.name}
                            className="episode-img"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/130x73?text=No+Image";
                            }}
                          />
                          <div className="episode-info">
                            <h4>{ep.name}</h4>
                            <p>{ep.overview || "Bölüm özeti bulunmuyor."}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Fragman */}
              {trailer && (
                <div className="modal-section">
                  <h3>Fragman</h3>
                  <div className="video-container">
                    <iframe
                      src={`https://www.youtube.com/embed/${trailer.key}`}
                      title="Fragman"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}

              {/* Oyuncu Kadrosu */}
              {data.credits?.cast?.length > 0 && (
                <div className="modal-section">
                  <h3>Oyuncu Kadrosu</h3>
                  <div className="cast-list">
                    {data.credits.cast.slice(0, 8).map((actor) => (
                     <div 
  key={actor.id} 
  className="cast-card"
  style={{ cursor: 'pointer' }}
  onClick={() => {
    console.log("1. Oyuncu kartına tıklandı! Tıklanan ID:", actor.id);
    if (typeof onSelectPerson === "function") {
      console.log("2. onSelectPerson fonksiyonu mevcut, çağrılıyor...");
      onSelectPerson(actor.id);
    } else {
      console.error("3. HATA: onSelectPerson bir fonksiyon değil veya MovieModal'a geçilmedi!", onSelectPerson);
    }
  }}
>
  <img
    src={getImageUrl(actor.profile_path, "w185")}
    alt={actor.name}
    onError={(e) => {
      e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23222'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='12'>Resim Yok</text></svg>";
    }}
  />
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
      </div>
    </div>
  );
};

export default MovieModal;