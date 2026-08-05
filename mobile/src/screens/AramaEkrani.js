import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  Pressable,
  ScrollView,
  BackHandler,
  Keyboard,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { movieService } from '../api/services';
import { getImageUrl } from '../api/config';
import { historyStorage } from '../utils/historyStorage';

export default function AramaEkrani({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Arama Input Fokus Durumu
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Son Aramalar Geçmişi
  const [searchHistory, setSearchHistory] = useState([]);

  // Arama Boşken Gösterilecek Öneriler
  const [suggestions, setSuggestions] = useState({ recommended: [], popularTV: [] });
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // 1. Önerileri ve Arama Geçmişini Yükle
  useEffect(() => {
    const fetchSuggestionsAndHistory = async () => {
      try {
        setSuggestionsLoading(true);
        const [data, history] = await Promise.all([
          movieService.getSearchSuggestions(),
          historyStorage.getSearchHistory(),
        ]);
        setSuggestions(data || { recommended: [], popularTV: [] });
        setSearchHistory(history || []);
      } catch (err) {
        console.error('Veriler çekilirken hata:', err);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchSuggestionsAndHistory();
  }, []);

  // 2. Android & Cihaz Geri Tuşu Mantığı
  useEffect(() => {
    const onBackPress = () => {
      // 1. Durum: Arama kutusunda metin var veya arama sonuçları gösteriliyorsa
      if (query.trim().length > 0) {
        Keyboard.dismiss();
        setQuery('');
        setResults([]);
        setIsInputFocused(false);
        if (inputRef.current) inputRef.current.blur();
        return true; // Geri gitme işlemini engelle, arama ekranı ana haline dönsün
      }

      // 2. Durum: Klavye açık veya arama barı odağındaysa (Son aramalar görünüyorsa)
      if (isInputFocused) {
        Keyboard.dismiss();
        setIsInputFocused(false);
        if (inputRef.current) inputRef.current.blur();
        return true; // Geri gitme işlemini engelle, varsayılan önerilere dönsün
      }

      // 3. Durum: Ekran zaten en temiz halinde ise standart geri gitme yap
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => backHandler.remove();
  }, [query, isInputFocused]);

  // 3. Arama İşlemi (400ms Debounce & AbortController)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      setPage(1);
      setTotalPages(1);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const data = await movieService.multiSearch(query, 1, controller.signal);
        if (data) {
          const filtered = data.results.filter(
            (item) => item.media_type === 'movie' || item.media_type === 'tv' || item.media_type === 'person'
          );
          setResults(filtered);
          setPage(1);
          setTotalPages(data.total_pages);

          // Başarılı aramayı geçmişe ekle
          const updatedHistory = await historyStorage.addSearchQuery(query.trim());
          if (updatedHistory) setSearchHistory(updatedHistory);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Arama hatası:', err);
        }
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Infinite Scroll
  const loadMoreResults = async () => {
    if (loadingMore || page >= totalPages || !query.trim()) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const data = await movieService.multiSearch(query, nextPage);

      if (data && data.results) {
        const filtered = data.results.filter(
          (item) => item.media_type === 'movie' || item.media_type === 'tv' || item.media_type === 'person'
        );
        setResults((prev) => [...prev, ...filtered]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error('Daha fazla yüklenirken hata:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleItemPress = async (item, defaultType = 'movie') => {
    const mediaType = item.media_type || defaultType;
    await historyStorage.addWatchHistory(item);

    if (mediaType === 'person') {
      navigation.push('Oyuncu', { personId: item.id });
    } else {
      navigation.push('Detay', { id: item.id, type: mediaType });
    }
  };

  // Arama Temizleme Butonuna Basıldığında
  const handleClearQuery = () => {
    setQuery('');
    setResults([]);
    setIsInputFocused(false);
    Keyboard.dismiss();
    if (inputRef.current) inputRef.current.blur();
  };

  // Geçmiş Arama Silme İşlemleri
  const handleRemoveHistoryItem = async (itemToRemove) => {
    const updated = await historyStorage.removeSearchQuery(itemToRemove);
    setSearchHistory(updated || []);
  };

  const handleClearAllHistory = async () => {
    await historyStorage.clearSearchHistory();
    setSearchHistory([]);
  };

  // Arama Sonucu Kartı
  const renderSearchResultItem = ({ item }) => {
    const title = item.title || item.name;
    const isPerson = item.media_type === 'person';
    const imagePath = isPerson ? item.profile_path : item.poster_path;
    const typeLabel = item.media_type === 'movie' ? ' Film' : item.media_type === 'tv' ? ' Dizi' : ' Oyuncu';

    return (
      <Pressable style={styles.card} onPress={() => handleItemPress(item)}>
        <Image
          source={{ uri: getImageUrl(imagePath, 'w500') }}
          style={[styles.poster, isPerson && styles.personPoster]}
          contentFit="cover"
        />
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.typeBadge}>{typeLabel}</Text>
          {!isPerson && item.vote_average > 0 && (
            <Text style={styles.rating}>⭐ {item.vote_average.toFixed(1)}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#555" />
      </Pressable>
    );
  };

  // Yatay Kayan Öneri Kartı
  const renderHorizontalCard = (item, type) => (
    <Pressable
      key={item.id}
      style={styles.sliderCard}
      onPress={() => handleItemPress(item, type)}
    >
      <Image
        source={{ uri: getImageUrl(item.poster_path, 'w500') }}
        style={styles.sliderPoster}
        contentFit="cover"
      />
      <Text style={styles.sliderTitle} numberOfLines={1}>
        {item.title || item.name}
      </Text>
      <Text style={styles.sliderRating}>⭐ {item.vote_average?.toFixed(1)}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Arama Input Barı */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#7709e5" style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Film, dizi veya oyuncu ara..."
          placeholderTextColor="#777"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={handleClearQuery}>
            <Ionicons name="close-circle" size={20} color="#777" />
          </Pressable>
        )}
      </View>

      {/* DURUM 1: ARAMA YAPILIYOR VEYA SONUÇLAR BÖLÜMÜ */}
      {query.trim().length > 0 ? (
        loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#7709e5" />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={renderSearchResultItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreResults}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator size="small" color="#7709e5" style={{ marginVertical: 15 }} />
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="search-outline" size={50} color="#555" />
                <Text style={styles.emptyText}>Aramanızla eşleşen sonuç bulunamadı.</Text>
              </View>
            }
          />
        )
      ) : (
        /* DURUM 2: ARAMA KUTUSU BOŞKEN */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.suggestionsContainer}>
          {/* SADECE ARAMA BARI TIKLANDIĞINDA/FOKUSLUYKEN GÖSTERİLEN SON ARAMALAR */}
          {isInputFocused && searchHistory.length > 0 && (
            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <View style={{ flex: 1 }} />
                <Pressable onPress={handleClearAllHistory}>
                  <Text style={styles.clearText}>Temizle</Text>
                </Pressable>
              </View>
              {searchHistory.map((historyItem, idx) => (
                <View key={idx} style={styles.historyRow}>
                  <Pressable
                    style={styles.historyTextPress}
                    onPress={() => setQuery(historyItem)}
                  >
                    <Ionicons name="time-outline" size={18} color="#777" style={{ marginRight: 10 }} />
                    <Text style={styles.historyText}>{historyItem}</Text>
                  </Pressable>
                  <Pressable
                    style={{ padding: 4 }}
                    onPress={() => handleRemoveHistoryItem(historyItem)}
                  >
                    <Ionicons name="close" size={18} color="#666" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {suggestionsLoading ? (
            <ActivityIndicator size="large" color="#7709e5" style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* SİZİN İÇİN ÖNERİLENLER */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sizin İçin Önerilenler</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {suggestions.recommended?.map((item) => renderHorizontalCard(item, 'movie'))}
                </ScrollView>
              </View>

              {/* EN POPÜLER DİZİLER */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>En Popüler Diziler</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {suggestions.popularTV?.map((item) => renderHorizontalCard(item, 'tv'))}
                </ScrollView>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  poster: {
    width: 50,
    height: 75,
    borderRadius: 6,
    backgroundColor: '#252525',
  },
  personPoster: {
    borderRadius: 25,
    height: 50,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  typeBadge: {
    color: '#7709e5',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  rating: {
    color: '#aaa',
    fontSize: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#777',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  suggestionsContainer: {
    paddingBottom: 30,
  },
  historySection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 4,
  },
  clearText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  historyTextPress: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyText: {
    color: '#ccc',
    fontSize: 14,
  },
  section: {
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 12,
  },
  sliderCard: {
    width: 120,
    marginLeft: 16,
  },
  sliderPoster: {
    width: 120,
    height: 170,
    borderRadius: 10,
    backgroundColor: '#252525',
  },
  sliderTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  sliderRating: {
    color: '#aaa',
    fontSize: 11,
    marginTop: 2,
  },
});