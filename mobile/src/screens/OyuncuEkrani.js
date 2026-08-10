import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, FlatList, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { movieService } from '../api/services';
import { getImageUrl } from '../api/config';
import { Ionicons } from '@expo/vector-icons';

export default function OyuncuEkrani({ route, navigation }) {
  const { personId } = route.params || {};

  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPerson = async () => {
      try {
        setLoading(true);
        const data = await movieService.getPersonDetails(personId);
        setPerson(data);
      } catch (err) {
        setError('Oyuncu bilgileri yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };

    if (personId) fetchPerson();
  }, [personId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#7709e5" />
      </View>
    );
  }

  if (error || !person) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error || 'Oyuncu bulunamadı.'}</Text>
      </View>
    );
  }

  const filmography = person.combined_credits?.cast || [];

  return (
    <View style={styles.container}>
      {/* Sol Üst Yüzen (Floating) Geri Tuşu */}
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={28} color="#fff" />
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Alanı */}
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: getImageUrl(person.profile_path, 'w500') }}
              style={styles.profileImage}
              contentFit="cover"
            />
          </View>
          <Text style={styles.name}>{person.name}</Text>
          {person.known_for_department && (
            <Text style={styles.department}>{person.known_for_department}</Text>
          )}
          {person.birthday && (
            <Text style={styles.meta}>📅 {person.birthday} {person.place_of_birth ? `• ${person.place_of_birth}` : ''}</Text>
          )}
        </View>

        <View style={styles.content}>
          {/* Biyografi */}
          <Text style={styles.sectionTitle}>Biyografi</Text>
          <Text style={styles.biography}>
            {person.biography || 'Bu oyuncu için biyografi bilgisi bulunmuyor.'}
          </Text>

          {/* Filmografi */}
          {filmography.length > 0 && (
            <View style={styles.filmographySection}>
              <Text style={styles.sectionTitle}>Filmografi</Text>
              <FlatList
                data={filmography}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => {
                  const title = item.title || item.name;
                  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');

                  return (
                    <Pressable
                      style={styles.mediaCard}
                      onPress={() => navigation.push('Detay', { id: item.id, type: mediaType })}
                    >
                      <Image
                        source={{ uri: getImageUrl(item.poster_path, 'w500') }}
                        style={styles.mediaPoster}
                        contentFit="cover"
                      />
                      <Text style={styles.mediaTitle} numberOfLines={1}>{title}</Text>
                      {item.character && (
                        <Text style={styles.characterName} numberOfLines={1}>
                          {item.character}
                        </Text>
                      )}
                    </Pressable>
                  );
                }}
              />
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
  // Sol Üst Yüzen (Floating) Şeffaf Geri Tuşu
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
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50, // Geri butonunun altına denk gelmesi için üst boşluk artırıldı
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  profileImageContainer: {
    width: 142,
    height: 142,
    borderRadius: 71,
    borderWidth: 1,
    borderColor: '#7709e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#7709e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  profileImage: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: '#222',
  },
  name: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  department: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 2,
  },
  meta: {
    color: '#777',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  biography: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  filmographySection: {
    marginBottom: 20,
  },
  mediaCard: {
    width: 110,
    marginRight: 12,
  },
  mediaPoster: {
    width: 110,
    height: 160,
    borderRadius: 6,
    backgroundColor: '#222',
    marginBottom: 6,
  },
  mediaTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  characterName: {
    color: '#777',
    fontSize: 11,
  },
  errorText: {
    color: '#7709e5',
    fontSize: 16,
  },
});