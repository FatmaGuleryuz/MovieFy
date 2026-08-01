import React, { useEffect, useState } from "react";
import { getGenres } from "../api/movieService";
import "./GenreFilter.css";

const GenreFilter = ({ selectedGenre, onSelectGenre }) => {
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    const fetchGenres = async () => {
      const data = await getGenres();
      setGenres(data);
    };
    fetchGenres();
  }, []);

  return (
    <div className="genre-filter-container">
      <button
        className={`genre-chip ${selectedGenre === null ? "active" : ""}`}
        onClick={() => onSelectGenre(null)}
      >
        Tümü ✨
      </button>

      {genres.map((genre) => (
        <button
          key={genre.id}
          className={`genre-chip ${selectedGenre === genre.id ? "active" : ""}`}
          onClick={() => onSelectGenre(genre.id)}
        >
          {genre.name}
        </button>
      ))}
    </div>
  );
};

export default GenreFilter;