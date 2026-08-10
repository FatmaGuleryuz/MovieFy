import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width } = Dimensions.get('window');
const PLAYER_HEIGHT = (width - 32) * (9 / 16); // 16:9 Oranı

export default function TrailerModal({ visible, youtubeKey, title, onClose }) {
  if (!youtubeKey) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* MODAL HEADER */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="logo-youtube" size={22} color="#FF0000" style={{ marginRight: 8 }} />
              <Text style={styles.title} numberOfLines={1}>
                {title} - Fragman
              </Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
          </View>

          {/* YOUTUBE PLAYER CONTAINER */}
          <View style={styles.playerWrapper}>
            <YoutubePlayer
              height={PLAYER_HEIGHT}
              play={true}
              videoId={youtubeKey}
              webViewProps={{
                allowsInlineMediaPlayback: true,
                androidLayerType: Platform.OS === 'android' ? 'hardware' : 'none',
              }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#1c1c1e',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2e',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
    backgroundColor: '#2c2c2e',
    borderRadius: 14,
  },
  playerWrapper: {
    width: '100%',
    backgroundColor: '#000',
  },
});