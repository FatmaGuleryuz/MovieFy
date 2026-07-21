export const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const TMDB_TOKEN = process.env.EXPO_PUBLIC_TMDB_TOKEN;
// console.log("OKUNAN TOKEN:", TMDB_TOKEN);

export const getHeaders = () => {
  // Token'ın varsa başındaki ve sonundaki tüm gizli boşlukları temizliyoruz
  const cleanToken = TMDB_TOKEN ? TMDB_TOKEN.trim() : '';
  
  return {
    'accept': 'application/json',
    'Authorization': `Bearer ${cleanToken}`,
  };
};

export const getImageUrl = (path, size = 'w500') => {
  if (!path) return 'https://via.placeholder.com/500x750?text=Gorsel+Yok';
  return `${IMAGE_BASE_URL}/${size}${path}`;
};