import React from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { MovieCard } from './FilmKarti';

interface MovieSliderProps {
  title: string;
  data: any[];
}

export const MovieSlider: React.FC<MovieSliderProps> = ({ title, data }) => {
  if (!data || data.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        data={data}
        renderItem={({ item }) => <MovieCard item={item} />}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
    marginBottom: 10,
  },
  listContent: {
    paddingLeft: 16,
  },
});