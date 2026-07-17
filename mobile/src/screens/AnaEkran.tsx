import React from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useMovieData } from '../hooks/useMovieData';
import { MovieSlider } from '../components/FilmSlider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function AnaEkran() {

  const { trending, popularMovies, popularTV, nowPlaying, topRated, loading, error } = useMovieData();

 
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>İçerikler yüklenir...</Text>
      </View>
    );
  }


  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>⚠️ Bir hata oluştu</Text>
        <Text style={styles.errorSubText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SineApp</Text>
      </View>

     
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        
        <MovieSlider title="Günün Trendleri" data={trending} />
        <MovieSlider title="Popüler Filmler" data={popularMovies} />
        <MovieSlider title="Popüler Diziler" data={popularTV} />
        <MovieSlider title="Vizyondakiler" data={nowPlaying} />
        <MovieSlider title="En Yüksek Puan Alanlar" data={topRated} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414', // Koyu tema arka planı
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#252525',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E50914', // Marka rengi (Netflix kırmızısı tarzı)
  },
  scrollContent: {
    paddingVertical: 16,
  },
  loadingText: {
    color: '#999',
    marginTop: 10,
    fontSize: 14,
  },
  errorText: {
    color: '#E50914',
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