import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useMultiFavorites } from '../hooks/useMultiFavorites';
import { useIsFocused } from '@react-navigation/native';
import { getImageUrl } from '../api/config';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ListemEkrani({ navigation }) {
  const { 
    allLists, 
    listNames, 
    loading, 
    refreshLists, 
    toggleMovieInList, 
    createNewList 
  } = useMultiFavorites();
  
  const isFocused = useIsFocused();

  const [selectedList, setSelectedList] = useState('İzleyeceklerim');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [createListModalVisible, setCreateListModalVisible] = useState(false);
  const [newListNameInput, setNewListNameInput] = useState('');

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMovieInfo, setSelectedMovieInfo] = useState(null);

  useEffect(() => {
    if (isFocused) {
      refreshLists();
    }
  }, [isFocused, refreshLists]);

  const handleCreateList = async () => {
    if (!newListNameInput.trim()) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir liste ismi girin.');
      return;
    }
    await createNewList(newListNameInput.trim());
    setSelectedList(newListNameInput.trim());
    setNewListNameInput('');
    setCreateListModalVisible(false);
  };

  const toggleDropdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleOpenMenu = (listName, movie) => {
    setSelectedMovieInfo({ listName, movie });
    setMenuVisible(true);
  };

  const handleCloseMenu = () => {
    setMenuVisible(false);
    setSelectedMovieInfo(null);
  };

  const handleRemoveFromList = () => {
    if (selectedMovieInfo) {
      toggleMovieInList(selectedMovieInfo.listName, selectedMovieInfo.movie);
      handleCloseMenu();
    }
  };

  const handleGoToDetail = () => {
    if (selectedMovieInfo) {
      const { id, media_type } = selectedMovieInfo.movie;
      handleCloseMenu();
      navigation.navigate('Detay', { id, type: media_type });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#7709e5" />
      </SafeAreaView>
    );
  }

  const currentMovies = allLists[selectedList] || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ÜST HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorilerim</Text>
        
        <View style={styles.headerRightArea}>
          <Pressable 
            style={styles.addListButton} 
            onPress={() => setCreateListModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>

          <Ionicons name="person-circle-outline" size={30} color="#fff" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* LİSTELERİM AÇILIR DROPDOWN BARI */}
        <View style={styles.sectionContainer}>
          <Pressable style={styles.sectionHeader} onPress={toggleDropdown}>
            <Text style={styles.sectionTitle}>Listelerim</Text>
            <Ionicons 
              name={isDropdownOpen ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#fff" 
            />
          </Pressable>

          {/* DROPDOWN MENU */}
          {isDropdownOpen && (
            <View style={styles.dropdownContainer}>
              {listNames.map((name) => {
                const count = allLists[name]?.length || 0;
                const isSelected = selectedList === name;

                return (
                  <Pressable
                    key={name}
                    style={[
                      styles.dropdownItem,
                      isSelected && styles.activeDropdownItem
                    ]}
                    onPress={() => {
                      setSelectedList(name);
                      toggleDropdown();
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      isSelected && styles.activeDropdownItemText
                    ]}>
                      {name}
                    </Text>

                    <View style={styles.dropdownItemRight}>
                      <Text style={styles.countBadgeText}>{count} İçerik</Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color="#7709e5" style={{ marginLeft: 6 }} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* DİKEY FİLM KARTLARI */}
          <View style={styles.verticalListContainer}>
            {currentMovies.length === 0 ? (
              <Text style={styles.emptyText}>"{selectedList}" listenizde henüz içerik yok.</Text>
            ) : (
              currentMovies.map((movie) => {
                // Tarih Parse Kontrolü
                const rawDate = movie.release_date || movie.first_air_date || '';
                const releaseYear = rawDate ? rawDate.substring(0, 4) : '';

                return (
                  <View key={movie.id} style={styles.movieRowCard}>
                    {/* Sol Taraf: Poster + İsim (Tam Metin) & Çıkış Yılı */}
                    <Pressable
                      style={styles.cardLeftPressable}
                      onPress={() => navigation.navigate('Detay', { id: movie.id, type: movie.media_type })}
                    >
                      <Image
                        source={{ uri: getImageUrl(movie.poster_path, 'w500') }}
                        style={styles.poster}
                        contentFit="cover"
                      />

                      <View style={styles.movieTextGroup}>
                        {/* 🌟 KESİNLİKLE KIRPILMAZ, ALT SATIRA GEÇER */}
                        <Text style={styles.movieTitle}>
                          {movie.title}
                        </Text>
                        
                        {/* 🌟 YIL METNİ (Tarih varsa) */}
                        <Text style={styles.movieReleaseYear}>
                          {releaseYear ? releaseYear : 'Yıl Belirtilmemiş'}
                        </Text>
                      </View>
                    </Pressable>

                    {/* Sağ Taraf: Üç Nokta (...) Butonu */}
                    <Pressable 
                      style={styles.threeDotButton} 
                      onPress={() => handleOpenMenu(selectedList, movie)}
                    >
                      <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* MODAL & BOTTOM SHEET KOŞULLARI */}
      <Modal
        visible={createListModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateListModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCreateListModalVisible(false)}>
          <Pressable style={styles.createModalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Yeni Liste Oluştur</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="Liste ismi giriniz (Örn: Korku, Maraton)"
              placeholderTextColor="#777"
              value={newListNameInput}
              onChangeText={setNewListNameInput}
            />

            <View style={styles.modalButtonRow}>
              <Pressable 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setCreateListModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>İptal</Text>
              </Pressable>

              <Pressable 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleCreateList}
              >
                <Text style={styles.modalButtonText}>Oluştur</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseMenu}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleCloseMenu}>
          <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />

            {selectedMovieInfo && (
              <View style={styles.sheetContent}>
                <Text style={styles.sheetMovieTitle}>
                  {selectedMovieInfo.movie.title}
                </Text>

                <Text style={styles.sheetMovieOverview} numberOfLines={3}>
                  {selectedMovieInfo.movie.overview || 'Kısa özet bulunmuyor.'}
                </Text>

                <View style={styles.sheetActionArea}>
                  <Pressable style={styles.sheetButton} onPress={handleRemoveFromList}>
                    <Ionicons name="trash-outline" size={20} color="#e50914" />
                    <Text style={[styles.sheetButtonText, { color: '#e50914' }]}>
                      Listem'den Kaldır
                    </Text>
                  </Pressable>

                  <View style={styles.sheetSeparator} />

                  <Pressable style={styles.sheetButton} onPress={handleGoToDetail}>
                    <Ionicons name="information-circle-outline" size={20} color="#fff" />
                    <Text style={styles.sheetButtonText}>Daha Fazla Bilgi</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </Pressable>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerRightArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addListButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#7709e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 30,
  },

  sectionContainer: {
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  dropdownContainer: {
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  activeDropdownItem: {
    backgroundColor: 'rgba(119, 9, 229, 0.12)',
  },
  dropdownItemText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  activeDropdownItemText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dropdownItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#777',
    fontSize: 12,
  },

  // 🌟 DİKEY KARTLARIN DÜZENİ (ÇAKIŞMAYI ÇÖZEN STİLLER)
  verticalListContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  movieRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#262626',
  },
  cardLeftPressable: {
    flex: 1, // Kapsayıcıya esneklik katıldı
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    flexShrink: 1, // Sıkışmayı engelleyen temel ayar
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 6,
    backgroundColor: '#222',
  },
  movieTextGroup: {
    marginLeft: 12,
    flex: 1,
    flexShrink: 1, // İsmin dar alanda kalıp alt satıra geçmesini sağlar
    justifyContent: 'center',
  },
  movieTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 18,
    marginBottom: 4,
  },
  movieReleaseYear: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '500',
  },
  threeDotButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#777',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 20,
    textAlign: 'center',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createModalContent: {
    width: '85%',
    backgroundColor: '#1f1f1f',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  textInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#444',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  saveButton: {
    backgroundColor: '#7709e5',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  bottomSheet: {
    width: '100%',
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  sheetContent: {
    width: '100%',
  },
  sheetMovieTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  sheetMovieOverview: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  sheetActionArea: {
    backgroundColor: '#252527',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sheetButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  sheetSeparator: {
    height: 1,
    backgroundColor: '#3a3a3c',
    width: '100%',
  },
});