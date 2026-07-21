import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { getImageUrl } from '../api/config';

export const MovieCard = ({ item }) => {
  const navigation = useNavigation();
  const title = item.title || item.name || 'İsimsiz İçerik';
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '0.0';

  // Dizi ve Film ayrımını title / name varlığına göre yapıp parametre ile geçiriyoruz
  const handlePress = () => {
    const type = item.first_air_date || item.name ? 'tv' : 'movie';
    navigation.navigate('Detay', { id: item.id, type: type });
  };

  return (
    <Pressable 
      onPress={handlePress}
      onLongPress={() => alert(title)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image
        source={{ uri: getImageUrl(item.poster_path, 'w500') }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      
      <View style={styles.badge}>
        <Text style={styles.badgeText}>⭐ {rating}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140,
    height: 210,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1e1e1e',
    position: 'relative',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});