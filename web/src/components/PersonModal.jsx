import React, { useEffect, useState } from "react";
//! oyuncunun bilgilerini cekmek icin kullandıgımız paket api fonksiyonu
import { getPersonDetails } from "../api/movieService";
import { getImageUrl } from "../api/imageHelper";
import "./PersonModal.css";

const PersonModal = ({ personId, onClose, onSelectMedia }) => {
  //! onClose modal kapatıldıgında tetiklenecek fonksiyon
  console.log("PersonModal BİLEŞENİ ÇAĞRILDI! Gelen ID:", personId);
  //! onSelectMedia modal kapatıldıktan sonra secilen film/dizi modalını acacak fonksiyon
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!personId) return;

    const fetchPerson = async () => {
      setLoading(true);
      try {
        const data = await getPersonDetails(personId);
        setPerson(data);
      } catch (err) {
        console.error("Oyuncu detayı çekilemedi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerson();
  }, [personId]);

  if (!personId) return null;

  // Oyuncunun en popüler film/dizilerini filtreleyip sıralıyoruz
  const works = person?.combined_credits?.cast
    ? [...person.combined_credits.cast]
        .filter((item) => item.poster_path)
        //! afis gorseli olmayan eksik icerikleri listeden cıkarır
        .sort((a, b) => b.vote_count - a.vote_count)
        //! icerikleri en cok oy alandan az az oy alana dogru sıralar
        .slice(0, 12)
        //! sadece en populer ilk 12 yapımı filtreler
    : [];

  return (
    <div className="person-modal-overlay" onClick={onClose}>
      <div className="person-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="person-modal-close-btn" onClick={onClose}>
          ✕
        </button>

        {loading ? (
          <div className="person-modal-loading">Oyuncu bilgileri yükleniyor...</div>
        ) : person ? (
          <div className="person-modal-body">
            {/* Üst Alan: Oyuncu Fotoğrafı + İsim/Biyografi */}
            <div className="person-header">
              <img
                src={getImageUrl(person.profile_path, "w500")}
                alt={person.name}
                className="person-profile-img"
                onError={(e) => {
                 e.target.onerror = null;
                 e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'><rect width='200' height='300' fill='%23222'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23888' font-size='14'>Resim Yok</text></svg>";
                }}
              />
              <div className="person-info">
                <h2>{person.name}</h2>
                {person.birthday && (
                  <p className="person-meta">
                    <strong>Doğum Tarihi:</strong> {person.birthday}
                  </p>
                )}
                {person.place_of_birth && (
                  <p className="person-meta">
                    <strong>Doğum Yeri:</strong> {person.place_of_birth}
                  </p>
                )}
                <p className="person-bio">
                  {person.biography || "Biyografi bilgisi bulunmuyor."}
                </p>
              </div>
            </div>

            {/* Alt Alan: Oyuncunun Filmografisi (Oynadığı Yapımlar) */}
            {works.length > 0 && (
              <div className="person-works-section">
                <h3>Oynadığı Yapımlar</h3>
                <div className="person-works-grid">
                  {/* DÜZELTİLEN KISIM BURASI: (work, index) eklendi ve key güncellendi */}
                  {works.map((work, index) => (
                    <div
                      key={`${work.id}-${index}`}
                      className="work-card"
                      onClick={() => {
                        onClose(); // Oyuncu modalını kapatır
                        onSelectMedia(work.id, work.media_type || "movie"); // Seçilen filmin modalını açar
                      }}
                    >
                      <img
                        src={getImageUrl(work.poster_path, "w185")}
                        alt={work.title || work.name}
                      />
                      <p className="work-title">{work.title || work.name}</p>
                      <p className="work-character">{work.character || "Oyuncu"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="person-modal-error">Bilgiler yüklenemedi.</div>
        )}
      </div>
    </div>
  );
};

export default PersonModal;