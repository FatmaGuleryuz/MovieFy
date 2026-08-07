import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { movieService } from '../api/services';
import { getImageUrl } from '../api/config';

const YILLAR = ['Tümü', '2026', '2025', '2024', '2023', '2022', '2020', '2018', '2015'];
const SIRALAMALAR = [
  { label: ' En Popüler', value: 'popularity.desc' },
  { label: ' En Yüksek Puan', value: 'vote_average.desc' },
  { label: ' En Yeni', value: 'primary_release_date.desc' },
];

export default function KesfetEkrani({ navigation }) {
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedYear, setSelectedYear] = useState('Tümü');
  const [selectedSort, setSelectedSort] = useState('popularity.desc');

  // Modal / Dropdown Durumları
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 🌟 KAYDIRMA HAREKETİ İLE TAB BAR GİZLEME/GÖSTERME REFERANSI
  const lastOffsetY = useRef(0);

  // Türleri Yükle
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const data = await movieService.getGenres();
        if (data?.genres) {
          setGenres(data.genres);
        }
      } catch (err) {
        console.error('Türler yüklenemedi:', err);
      }
    };
    fetchGenres();
  }, []);

  // Filtre Değiştikçe Filmleri Getir
  useEffect(() => {
    const fetchFilteredMovies = async () => {
      try {
        setLoading(true);
        const yearParam = selectedYear === 'Tümü' ? '' : selectedYear;
        const data = await movieService.discoverMovies(
          selectedGenre,
          yearParam,
          selectedSort,
          1
        );
        if (data) {
          setMovies(data.results || []);
          setPage(1);
          setTotalPages(data.total_pages);
        }
      } catch (err) {
        console.error('Keşfet hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredMovies();
  }, [selectedGenre, selectedYear, selectedSort]);

  // 🌟 DİKEY SCROLL TAKİBİ (AŞAĞI KAYDIRINCA GİZLE, YUKARI KAYDIRINCA GÖSTER)
  const handleScroll = (event) => {
    const currentOffsetY = event.nativeEvent.contentOffset.y;
    const diff = currentOffsetY - lastOffsetY.current;

    if (Math.abs(diff) > 6) {
      if (diff > 0 && currentOffsetY > 120) {
        // Aşağı kaydırılıyor -> Tab Bar'ı gizle
        navigation.setOptions({ tabBarStyle: { display: 'none' } });
      } else if (diff < 0) {
        // Yukarı kaydırılıyor -> Tab Bar'ı göster
        navigation.setOptions({
          tabBarStyle: {
            backgroundColor: '#1f1f1f',
            borderTopWidth: 1,
            borderTopColor: '#2a2a2a',
            height: 60,
            elevation: 0,
            shadowOpacity: 0,
            display: 'flex',
          },
        });
      }
    }
    lastOffsetY.current = currentOffsetY;
  };

  // Sonsuz Kaydırma (Infinite Scroll)
  const loadMoreMovies = async () => {
    if (loadingMore || page >= totalPages) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const yearParam = selectedYear === 'Tümü' ? '' : selectedYear;
      const data = await movieService.discoverMovies(
        selectedGenre,
        yearParam,
        selectedSort,
        nextPage
      );

      if (data?.results) {
        setMovies((prev) => [...prev, ...data.results]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error('Daha fazla film yüklenirken hata:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const renderMovieCard = ({ item }) => (
    <Pressable
      style={styles.card}
      onPress={() => navigation.push('Detay', { id: item.id, type: 'movie' })}
    >
      <Image
        source={{ uri: getImageUrl(item.poster_path, 'w500') }}
        style={styles.poster}
        contentFit="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.rating}>⭐ {item.vote_average?.toFixed(1)}</Text>
          <Text style={styles.date}>
            {item.release_date ? item.release_date.substring(0, 4) : ''}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  // Seçili Sıralamanın Metni
  const activeSortLabel =
    SIRALAMALAR.find((s) => s.value === selectedSort)?.label || '🔥 En Popüler';

  // HEADER: FlatList ile birlikte kaybolacak üst alan
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Keşfet</Text>

      {/* TÜR ROZETLERİ */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Pressable
            style={[styles.badge, selectedGenre === '' && styles.activeBadge]}
            onPress={() => setSelectedGenre('')}
          >
            <Text style={[styles.badgeText, selectedGenre === '' && styles.activeBadgeText]}>
              Tüm Türler
            </Text>
          </Pressable>
          {genres.map((g) => (
            <Pressable
              key={g.id}
              style={[styles.badge, selectedGenre === g.id && styles.activeBadge]}
              onPress={() => setSelectedGenre(g.id)}
            >
              <Text style={[styles.badgeText, selectedGenre === g.id && styles.activeBadgeText]}>
                {g.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* DROPDOWN FİLTRE BUTONLARI (YIL ∨ ve SIRALA ∨) */}
      <View style={styles.dropdownRow}>
        {/* Yıl Butonu */}
        <Pressable
          style={styles.dropdownButton}
          onPress={() => setYearModalVisible(true)}
        >
          <View style={styles.dropdownTextContainer}>
            <Text style={styles.dropdownLabel}>Yıl</Text>
            <Text style={styles.dropdownValue}>{selectedYear}</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#7709e5" />
        </Pressable>

        {/* Sıralama Butonu */}
        <Pressable
          style={styles.dropdownButton}
          onPress={() => setSortModalVisible(true)}
        >
          <View style={styles.dropdownTextContainer}>
            <Text style={styles.dropdownLabel}>Sırala</Text>
            <Text style={styles.dropdownValue} numberOfLines={1}>
              {activeSortLabel}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#7709e5" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7709e5" />
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderMovieCard}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onEndReached={loadMoreMovies}
          onEndReachedThreshold={0.5}
          
          // 🌟 FLATLIST PERFORMANS OPTİMİZASYONLARI
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}

          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color="#7709e5" style={{ marginVertical: 15 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="filter-outline" size={50} color="#555" />
              <Text style={styles.emptyText}>Seçtiğiniz filtrelere uygun film bulunamadı.</Text>
            </View>
          }
        />
      )}

      {/* YIL AÇILIR MENÜSÜ */}
      <Modal
        visible={yearModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setYearModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setYearModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yıl Seçin</Text>
            <ScrollView style={{ maxHeight: 260 }}>
              {YILLAR.map((y) => (
                <Pressable
                  key={y}
                  style={[
                    styles.modalOption,
                    selectedYear === y && styles.activeModalOption,
                  ]}
                  onPress={() => {
                    setSelectedYear(y);
                    setYearModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedYear === y && styles.activeModalOptionText,
                    ]}
                  >
                    {y}
                  </Text>
                  {selectedYear === y && (
                    <Ionicons name="checkmark" size={18} color="#7709e5" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* SIRALAMA AÇILIR MENÜSÜ */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSortModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sıralama Seçin</Text>
            {SIRALAMALAR.map((s) => (
              <Pressable
                key={s.value}
                style={[
                  styles.modalOption,
                  selectedSort === s.value && styles.activeModalOption,
                ]}
                onPress={() => {
                  setSelectedSort(s.value);
                  setSortModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedSort === s.value && styles.activeModalOptionText,
                  ]}
                >
                  {s.label}
                </Text>
                {selectedSort === s.value && (
                  <Ionicons name="checkmark" size={18} color="#7709e5" />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  headerContainer: {
    marginBottom: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 12,
  },
  filterSection: {
    marginBottom: 14,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#222',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  activeBadge: {
    backgroundColor: '#7709e5',
    borderColor: '#7709e5',
  },
  badgeText: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
  },
  activeBadgeText: {
    color: '#fff',
  },
  dropdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  dropdownButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1c1c1c',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  dropdownTextContainer: {
    flex: 1,
    marginRight: 6,
  },
  dropdownLabel: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
  },
  dropdownValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    marginBottom: 14,
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    height: 220,
    backgroundColor: '#252525',
  },
  cardContent: {
    padding: 8,
  },
  title: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    color: '#aaa',
    fontSize: 11,
  },
  date: {
    color: '#666',
    fontSize: 11,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#777',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1f1f1f',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 8,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeModalOption: {
    backgroundColor: 'rgba(119, 9, 229, 0.15)',
  },
  modalOptionText: {
    color: '#ccc',
    fontSize: 14,
  },
  activeModalOptionText: {
    color: '#7709e5',
    fontWeight: 'bold',
  },
});