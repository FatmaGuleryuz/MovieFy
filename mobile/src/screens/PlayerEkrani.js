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
import Slider from '@react-native-community/slider';

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
  const contentId = route.params?.id || 'default_video';
  const isFocused = useIsFocused();

  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);

  // Hata Yakalama
  const [hasError, setHasError] = useState(false);

  // Sürükleme (Sliding) Durumu ve Anlık Süre Baloncuğu
  const [isSliding, setIsSliding] = useState(false);
  const [slidingTime, setSlidingTime] = useState(0);

  // Modal Durumları
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [selectedQuality, setSelectedQuality] = useState('Otomatik (ABR)');
  const [selectedSubtitle, setSelectedSubtitle] = useState('Kapalı');

  const [seekSide, setSeekSide] = useState(null);

  const controlsTimeoutRef = useRef(null);
  const seekTimeoutRef = useRef(null);
  const lastTapRef = useRef({ time: 0, side: null });
  const isPositionRestored = useRef(false);

  // expo-video Player Hook
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.play();
  });

  // KeepAwake ve Immersive Mode
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

  // AsyncStorage Kaldığı Yeri Yükleme
  useEffect(() => {
    const restoreSavedPosition = async () => {
      try {
        const savedPosition = await AsyncStorage.getItem(`watch_progress_${contentId}`);
        if (savedPosition && player && !isPositionRestored.current) {
          const parsedTime = parseFloat(savedPosition);
          if (parsedTime > 5) {
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

  // Anlık İlerleme Kaydı
  useEffect(() => {
    if (!player || currentTime <= 0) return;

    const saveProgress = async () => {
      try {
        await AsyncStorage.setItem(`watch_progress_${contentId}`, currentTime.toString());
      } catch (e) {
        console.error('İlerleme kaydedilemedi:', e);
      }
    };

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

  // Periyodik Takip
  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      try {
        if (!isSliding && player.currentTime !== undefined) {
          setCurrentTime(player.currentTime || 0);
        }
        if (player.duration !== undefined && player.duration > 0) {
          setDuration(player.duration);
        }
        if (player.bufferedPosition !== undefined) {
          setBuffered(player.bufferedPosition || 0);
        }
        setIsPlaying(player.playing);
        
        if (player.playing && hasError) setHasError(false);
      } catch (e) {
        setHasError(true);
      }
    }, 400);
    return () => clearInterval(interval);
  }, [player, hasError, isSliding]);

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (player && player.playing && !showSettingsModal && !isSliding) {
        setShowControls(false);
      }
    }, 4000);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => clearTimeout(controlsTimeoutRef.current);
  }, []);

  // SLIDER SÜRÜKLEME ETKİLEŞİMLERİ
  const handleSlidingStart = () => {
    setIsSliding(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  };

  const handleSlidingValueChange = (value) => {
    setSlidingTime(value);
  };

  const handleSlidingComplete = (value) => {
    if (player) {
      player.currentTime = value;
      setCurrentTime(value);
    }
    setIsSliding(false);
    resetControlsTimeout();
  };

  // Çift Tıklama Sarma
  const handleTouchArea = (side) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (
      lastTapRef.current.side === side &&
      now - lastTapRef.current.time < DOUBLE_TAP_DELAY
    ) {
      if (player) {
        if (side === 'left') {
          player.currentTime = Math.max(0, player.currentTime - 10);
        } else if (side === 'right') {
          player.currentTime = Math.min(duration, player.currentTime + 10);
        }
      }

      setSeekSide(side);
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
      seekTimeoutRef.current = setTimeout(() => setSeekSide(null), 700);

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

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar hidden />
      <View style={styles.videoContainer}>
        <VideoView style={styles.video} player={player} nativeControls={false} />

        {/* DOKUNMA ALANLARI */}
        <Pressable
          style={[styles.touchZone, { left: 0 }]}
          onPress={() => handleTouchArea('left')}
        >
          {seekSide === 'left' && (
            <View style={styles.seekSideWrapper}>
              <Text style={styles.seekSideText}>{"<     -10"}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={[styles.touchZone, { right: 0 }]}
          onPress={() => handleTouchArea('right')}
        >
          {seekSide === 'right' && (
            <View style={styles.seekSideWrapper}>
              <Text style={styles.seekSideText}>{" +10     > "}</Text>
            </View>
          )}
        </Pressable>

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

        {/* KONTROL OVERLAY */}
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
              {isSliding && (
                <View style={styles.timeBadgeOverlay}>
                  <View style={styles.timeBadge}>
                    <Ionicons name="time-outline" size={16} color="#7709e5" style={{ marginRight: 6 }} />
                    <Text style={styles.timeBadgeText}>{formatTime(slidingTime)}</Text>
                  </View>
                </View>
              )}

              {/* SLIDER */}
              <View style={styles.sliderContainer}>
                {Slider ? (
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={duration > 0 ? duration : 1}
                    value={isSliding ? slidingTime : currentTime}
                    minimumTrackTintColor="#7709e5"
                    maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                    thumbTintColor="#7709e5"
                    onSlidingStart={handleSlidingStart}
                    onValueChange={handleSlidingValueChange}
                    onSlidingComplete={handleSlidingComplete}
                  />
                ) : (
                  <View style={styles.customProgressBarBackground}>
                    <View 
                      style={[
                        styles.customProgressBarFill, 
                        { width: `${(currentTime / (duration || 1)) * 100}%` }
                      ]} 
                    />
                  </View>
                )}
              </View>

              <View style={styles.bottomControlsRow}>
                <Text style={styles.timeText}>
                  {formatTime(isSliding ? slidingTime : currentTime)} / {formatTime(duration)}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekSideWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekSideText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
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
  timeBadgeOverlay: {
    alignItems: 'center',
    marginBottom: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 14, 14, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#7709e5',
  },
  timeBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sliderContainer: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  customProgressBarBackground: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  customProgressBarFill: {
    height: '100%',
    backgroundColor: '#7709e5',
  },
  bottomControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
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