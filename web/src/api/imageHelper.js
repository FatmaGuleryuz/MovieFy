const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

export const getImageUrl = (path, size = 'w500') => {
  if (!path) {
    return 'https://via.placeholder.com/500x750?text=Gorsel+Yok';
  }
  return `${IMAGE_BASE_URL}${size}${path}`;
};