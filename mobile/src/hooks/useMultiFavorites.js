import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MULTI_FAVORITES_KEY = '@moviefy_multi_list_v1';

export function useMultiFavorites() {
  // Tüm listeleri tutan state: { "Liste Adı": [FilmObjesi, ...], ... }
  const [allLists, setAllLists] = useState({});
  const [loading, setLoading] = useState(true);

  // 1. Cihaz hafızasından tüm listeleri yükle
  const loadAllLists = useCallback(async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(MULTI_FAVORITES_KEY);
      if (stored) {
        setAllLists(JSON.parse(stored));
      } else {
        // İlk kez açılıyorsa varsayılan bir liste oluşturabiliriz
        setAllLists({ "İzleyeceklerim": [] });
      }
    } catch (error) {
      console.error('Listeler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllLists();
  }, [loadAllLists]);

  const saveToStorage = async (data) => {
    await AsyncStorage.setItem(MULTI_FAVORITES_KEY, JSON.stringify(data));
  };

  // 2. Yeni Liste Oluştur
  const createNewList = async (listName) => {
    if (!listName || allLists[listName]) return; // İsim boşsa veya varsa oluşturma
    const updated = { ...allLists, [listName]: [] };
    setAllLists(updated);
    await saveToStorage(updated);
  };

  // 3. Listeye Film Ekle/Çıkar (Toggle)
  const toggleMovieInList = async (listName, movie) => {
    if (!allLists[listName]) return;

    let updatedLists = { ...allLists };
    let targetList = [...updatedLists[listName]];
    
    const isExist = targetList.some((fav) => fav.id === movie.id);

    if (isExist) {
      // Varsa çıkar
      targetList = targetList.filter((fav) => fav.id !== movie.id);
    } else {
      // Yoksa ekle (Gerekli temel bilgileri kaydet)
      targetList.push({
        id: movie.id,
        title: movie.title || movie.name,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        overview: movie.overview, // Menüde göstermek için ekledik
        release_date: movie.release_date || movie.first_air_date, // 🌟 Tarih eklendi
        media_type: movie.media_type || 'movie',
      });
    }

    updatedLists[listName] = targetList;
    setAllLists(updatedLists);
    await saveToStorage(updatedLists);
  };

  // 4. Bir film HANGİ listelerde var? (Detay ekranında kalp ikonu için)
  const getListsContainingMovie = (movieId) => {
    return Object.keys(allLists).filter(listName => 
      allLists[listName].some(movie => movie.id === movieId)
    );
  };

  // 5. Listeyi Tamamen Sil
  const deleteList = async (listName) => {
    if (!allLists[listName] || listName === "İzleyeceklerim") return; // Varsayılan silinmesin
    let updated = { ...allLists };
    delete updated[listName];
    setAllLists(updated);
    await saveToStorage(updated);
  }

  return {
    allLists, // Tüm listeler ve filmler
    listNames: Object.keys(allLists), // Sadece liste isimleri dizisi
    loading,
    createNewList,
    toggleMovieInList,
    getListsContainingMovie,
    deleteList,
    refreshLists: loadAllLists
  };
}