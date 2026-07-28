import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, Pressable, Linking, FlatList, Modal, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { movieService } from '../api/services';
import { getImageUrl } from '../api/config';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
// 2'li ızgara için kart genişliği hesabı (Ekran genişliği - pad'ler ve aradaki boşluk)
const GRID_CARD_WIDTH = (width - 44) / 2;

export default function DetayEkrani({ route, navigation }) {
  const { id, type = 'movie' } = route.params || {};

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Aktif Sekme (Tab) Yönetimi
  const [activeTab, setActiveTab] = useState(type === 'tv' ? 'episodes' : 'cast');

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  // Sezon Seçim Modalı Durumu
  const [showSeasonModal, setShowSeasonModal] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await movieService.getDetails(id, type);
        setDetail(data);

        if (type === 'tv' && data.seasons && data.seasons.length > 0) {
          const firstSeasonNum = data.seasons[0].season_number || 1;
          setSelectedSeason(firstSeasonNum);
        }
      } catch (err) {
        setError('Detay bilgileri yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetail();
  }, [id, type]);

  useEffect(() => {
    if (type === 'tv' && id && selectedSeason !== null) {
      const fetchSeason = async () => {
        try {
          setLoadingEpisodes(true);
          const seasonData = await movieService.getSeasonDetails(id, selectedSeason);
          setEpisodes(seasonData.episodes || []);
        } catch (err) {
          console.error('Bölümler çekilemedi:', err);
        } finally {
          setLoadingEpisodes(false);
        }
      };

      fetchSeason();
    }
  }, [id, type, selectedSeason]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#7709e5" />
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error || 'İçerik bulunamadı'}</Text>
      </View>
    );
  }

  const title = detail.title || detail.name;
  const releaseDate = detail.release_date || detail.first_air_date || 'Tarih Yok';
  const genres = detail.genres ? detail.genres.map(g => g.name).join(', ') : 'Tür Belirtilmemiş';
  const duration = detail.runtime 
    ? `${detail.runtime} dk` 
    : detail.episode_run_time?.length 
    ? `${detail.episode_run_time[0]} dk/bölüm` 
    : '';

  const trailer = detail.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');

  const openTrailer = () => {
    if (trailer) {
      Linking.openURL(`https://www.youtube.com/watch?v=${trailer.key}`);
    } else {
      alert('Fragman bulunamadı.');
    }
  };

  const playContent = (episodeTitle = '') => {
    navigation.navigate('Player', {
      title: episodeTitle ? `${title} - ${episodeTitle}` : title,
      id: detail.id,
    });
  };

  return (
    <View style={styles.container}>
      {/* Sol Üst Yüzen Geri Tuşu */}
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={28} color="#fff" />
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Arka Plan Görsel Katmanı */}
        <View style={styles.backdropContainer}>
          <Image
            source={{ uri: getImageUrl(detail.backdrop_path || detail.poster_path, 'original') }}
            style={styles.backdrop}
            contentFit="cover"
          />
          
          <View style={styles.backdropGradient} />

          <View style={styles.headerContent}>
            <Image
              source={{ uri: getImageUrl(detail.poster_path, 'w500') }}
              style={styles.poster}
              contentFit="cover"
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.genres}>{genres}</Text>
              <Text style={styles.meta}>
                ⭐ {detail.vote_average?.toFixed(1)} {duration ? `| ${duration}` : ''}
              </Text>
              <Text style={styles.metaDate}> {releaseDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Oynatma Butonları */}
          <View style={styles.actionButtonsRow}>
            <Pressable style={styles.playButton} onPress={() => playContent()}>
              <Ionicons name="play" size={20} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.playButtonText}>Şimdi İzle (Player)</Text>
            </Pressable>

            {trailer && (
              <Pressable style={styles.trailerButton} onPress={openTrailer}>
                <Ionicons name="logo-youtube" size={18} color="#de1a1a" style={{ marginRight: 6 }} />
                <Text style={styles.trailerButtonText}>Fragman</Text>
              </Pressable>
            )}
          </View>

          {/* Özet */}
          <Text style={styles.sectionTitle}>Özet</Text>
          <Text style={styles.overview}>{detail.overview || 'Özet bilgisi bulunmuyor.'}</Text>

          {/* SEKMELİ KULLANICI SEÇİM ALANI (TAB BAR) */}
          <View style={styles.tabContainer}>
            {type === 'tv' && (
              <Pressable
                style={[styles.tabButton, activeTab === 'episodes' && styles.activeTabButton]}
                onPress={() => setActiveTab('episodes')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'episodes' && styles.activeTabButtonText]}>
                  Bölümler
                </Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.tabButton, activeTab === 'cast' && styles.activeTabButton]}
              onPress={() => setActiveTab('cast')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'cast' && styles.activeTabButtonText]}>
                Oyuncular
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabButton, activeTab === 'similar' && styles.activeTabButton]}
              onPress={() => setActiveTab('similar')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'similar' && styles.activeTabButtonText]}>
                Benzer İçerikler
              </Text>
            </Pressable>
          </View>

          {/* 1. SEÇENEK: BÖLÜMLER */}
          {type === 'tv' && activeTab === 'episodes' && (
            <View style={styles.tabContentSection}>
              <Pressable
                style={styles.seasonDropdownButton}
                onPress={() => setShowSeasonModal(true)}
              >
                <Text style={styles.seasonDropdownText}>
                  {detail.seasons?.find((s) => s.season_number === selectedSeason)?.name ||
                    `${selectedSeason}. Sezon`}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#fff" />
              </Pressable>

              <Modal
                visible={showSeasonModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSeasonModal(false)}
              >
                <Pressable style={styles.modalBackdrop} onPress={() => setShowSeasonModal(false)}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Sezon Seçin</Text>

                    <FlatList
                      data={detail.seasons}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={({ item }) => (
                        <Pressable
                          style={[
                            styles.seasonOption,
                            selectedSeason === item.season_number && styles.activeSeasonOption,
                          ]}
                          onPress={() => {
                            setSelectedSeason(item.season_number);
                            setShowSeasonModal(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.seasonOptionText,
                              selectedSeason === item.season_number && styles.activeSeasonOptionText,
                            ]}
                          >
                            {item.name} ({item.episode_count} Bölüm)
                          </Text>
                          {selectedSeason === item.season_number && (
                            <Ionicons name="checkmark" size={20} color="#7709e5" />
                          )}
                        </Pressable>
                      )}
                    />
                  </View>
                </Pressable>
              </Modal>

              {loadingEpisodes ? (
                <ActivityIndicator size="small" color="#7709e5" style={{ marginVertical: 15 }} />
              ) : (
                episodes.map((ep) => (
                  <Pressable 
                    key={ep.id} 
                    style={styles.episodeCard}
                    onPress={() => playContent(`${ep.season_number}.Sezon ${ep.episode_number}.Bölüm`)}
                  >
                    <Text style={styles.episodeNumber}>{ep.episode_number}. Bölüm</Text>
                    <View style={styles.episodeInfo}>
                      <Text style={styles.episodeTitle}>{ep.name}</Text>
                      <Text style={styles.episodeOverview} numberOfLines={2}>
                        {ep.overview || 'Bölüm özeti bulunmuyor.'}
                      </Text>
                    </View>
                    <Ionicons name="play-circle-outline" size={26} color="#7709e5" />
                  </Pressable>
                ))
              )}
            </View>
          )}

          {/* 2. SEÇENEK: OYUNCULAR (YAN YANA 2'Lİ DİZİLİM) */}
          {activeTab === 'cast' && (
            <View style={styles.tabContentSection}>
              {detail.credits?.cast?.length > 0 ? (
                <FlatList
                  data={detail.credits.cast.slice(0, 16)}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={2}
                  scrollEnabled={false} // Ana ScrollView ile çakışmaması için
                  columnWrapperStyle={styles.gridRow}
                  renderItem={({ item }) => (
                    <Pressable 
                      style={styles.gridCastCard}
                      onPress={() => navigation.push('Oyuncu', { personId: item.id })}
                    >
                      <Image
                        source={{ uri: getImageUrl(item.profile_path, 'w500') }}
                        style={styles.gridCastImage}
                        contentFit="cover"
                      />
                      <View style={styles.gridCardInfo}>
                        <Text style={styles.castName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.characterName} numberOfLines={1}>{item.character}</Text>
                      </View>
                    </Pressable>
                  )}
                />
              ) : (
                <Text style={styles.emptyText}>Oyuncu bilgisi bulunamadı.</Text>
              )}
            </View>
          )}

          {/* 3. SEÇENEK: BENZER İÇERİKLER (YAN YANA 2'Lİ FİLM KARTI DİZİLİMİ) */}
          {activeTab === 'similar' && (
            <View style={styles.tabContentSection}>
              {detail.similar?.results?.length > 0 ? (
                <FlatList
                  data={detail.similar.results.slice(0, 12)}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={2}
                  scrollEnabled={false} // Ana ScrollView ile çakışmaması için
                  columnWrapperStyle={styles.gridRow}
                  renderItem={({ item }) => {
                    const itemTitle = item.title || item.name;
                    const itemRating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';

                    return (
                      <Pressable 
                        style={styles.gridMovieCard}
                        onPress={() => navigation.push('Detay', { id: item.id, type: item.media_type || type })}
                      >
                        <Image
                          source={{ uri: getImageUrl(item.poster_path, 'w500') }}
                          style={styles.gridMovieImage}
                          contentFit="cover"
                        />
                        <View style={styles.gridCardInfo}>
                          <Text style={styles.gridMovieTitle} numberOfLines={1}>{itemTitle}</Text>
                          <Text style={styles.gridMovieRating}>⭐ {itemRating}</Text>
                        </View>
                      </Pressable>
                    );
                  }}
                />
              ) : (
                <Text style={styles.emptyText}>Benzer içerik bulunamadı.</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 45,
    left: 16,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropContainer: {
    position: 'relative',
    height: 380,
    width: '100%',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backdropGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 20, 20, 0.65)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: 20,
  },
  poster: {
    width: 115,
    height: 165,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'flex-end',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  genres: {
    color: '#7709e5',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  meta: {
    color: '#eee',
    fontSize: 13,
    fontWeight: '600',
  },
  metaDate: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  playButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#7709e5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  trailerButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  trailerButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  overview: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },

  // TAB BAR STİLLERİ
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 10,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#7709e5',
  },
  tabButtonText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tabContentSection: {
    marginBottom: 20,
    minHeight: 120,
  },

  // SEZON DROPDOWN STİLLERİ
  seasonDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#252525',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  seasonDropdownText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '60%',
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  seasonOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activeSeasonOption: {
    backgroundColor: 'rgba(119, 9, 229, 0.15)',
  },
  seasonOptionText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  activeSeasonOptionText: {
    color: '#7709e5',
    fontWeight: 'bold',
  },
  episodeCard: {
    backgroundColor: '#1f1f1f',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  episodeNumber: {
    color: '#7709e5',
    fontWeight: 'bold',
    marginRight: 12,
    fontSize: 14,
  },
  episodeInfo: {
    flex: 1,
    marginRight: 8,
  },
  episodeTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  episodeOverview: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },

  // 2'Lİ IZGARA (GRID) STİLLERİ
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gridCastCard: {
    width: GRID_CARD_WIDTH,
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridCastImage: {
    width: '100%',
    height: GRID_CARD_WIDTH * 1.25,
    backgroundColor: '#222',
  },
  gridMovieCard: {
    width: GRID_CARD_WIDTH,
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridMovieImage: {
    width: '100%',
    height: GRID_CARD_WIDTH * 1.45,
    backgroundColor: '#222',
  },
  gridCardInfo: {
    padding: 8,
  },
  castName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  characterName: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  gridMovieTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  gridMovieRating: {
    color: '#aaa',
    fontSize: 11,
    marginTop: 4,
  },
  emptyText: {
    color: '#777',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 10,
  },
  errorText: {
    color: '#7709e5',
    fontSize: 16,
  },
});