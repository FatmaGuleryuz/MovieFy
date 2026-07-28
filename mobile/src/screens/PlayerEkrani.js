import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StatusBar,
  AppState,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useIsFocused } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_HLS_URL =
  'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const QUALITY_OPTIONS = ['Otomatik (ABR)', '1080p (Yüksek)', '720p (Orta)', '480p (Düşük)'];
const SUBTITLE_OPTIONS = ['Kapalı', 'Türkçe', 'İngilizce'];

export default function PlayerEkrani({ route, navigation }) {
  const videoSource = route.params?.videoUrl || DEFAULT_HLS_URL;
  const contentId = route.params?.id || 'default_video'; // Kayıt için benzersiz ID
  const isFocused = useIsFocused();

  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);

  // Hata Yakalama Durumu
  const [hasError, setHasError] = useState(false);

  // Bottom Sheet Modal Durumları
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [selectedQuality, setSelectedQuality] = useState('Otomatik (ABR)');
  const [selectedSubtitle, setSelectedSubtitle] = useState('Kapalı');

  const [seekFeedback, setSeekFeedback] = useState(null);

  const controlsTimeoutRef = useRef(null);
  const lastTapRef = useRef({ time: 0, side: null });
  const isPositionRestored = useRef(false);

  // expo-video Player Hook
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.play();
  });

  // 1. DİNAMİK SANAL BAR & KEEPAWAKE YÖNETİMİ
  useEffect(() => {
    const enableImmersiveMode = async () => {
      StatusBar.setHidden(true, 'fade');
      await activateKeepAwakeAsync();

      if (Platform.OS === 'android') {
        await NavigationBar.setVisibilityAsync('hidden');
        await NavigationBar.setBehaviorAsync('overlay-swipe');
      }
    };

    enableImmersiveMode();

    return () => {
      const disableImmersiveMode = async () => {
        StatusBar.setHidden(false, 'fade');
        await deactivateKeepAwake();
        if (Platform.OS === 'android') {
          await NavigationBar.setVisibilityAsync('visible');
        }
      };
      disableImmersiveMode();
    };
  }, []);

  // 2. ÖĞRENİLEN MANTIK: AsyncStorage'dan Kaldığı Yeri Okuma
  useEffect(() => {
    const restoreSavedPosition = async () => {
      try {
        const savedPosition = await AsyncStorage.getItem(`watch_progress_${contentId}`);
        if (savedPosition && player && !isPositionRestored.current) {
          const parsedTime = parseFloat(savedPosition);
          if (parsedTime > 5) { // İlk 5 saniyeden sonra kaldıysa atlat
            player.currentTime = parsedTime;
            setCurrentTime(parsedTime);
          }
          isPositionRestored.current = true;
        }
      } catch (e) {
        console.error('Kaldığı yer okunamadı:', e);
      }
    };

    if (player) {
      restoreSavedPosition();
    }
  }, [player, contentId]);

  // 3. ÖĞRENİLEN MANTIK: AsyncStorage'a Anlık Pozisyon Kaydetme
  useEffect(() => {
    if (!player || currentTime <= 0) return;

    const saveProgress = async () => {
      try {
        await AsyncStorage.setItem(`watch_progress_${contentId}`, currentTime.toString());
      } catch (e) {
        console.error('İlerleme kaydedilemedi:', e);
      }
    };

    // Her 5 saniyede bir kaydet
    const timer = setTimeout(saveProgress, 5000);
    return () => clearTimeout(timer);
  }, [currentTime, contentId, player]);

  // AppState / Focus Takibi
  useEffect(() => {
    if (!player) return;
    if (!isFocused) {
      player.pause();
      setIsPlaying(false);
    }
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        player.pause();
        setIsPlaying(false);
      }
    });
    return () => subscription.remove();
  }, [isFocused, player]);

  // Periyodik Takip & Hata Kontrolü
  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      try {
        if (player.currentTime !== undefined) setCurrentTime(player.currentTime || 0);
        if (player.duration !== undefined && player.duration > 0) setDuration(player.duration);
        if (player.bufferedPosition !== undefined) setBuffered(player.bufferedPosition || 0);
        setIsPlaying(player.playing);
        
        // Hata durumunu sıfırla (video başarılı oynuyorsa)
        if (player.playing && hasError) setHasError(false);
      } catch (e) {
        setHasError(true);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [player, hasError]);

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (player && player.playing && !showSettingsModal) {
        setShowControls(false);
      }
    }, 4000);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => clearTimeout(controlsTimeoutRef.current);
  }, []);

  const handleTouchArea = (side) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (
      lastTapRef.current.side === side &&
      now - lastTapRef.current.time < DOUBLE_TAP_DELAY
    ) {
      if (side === 'left') {
        const newTime = Math.max(0, currentTime - 10);
        player.currentTime = newTime;
        setCurrentTime(newTime);
        showSeekFeedbackAnimation('rewind');
      } else if (side === 'right') {
        const newTime = Math.min(duration, currentTime + 10);
        player.currentTime = newTime;
        setCurrentTime(newTime);
        showSeekFeedbackAnimation('forward');
      }
      lastTapRef.current = { time: 0, side: null };
    } else {
      lastTapRef.current = { time: now, side };
      if (showControls) {
        setShowControls(false);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      } else {
        resetControlsTimeout();
      }
    }
  };

  const showSeekFeedbackAnimation = (type) => {
    setSeekFeedback(type);
    setTimeout(() => setSeekFeedback(null), 800);
  };

  const togglePlayPause = () => {
    if (!player) return;
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
    resetControlsTimeout();
  };

  const handleSeek = (event) => {
    const { locationX, width } = event.nativeEvent;
    if (duration > 0 && width > 0 && player) {
      const seekToTime = (locationX / width) * duration;
      player.currentTime = seekToTime;
      setCurrentTime(seekToTime);
      resetControlsTimeout();
    }
  };

  const retryPlayback = () => {
    setHasError(false);
    if (player) {
      player.play();
    }
  };

  const applySpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (player) player.playbackRate = speed;
    setShowSettingsModal(false);
    setActiveTab('main');
  };

  const applyQuality = (quality) => {
    setSelectedQuality(quality);
    setShowSettingsModal(false);
    setActiveTab('main');
  };

  const applySubtitle = (sub) => {
    setSelectedSubtitle(sub);
    setShowSettingsModal(false);
    setActiveTab('main');
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar hidden />
      <View style={styles.videoContainer}>
        <VideoView style={styles.video} player={player} nativeControls={false} />

        {/* Dokunma Alanları */}
        <Pressable
          style={[styles.touchZone, { left: 0 }]}
          onPress={() => handleTouchArea('left')}
        />
        <Pressable
          style={[styles.touchZone, { right: 0 }]}
          onPress={() => handleTouchArea('right')}
        />

        {seekFeedback && (
          <View style={styles.feedbackOverlay}>
            <Ionicons
              name={seekFeedback === 'rewind' ? 'play-back' : 'play-forward'}
              size={48}
              color="#fff"
            />
            <Text style={styles.feedbackText}>
              {seekFeedback === 'rewind' ? '-10 Saniye' : '+10 Saniye'}
            </Text>
          </View>
        )}

        {/* HATA / KOPMA OVERLAY'İ */}
        {hasError && (
          <View style={styles.errorOverlay}>
            <Ionicons name="alert-circle-outline" size={54} color="#e50914" />
            <Text style={styles.errorText}>Video yüklenirken bir hata oluştu.</Text>
            <Pressable style={styles.retryButton} onPress={retryPlayback}>
              <Text style={styles.retryButtonText}>Yeniden Dene</Text>
            </Pressable>
          </View>
        )}

        {isBuffering && !hasError && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#7709e5" />
          </View>
        )}

        {/* OVERLAY */}
        {showControls && !hasError && (
          <View style={styles.overlay} pointerEvents="box-none">
            {/* ÜST BAR */}
            <View style={styles.topBar}>
              <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </Pressable>
              <Text style={styles.videoTitle} numberOfLines={1}>
                {route.params?.title || 'Video Oynatıcı'}
              </Text>
            </View>

            {/* ORTA BAR */}
            <View style={styles.centerControls}>
              <Pressable style={styles.playPauseButton} onPress={togglePlayPause}>
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={38}
                  color="#fff"
                />
              </Pressable>
            </View>

            {/* ALT BAR */}
            <View style={styles.bottomBar}>
              <Pressable style={styles.seekbarContainer} onPress={handleSeek}>
                <View style={styles.seekbarTrack}>
                  <View
                    style={[
                      styles.seekbarBuffer,
                      { width: `${Math.min(bufferPercent, 100)}%` },
                    ]}
                  />
                  <View
                    style={[
                      styles.seekbarProgress,
                      { width: `${Math.min(progressPercent, 100)}%` },
                    ]}
                  />
                </View>
              </Pressable>

              <View style={styles.bottomControlsRow}>
                <Text style={styles.timeText}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Text>

                <Pressable
                  style={styles.settingsIconButton}
                  onPress={() => {
                    setActiveTab('main');
                    setShowSettingsModal(true);
                  }}
                >
                  <Ionicons name="settings-outline" size={22} color="#fff" />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* BOTTOM SHEET SETTINGS MODAL */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowSettingsModal(false)}
        >
          <Pressable style={styles.bottomSheetContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              {activeTab !== 'main' ? (
                <Pressable onPress={() => setActiveTab('main')} style={styles.sheetBackBtn}>
                  <Ionicons name="chevron-back" size={22} color="#fff" />
                </Pressable>
              ) : null}
              <Text style={styles.sheetTitle}>
                {activeTab === 'main' && 'Video Ayarları'}
                {activeTab === 'speed' && 'Oynatma Hızı'}
                {activeTab === 'quality' && 'Video Kalitesi'}
                {activeTab === 'subtitles' && 'Altyazılar'}
              </Text>
              <Pressable onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={22} color="#aaa" />
              </Pressable>
            </View>

            {activeTab === 'main' && (
              <View style={styles.menuList}>
                <Pressable
                  style={styles.menuItem}
                  onPress={() => setActiveTab('quality')}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="options-outline" size={20} color="#7709e5" />
                    <Text style={styles.menuItemText}>Kalite</Text>
                  </View>
                  <Text style={styles.menuItemSubText}>{selectedQuality} ›</Text>
                </Pressable>

                <Pressable
                  style={styles.menuItem}
                  onPress={() => setActiveTab('speed')}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="speedometer-outline" size={20} color="#7709e5" />
                    <Text style={styles.menuItemText}>Oynatma Hızı</Text>
                  </View>
                  <Text style={styles.menuItemSubText}>{playbackSpeed === 1.0 ? 'Normal' : `${playbackSpeed}x`} ›</Text>
                </Pressable>

                <Pressable
                  style={styles.menuItem}
                  onPress={() => setActiveTab('subtitles')}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="subtitles-outline" size={20} color="#7709e5" />
                    <Text style={styles.menuItemText}>Altyazı</Text>
                  </View>
                  <Text style={styles.menuItemSubText}>{selectedSubtitle} ›</Text>
                </Pressable>
              </View>
            )}

            {activeTab === 'speed' && (
              <ScrollView style={styles.optionList}>
                {SPEED_OPTIONS.map((speed) => (
                  <Pressable
                    key={speed}
                    style={[
                      styles.optionRow,
                      playbackSpeed === speed && styles.activeOptionRow,
                    ]}
                    onPress={() => applySpeed(speed)}
                  >
                    <Text style={styles.optionText}>
                      {speed === 1.0 ? 'Normal (1.0x)' : `${speed}x`}
                    </Text>
                    {playbackSpeed === speed && (
                      <Ionicons name="checkmark" size={20} color="#7709e5" />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {activeTab === 'quality' && (
              <ScrollView style={styles.optionList}>
                {QUALITY_OPTIONS.map((quality) => (
                  <Pressable
                    key={quality}
                    style={[
                      styles.optionRow,
                      selectedQuality === quality && styles.activeOptionRow,
                    ]}
                    onPress={() => applyQuality(quality)}
                  >
                    <Text style={styles.optionText}>{quality}</Text>
                    {selectedQuality === quality && (
                      <Ionicons name="checkmark" size={20} color="#7709e5" />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {activeTab === 'subtitles' && (
              <ScrollView style={styles.optionList}>
                {SUBTITLE_OPTIONS.map((sub) => (
                  <Pressable
                    key={sub}
                    style={[
                      styles.optionRow,
                      selectedSubtitle === sub && styles.activeOptionRow,
                    ]}
                    onPress={() => applySubtitle(sub)}
                  >
                    <Text style={styles.optionText}>{sub}</Text>
                    {selectedSubtitle === sub && (
                      <Ionicons name="checkmark" size={20} color="#7709e5" />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
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
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  touchZone: {
    position: 'absolute',
    top: 50,
    bottom: 50,
    width: '40%',
    zIndex: 5,
  },
  feedbackOverlay: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 20,
  },
  feedbackText: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 4,
    fontSize: 13,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 25,
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginVertical: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#7709e5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
  },
  centerControls: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7709e5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  bottomBar: {
    width: '100%',
    paddingBottom: 4,
  },
  seekbarContainer: {
    height: 20,
    justifyContent: 'center',
    width: '100%',
  },
  seekbarTrack: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
  },
  seekbarBuffer: {
    position: 'absolute',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  seekbarProgress: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#7709e5',
  },
  bottomControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  settingsIconButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '75%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
    marginBottom: 8,
  },
  sheetBackBtn: {
    marginRight: 8,
  },
  sheetTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
  },
  menuList: {
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2c',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  menuItemSubText: {
    color: '#aaa',
    fontSize: 13,
  },
  optionList: {
    maxHeight: 200,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeOptionRow: {
    backgroundColor: 'rgba(119, 9, 229, 0.15)',
  },
  optionText: {
    color: '#eee',
    fontSize: 14,
    fontWeight: '500',
  },
});