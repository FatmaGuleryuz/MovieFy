import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  FlatList,
  Dimensions,
  Animated,
  Easing,
  Modal,
} from 'react-native';
import { useMovieData } from '../hooks/useMovieData';
import { MovieSlider } from '../components/FilmSlider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { getImageUrl } from '../api/config';
import { Ionicons } from '@expo/vector-icons';
import { useMultiFavorites } from '../hooks/useMultiFavorites';
import { movieService } from '../api/services';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.76;

export default function AnaEkran({ navigation, route }) {
  const {
    trending,
    popularMovies,
    popularTV,
    nowPlaying,
    topRated,
    recommended,
    animationMovies,
    horrorMovies,
    nolanMovies,
    loading,
    error,
  } = useMovieData();

  const [activeIndex, setActiveIndex] = useState(0);
  const [splashVisible, setSplashVisible] = useState(true);

  // LİSTE VE OYNATMA STATE'LERİ
  const { listNames, toggleMovieInList, getListsContainingMovie } = useMultiFavorites();
  const [selectedMovieForList, setSelectedMovieForList] = useState(null);
  const [showListModal, setShowListModal] = useState(false);
  const [loadingPlayId, setLoadingPlayId] = useState(null);

  // GİRDAP & GEÇİŞ ANİMASYONLARI
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;

  // KAYDIRMA HAREKETİ İLE TAB BAR GİZLEME/GÖSTERME REFERANSI
  const lastOffsetY = useRef(0);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 900,
            easing: Easing.back(1.8),
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.bezier(0.42, 0, 0.58, 1),
            useNativeDriver: true,
          }),
          Animated.timing(contentFadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setSplashVisible(false);
          if (route?.params?.onSplashFinish) {
            route.params.onSplashFinish();
          }
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [loading]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1080deg'],
  });

  const handleScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  // 🌟 DİKEY SCROLL TAKİBİ (AŞAĞI KAYDIRINCA GİZLE, YUKARI KAYDIRINCA GÖSTER)
  const handleVerticalScroll = (event) => {
    const currentOffsetY = event.nativeEvent.contentOffset.y;
    const diff = currentOffsetY - lastOffsetY.current;

    if (Math.abs(diff) > 6) {
      if (diff > 0 && currentOffsetY > 120) {
        // Aşağı kaydırılıyor -> Tab Bar'ı gizle
        navigation.setOptions({ tabBarStyle: { display: 'none' } });
      } else if (diff < 0) {
        // Yukarı kaydırılıyor -> Tab Bar'ı yarı şeffaf gri renkle göster
        navigation.setOptions({
          tabBarStyle: {
            backgroundColor: 'rgba(28, 28, 30, 0.92)',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.08)',
            height: 60,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            shadowOpacity: 0,
            display: 'flex',
          },
        });
      }
    }
    lastOffsetY.current = currentOffsetY;
  };

  const handleHeartPress = (item) => {
    setSelectedMovieForList(item);
    setShowListModal(true);
  };

  const handleToggleList = (listName) => {
    if (selectedMovieForList) {
      const isTv = selectedMovieForList.media_type === 'tv' || selectedMovieForList.first_air_date;
      toggleMovieInList(listName, {
        id: selectedMovieForList.id,
        title: selectedMovieForList.title || selectedMovieForList.name,
        poster_path: selectedMovieForList.poster_path,
        vote_average: selectedMovieForList.vote_average,
        overview: selectedMovieForList.overview,
        release_date: selectedMovieForList.release_date || selectedMovieForList.first_air_date || '',
        media_type: isTv ? 'tv' : 'movie',
      });
    }
  };

  const handlePlayPress = async (item) => {
    if (!item) return;
    
    const isTv = item.media_type === 'tv' || !!item.first_air_date || !!item.name;
    const title = item.title || item.name || 'İçerik';

    if (isTv) {
      try {
        setLoadingPlayId(item.id);
        const seasonData = await movieService.getSeasonDetails(item.id, 1).catch(() => null);
        const firstEpisodeName = seasonData?.episodes?.[0]?.name;
        
        const displayTitle = firstEpisodeName 
          ? `${title} - 1.Sezon 1.Bölüm (${firstEpisodeName})`
          : `${title} - 1.Sezon 1.Bölüm`;

        navigation.navigate('Player', {
          id: item.id,
          title: displayTitle,
          media_type: 'tv',
        });
      } catch (err) {
        navigation.navigate('Player', {
          id: item.id,
          title: `${title} - 1.Sezon 1.Bölüm`,
          media_type: 'tv',
        });
      } finally {
        setLoadingPlayId(null);
      }
    } else {
      navigation.navigate('Player', {
        id: item.id,
        title: title,
        media_type: 'movie',
      });
    }
  };

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>⚠️ Bir hata oluştu</Text>
        <Text style={styles.errorSubText}>{error}</Text>
      </View>
    );
  }

  const heroItems = trending ? trending.slice(0, 6) : [];

  const containingLists = selectedMovieForList
    ? getListsContainingMovie(selectedMovieForList.id)
    : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* GİRDAP EFEKTLİ SPLASH EKRANI */}
      {splashVisible && (
        <View style={styles.splashContainer}>
          <Animated.View
            style={[
              styles.vortexWrapper,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { rotate: spin },
                ],
              },
            ]}
          >
            <View style={styles.logoWrapper}>
              <Text style={styles.logoMovieText}>MOVIE</Text>
              
              <View style={styles.fyContainer}>
                <Text style={styles.logoFyText}>FY</Text>
              </View>
            </View>

            <ActivityIndicator size="large" color="#7709e5" style={{ marginTop: 28 }} />
          </Animated.View>
        </View>
      )}

      {/* YUMUŞAK GEÇİŞLİ ANA EKRAN İÇERİĞİ */}
      <Animated.View style={[{ flex: 1, opacity: contentFadeAnim }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
          onScroll={handleVerticalScroll}
          scrollEventThrottle={16}
        >
          {/* HERO CAROUSEL */}
          {heroItems.length > 0 && (
            <View style={styles.heroContainer}>
              <View style={styles.headerLogoWrapper}>
                <Text style={styles.headerTitle}>MovieFy</Text>
              </View>

              <FlatList
                data={heroItems}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                renderItem={({ item }) => {
                  const title = item.title || item.name;
                  const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
                  const releaseYear = (item.release_date || item.first_air_date || '').substring(0, 4);

                  const isItemInFav = getListsContainingMovie(item.id).length > 0;

                  return (
                    <Pressable
                      style={styles.heroCard}
                      onPress={() =>
                        navigation.navigate('Detay', { id: item.id, type: item.media_type || 'movie' })
                      }
                    >
                      <Image
                        source={{ uri: getImageUrl(item.backdrop_path || item.poster_path, 'original') }}
                        style={styles.heroImage}
                        contentFit="cover"
                      />

                      <LinearGradient
                        colors={['rgba(14,14,14,0.85)', 'transparent', 'rgba(20,20,20,0.6)', '#141414']}
                        locations={[0, 0.2, 0.7, 1]}
                        style={styles.heroGradient}
                      >
                        <View style={styles.heroContent}>
                          <Text style={styles.heroTitle} numberOfLines={2}>
                            {title}
                          </Text>

                          <View style={styles.heroMetaRow}>
                            <Text style={styles.heroMetaText}>⭐ {rating}</Text>
                            {releaseYear ? <Text style={styles.heroMetaText}>• {releaseYear}</Text> : null}
                            <Text style={styles.heroMetaText}>• Öne Çıkan</Text>
                          </View>

                          {/* HERO BUTONLARI */}
                          <View style={styles.heroButtonsRow}>
                            <Pressable
                              style={styles.iconOnlyButton}
                              onPress={() => handlePlayPress(item)}
                            >
                              {loadingPlayId === item.id ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <Ionicons name="play" size={28} color="#fff" />
                              )}
                            </Pressable>

                            <Pressable 
                              style={styles.iconOnlyButton}
                              onPress={() => handleHeartPress(item)}
                            >
                              <Ionicons
                                name={isItemInFav ? 'heart' : 'heart-outline'}
                                size={28}
                                color={isItemInFav ? '#7709e5' : '#fff'}
                              />
                            </Pressable>
                          </View>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  );
                }}
              />

              <View style={styles.paginationContainer}>
                {heroItems.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      activeIndex === index && styles.activePaginationDot,
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          {/* KATEGORİ SLIDER'LARI */}
          <View style={styles.slidersWrapper}>
            <MovieSlider title="Günün Trendleri" data={trending} />
            <MovieSlider title="Popüler Filmler" data={popularMovies} />
            <MovieSlider title="Trend Diziler" data={popularTV} />
            <MovieSlider title="Sizin İçin Önerilenler" data={recommended} />
            <MovieSlider title="Christopher Nolan İmzalı" data={nolanMovies} />
            <MovieSlider title="Vizyondakiler" data={nowPlaying} />
            <MovieSlider title="Animasyon" data={animationMovies} />
            <MovieSlider title="Korku Severler İçin" data={horrorMovies} />
            <MovieSlider title="En Yüksek Puan Alanlar" data={topRated} />
          </View>
        </ScrollView>
      </Animated.View>

      {/* HERO SLIDER İÇİN LİSTE SEÇİM MODALI */}
      <Modal
        visible={showListModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowListModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowListModal(false)}>
          <View style={styles.listSheetContent} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.listSheetTitle}>Listelerime Ekle / Çıkar</Text>
            <Text style={styles.listSheetSubTitle}>
              {selectedMovieForList?.title || selectedMovieForList?.name}
            </Text>

            <ScrollView style={{ maxHeight: 250, marginVertical: 10 }}>
              {listNames.map((name) => {
                const inThisList = containingLists.includes(name);

                return (
                  <Pressable
                    key={name}
                    style={[styles.listSelectOption, inThisList && styles.activeListSelectOption]}
                    onPress={() => handleToggleList(name)}
                  >
                    <Text style={[styles.listOptionText, inThisList && styles.activeListOptionText]}>
                      {name}
                    </Text>

                    <Ionicons
                      name={inThisList ? 'checkmark-circle' : 'add-circle-outline'}
                      size={22}
                      color={inThisList ? '#7709e5' : '#777'}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable style={styles.doneButton} onPress={() => setShowListModal(false)}>
              <Text style={styles.doneButtonText}>Tamam</Text>
            </Pressable>
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
  scrollView: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#141414',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  vortexWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMovieText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    textAlign: 'center',
  },
  fyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    transform: [{ scaleX: 1.4 }],
  },
  logoFyText: {
    fontSize: 54,
    fontWeight: '900',
    color: '#7709e5',
    letterSpacing: -3,
  },
  headerLogoWrapper: {
    position: 'absolute',
    top: 12,
    left: 16,
    zIndex: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#7709e5',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  heroContainer: {
    position: 'relative',
    height: HERO_HEIGHT,
    width: '100%',
    marginBottom: 10,
  },
  heroCard: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  heroContent: {
    paddingHorizontal: 16,
    paddingBottom: 34,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  heroMetaText: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '600',
  },
  heroButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  iconOnlyButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activePaginationDot: {
    width: 18,
    backgroundColor: '#7709e5',
  },
  slidersWrapper: {
    marginTop: 4,
  },
  errorText: {
    color: '#7709e5',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  errorSubText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  listSheetContent: {
    width: '100%',
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  listSheetTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  listSheetSubTitle: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  listSelectOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#252527',
    borderRadius: 10,
    marginBottom: 8,
  },
  activeListSelectOption: {
    backgroundColor: 'rgba(119, 9, 229, 0.18)',
    borderWidth: 1,
    borderColor: '#7709e5',
  },
  listOptionText: {
    color: '#ccc',
    fontSize: 15,
    fontWeight: '600',
  },
  activeListOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  doneButton: {
    backgroundColor: '#7709e5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});