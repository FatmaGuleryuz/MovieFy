import React, { useState, useEffect, useRef } from "react";
import { searchMulti, getGenres } from "../api/movieService";
import { getImageUrl } from "../api/imageHelper";
import "./Navbar.css";

const DEFAULT_GENRES = [
  { id: 28, name: "Aksiyon" },
  { id: 12, name: "Macera" },
  { id: 16, name: "Animasyon" },
  { id: 35, name: "Komedi" },
  { id: 80, name: "Suç" },
  { id: 18, name: "Dram" },
  { id: 14, name: "Fantastik" },
  { id: 27, name: "Korku" },
  { id: 878, name: "Bilim Kurgu" },
  { id: 10749, name: "Romantik" },
  { id: 53, name: "Gerilim" },
  { id: 10752, name: "Savaş" },
];

// 🌟 YENİ: onShowFavorites prop'u eklendi
const Navbar = ({ onSelectMedia, onSelectPerson, onSelectGenre, onShowFavorites }) => {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [genres, setGenres] = useState(DEFAULT_GENRES);
  const [activeMenu, setActiveMenu] = useState(null);

  const searchRef = useRef(null);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const data = await getGenres();
        if (data && data.length > 0) {
          setGenres(data);
        }
      } catch (err) {
        console.error("Türler çekilemedi, varsayılanlar kullanılıyor", err);
      }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchMulti(searchQuery);
      setSearchResults(results.slice(0, 8));
      setIsSearching(false);
      setShowSearchDropdown(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={`custom-navbar ${scrolled ? "is-scrolled" : ""}`}>
      <div className="brand-container" onClick={() => onSelectGenre && onSelectGenre(null)}>
        <div className="brand-logo-icon">M</div>
        <span className="brand-text">movify<span className="dot">.</span></span>
      </div>

      <nav className="nav-menu">
        <a href="#home" className="active" onClick={(e) => { e.preventDefault(); onSelectGenre && onSelectGenre(null); }}>
          Keşfet
        </a>

        {/* Filmler Sekmesi */}
        <div className="nav-dropdown-wrapper" onMouseEnter={() => setActiveMenu('movies')} onMouseLeave={() => setActiveMenu(null)}>
          <a href="#movies" onClick={(e) => e.preventDefault()}>Filmler</a>
          {activeMenu === 'movies' && (
            <div className="genre-dropdown-menu">
              <button className="genre-dropdown-item all-btn" onClick={() => { onSelectGenre && onSelectGenre(null); setActiveMenu(null); }}>
                Tümü
              </button>
              <div className="dropdown-grid">
                {genres.map((genre) => (
                  <button key={genre.id} className="genre-dropdown-item" onClick={() => { onSelectGenre && onSelectGenre(genre.id, 'movie'); setActiveMenu(null); }}>
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Diziler Sekmesi */}
        <div className="nav-dropdown-wrapper" onMouseEnter={() => setActiveMenu('series')} onMouseLeave={() => setActiveMenu(null)}>
          <a href="#series" onClick={(e) => e.preventDefault()}>Diziler</a>
          {activeMenu === 'series' && (
            <div className="genre-dropdown-menu">
              <button className="genre-dropdown-item all-btn" onClick={() => { onSelectGenre && onSelectGenre(null); setActiveMenu(null); }}>
                Tümü
              </button>
              <div className="dropdown-grid">
                {genres.map((genre) => (
                  <button key={genre.id} className="genre-dropdown-item" onClick={() => { onSelectGenre && onSelectGenre(genre.id, 'tv'); setActiveMenu(null); }}>
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 🌟 YENİ: LİSTEM BUTONU 🌟 */}
        <a 
          href="#mylist" 
          onClick={(e) => { 
            e.preventDefault(); 
            if(onShowFavorites) onShowFavorites(); 
          }}
          style={{ fontWeight: '500', transition: 'color 0.2s ease' }}
          onMouseEnter={(e) => e.target.style.color = '#e50914'}
          onMouseLeave={(e) => e.target.style.color = 'white'}
        >
          Listem
        </a>

        <a href="#popular">Popüler</a>
      </nav>

      <div className="nav-controls">
        <div className="search-container" ref={searchRef}>
          <div className="search-pill">
            <span className="search-icon"></span>
            <input
              type="text"
              placeholder="Film, dizi, oyuncu ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
            />
            {searchQuery && (
              <button className="clear-btn" onClick={() => setSearchQuery("")}>✕</button>
            )}
          </div>

          {showSearchDropdown && (
            <div className="search-dropdown">
              {isSearching ? (
                <div className="search-loading">Aranıyor...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item) => {
                  const isPerson = item.media_type === "person";
                  const imagePath = isPerson ? item.profile_path : item.poster_path;
                  const title = item.title || item.name;
                  const typeLabel = isPerson ? "Oyuncu" : item.media_type === "tv" ? "Dizi" : "Film";

                  return (
                    <div
                      key={`${item.id}-${item.media_type}`}
                      className="search-item"
                      onClick={() => {
                        setShowSearchDropdown(false);
                        setSearchQuery("");
                        if (isPerson) {
                          onSelectPerson && onSelectPerson(item.id);
                        } else {
                          onSelectMedia && onSelectMedia(item.id, item.media_type || "movie");
                        }
                      }}
                    >
                      <img src={getImageUrl(imagePath, "w92")} alt={title} />
                      <div className="search-item-info">
                        <p className="search-item-title">{title}</p>
                        <span className={`search-badge ${item.media_type}`}>{typeLabel}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="search-no-results">Sonuç bulunamadı.</div>
              )}
            </div>
          )}
        </div>

        <div className="avatar-circle">
          <span>K</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;