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
} from 'react-native';
import { useMovieData } from '../hooks/useMovieData';
import { MovieSlider } from '../components/FilmSlider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { getImageUrl } from '../api/config';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.76;

export default function AnaEkran({ navigation }) {
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

  // GİRDAP (VORTEX) ANİMASYON DEĞERLERİ
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 750,
            easing: Easing.back(1.5),
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 750,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setSplashVisible(false);
        });
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [loading]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== activeIndex) {
      setActiveIndex(index);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* 🌪️ 1. NUMARALI ÇİZİME UYGUN SPLASH EKRANI 🌪️ */}
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
            {/* 1 NUMARALI ÇİZİM LOGO DİZİLİMİ */}
            <View style={styles.logoWrapper}>
              <Text style={styles.logoMovieText}>MOVIE</Text>
              
              {/* FY BİRBİRİNE YAKIN VE DEVASA */}
              <View style={styles.fyContainer}>
                <Text style={styles.logoFyText}>FY</Text>
              </View>
            </View>

            <ActivityIndicator size="large" color="#7709e5" style={{ marginTop: 24 }} />
          </Animated.View>
        </View>
      )}

      {/* 🎬 ANA EKRAN İÇERİĞİ */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* HERO CAROUSEL */}
        {heroItems.length > 0 && (
          <View style={styles.heroContainer}>
            <View style={styles.headerLogoWrapper}>
              <Text style={styles.headerTitle}>Moviefy</Text>
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
                          <Text style={styles.heroMetaText}>{rating}</Text>
                          {releaseYear ? <Text style={styles.heroMetaText}>• {releaseYear}</Text> : null}
                          <Text style={styles.heroMetaText}>• Öne Çıkan</Text>
                        </View>

                        <View style={styles.heroButtonsRow}>
                          <Pressable
                            style={styles.iconOnlyButton}
                            onPress={() =>
                              navigation.navigate('Player', {
                                title: title,
                                id: item.id,
                              })
                            }
                          >
                            <Ionicons name="play" size={28} color="#fff" />
                          </Pressable>

                          <Pressable style={styles.iconOnlyButton}>
                            <Ionicons name="add" size={32} color="#fff" />
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
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 3,
    textAlign: 'center',
  },
  
  // 🌟 1 NUMARALI ÇİZİMDEKİ GİBİ: BİRBİRİNE YAKIN, ORTASI BOŞ OLMAYAN VE DEVASA FY 🌟
  fyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10, // MOVIE kelimesinin hemen altına yapıştırır
  },
  logoFyText: {
    fontSize: 64, // Dev boyutta F ve Y harfi
    fontWeight: '900',
    color: '#7709e5',
    letterSpacing: -2, // Harflerin arasını kapatıp birbirine yaklaştırır
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
    padding: 4,
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
});