declare const process: { env: { [key: string]: string | undefined } };


export const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const TMDB_TOKEN = process.env.EXPO_PUBLIC_TMDB_TOKEN;

export const getHeaders = () => {
  return {
    accept: 'application/json',
    Authorization: `Bearer ${TMDB_TOKEN}`,
  };
};


export const getImageUrl = (path: string | null, size: 'w500' | 'original' = 'w500') => {
  if (!path) return 'https://via.placeholder.com/500x750?text=Gorsel+Yok';
  return `${IMAGE_BASE_URL}/${size}${path}`;
};