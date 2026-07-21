import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, Pressable, Linking, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { movieService } from '../api/services';
import { getImageUrl } from '../api/config';
import { MovieSlider } from '../components/FilmSlider';
import { Ionicons } from '@expo/vector-icons';

export default function DetayEkrani({ route, navigation }) {
  const { id, type = 'movie' } = route.params || {};

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

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

  return (
    <View style={styles.container}>
      {/* Sol Üst Yüzen (Floating) Geri Tuşu */}
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={28} color="#fff" />
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Büyütülmüş Arka Plan Görseli Katmanı */}
        <View style={styles.backdropContainer}>
          <Image
            source={{ uri: getImageUrl(detail.backdrop_path || detail.poster_path, 'original') }}
            style={styles.backdrop}
            contentFit="cover"
          />
          
          {/* Görsel Üzerindeki Alt Karartma / Gölge Katmanı */}
          <View style={styles.backdropGradient} />

          {/* Görselin İçine Yerleştirilmiş Poster ve Başlık Alanı */}
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
                ⭐ {detail.vote_average?.toFixed(1)} {duration ? `| ⏱️ ${duration}` : ''}
              </Text>
              <Text style={styles.metaDate}>📅 {releaseDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Fragman Butonu */}
          {trailer && (
            <Pressable style={styles.trailerButton} onPress={openTrailer}>
              <Text style={styles.trailerButtonText}>▶ Fragmanı İzle</Text>
            </Pressable>
          )}

          {/* Özet */}
          <Text style={styles.sectionTitle}>Özet</Text>
          <Text style={styles.overview}>{detail.overview || 'Özet bilgisi bulunmuyor.'}</Text>

          {/* DİZİYE ÖZEL: Sezonlar */}
          {type === 'tv' && detail.seasons?.length > 0 && (
            <View style={styles.tvSection}>
              <Text style={styles.sectionTitle}>Sezonlar & Bölümler</Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seasonList}>
                {detail.seasons.map((season) => (
                  <Pressable
                    key={season.id}
                    style={[
                      styles.seasonTab,
                      selectedSeason === season.season_number && styles.activeSeasonTab,
                    ]}
                    onPress={() => setSelectedSeason(season.season_number)}
                  >
                    <Text
                      style={[
                        styles.seasonTabText,
                        selectedSeason === season.season_number && styles.activeSeasonTabText,
                      ]}
                    >
                      {season.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {loadingEpisodes ? (
                <ActivityIndicator size="small" color="#7709e5" style={{ marginVertical: 15 }} />
              ) : (
                episodes.map((ep) => (
                  <View key={ep.id} style={styles.episodeCard}>
                    <Text style={styles.episodeNumber}>{ep.episode_number}. Bölüm</Text>
                    <View style={styles.episodeInfo}>
                      <Text style={styles.episodeTitle}>{ep.name}</Text>
                      <Text style={styles.episodeOverview} numberOfLines={2}>
                        {ep.overview || 'Bölüm özeti bulunmuyor.'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Cast Şeridi */}
          {detail.credits?.cast?.length > 0 && (
            <View style={styles.castSection}>
              <Text style={styles.sectionTitle}>Oyuncular</Text>
              <FlatList
                data={detail.credits.cast.slice(0, 10)}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Pressable 
                    style={styles.castCard}
                    onPress={() => navigation.push('Oyuncu', { personId: item.id })}
                  >
                    <Image
                      source={{ uri: getImageUrl(item.profile_path, 'w500') }}
                      style={styles.castImage}
                      contentFit="cover"
                    />
                    <Text style={styles.castName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.characterName} numberOfLines={1}>{item.character}</Text>
                  </Pressable>
                )}
              />
            </View>
          )}

          {/* Benzer İçerikler */}
          {detail.similar?.results?.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <MovieSlider title="Benzer İçerikler" data={detail.similar.results} />
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
  // Sol Üst Yüzen Geri Tuşu
  backButton: {
    position: 'absolute',
    top: 45,
    left: 16,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Şeffaf siyah daire
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Arka Plan Görsel Kapsayıcısı (Yükseklik 380px yapıldı)
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
  // Görselin altını karartan ve yazıları öne çıkaran gölge katmanı
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
  trailerButton: {
    backgroundColor: '#7709e5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  trailerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  overview: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  tvSection: {
    marginBottom: 20,
  },
  seasonList: {
    marginBottom: 12,
  },
  seasonTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#252525',
    marginRight: 8,
  },
  activeSeasonTab: {
    backgroundColor: '#7709e5',
  },
  seasonTabText: {
    color: '#aaa',
    fontSize: 13,
  },
  activeSeasonTabText: {
    color: '#fff',
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
  castSection: {
    marginBottom: 10,
  },
  castCard: {
    width: 90,
    marginRight: 12,
  },
  castImage: {
    width: 90,
    height: 120,
    borderRadius: 6,
    backgroundColor: '#222',
    marginBottom: 4,
  },
  castName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  characterName: {
    color: '#888',
    fontSize: 10,
  },
  errorText: {
    color: '#7709e5',
    fontSize: 16,
  },
});