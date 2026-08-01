import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { usePlayerState, PLAYER_STATES, PLAYER_ACTIONS } from '../hooks/usePlayerState';
import './Player.css';

// Test HLS Yayını (Big Buck Bunny HLS Akışı)
const TEST_HLS_STREAM = "https://test-streams.mux.dev/x36xhtml5/x36xhtml5.m3u8";

const Player = ({ streamUrl = TEST_HLS_STREAM, mediaTitle = "Test İçeriği", mediaId = "media-1", onClose }) => {
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const hlsRef = useRef(null);
  const hideControlsTimer = useRef(null);

  const { state, dispatch } = usePlayerState();
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Hover Önizleme
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverPos, setHoverPos] = useState(0);
  const [showHover, setShowHover] = useState(false);

  // Menü & UI Durumları
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // 1. HLS.js Entegrasyonu & Safari Fallback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    dispatch({ type: PLAYER_ACTIONS.SET_LOADING });

    // LocalStorage'dan son izleme pozisyonunu oku (İzlemeye Devam Et)
    const savedTime = localStorage.getItem(`player_pos_${mediaId}`);
    const initialSeekTime = savedTime ? parseFloat(savedTime) : 0;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        dispatch({ type: PLAYER_ACTIONS.SET_LEVELS, payload: data.levels });
        if (initialSeekTime > 0) {
          video.currentTime = initialSeekTime;
        }
      });

      // Ağ ve Medya Hatalarından Kurtarma (hls.recoverMediaError)
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("Ağ hatası oluştu, yayın yeniden başlatılıyor...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("Medya hatası oluştu, kurtarılıyor...");
              hls.recoverMediaError();
              break;
            default:
              dispatch({ type: PLAYER_ACTIONS.SET_ERROR, payload: "Yayın yüklenirken bir hata oluştu." });
              hls.destroy();
              break;
          }
        }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari Native HLS Fallback
      video.src = streamUrl;
      if (initialSeekTime > 0) {
        video.currentTime = initialSeekTime;
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [streamUrl, mediaId]);

  // 2. Video Event Observer & LocalStorage Pozisyon Kaydı
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);

      // LocalStorage Pozisyon Kaydı (İzlemeye Devam Et)
      if (video.currentTime > 5 && video.duration && (video.duration - video.currentTime > 10)) {
        localStorage.setItem(`player_pos_${mediaId}`, video.currentTime.toString());
      }

      // Buffer Durumu
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };

    const handlePlay = () => dispatch({ type: PLAYER_ACTIONS.SET_PLAYING });
    const handlePause = () => dispatch({ type: PLAYER_ACTIONS.SET_PAUSED });
    const handleWaiting = () => dispatch({ type: PLAYER_ACTIONS.SET_BUFFERING });
    const handlePlaying = () => dispatch({ type: PLAYER_ACTIONS.SET_PLAYING });

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [mediaId]);

  // 3. Hareketsizlik Takibi (Mouse 2.5sn hareket etmeyince kontroller gizlenir)
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (state.status === PLAYER_STATES.PLAYING) {
        setShowControls(false);
        setShowQualityMenu(false);
        setShowSpeedMenu(false);
      }
    }, 2500);
  };

  // 4. Klavye Kısayolları (Space, Ok Tuşları, F, M)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const video = videoRef.current;
      if (!video) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        video.currentTime = Math.min(video.currentTime + 10, duration);
      } else if (e.code === 'ArrowLeft') {
        video.currentTime = Math.max(video.currentTime - 10, 0);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration, state.status]);

  // Aksiyon Fonksiyonları
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * duration;
  };

  const handleSeekMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPos(pos * rect.width);
    setHoverTime(pos * duration);
    setShowHover(true);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const handleSpeedChange = (speed) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
  };

  const handleQualityChange = (levelIndex) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      dispatch({ type: PLAYER_ACTIONS.SET_CURRENT_LEVEL, payload: levelIndex });
    }
    setShowQualityMenu(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div 
      className={`custom-player-wrapper ${showControls ? '' : 'hide-cursor'}`}
      ref={playerContainerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element (Native Kontroller Kapalı) */}
      <video
        ref={videoRef}
        className="video-element"
        onClick={togglePlay}
        controls={false}
        autoPlay
      />

      {/* Buffering Spinner */}
      {(state.status === PLAYER_STATES.BUFFERING || state.status === PLAYER_STATES.LOADING) && (
        <div className="player-spinner-overlay">
          <div className="player-spinner"></div>
        </div>
      )}

      {/* Hata Ekranı */}
      {state.status === PLAYER_STATES.ERROR && (
        <div className="player-error-overlay">
          <p>{state.errorMessage}</p>
          <button onClick={() => window.location.reload()}>Yeniden Dene</button>
        </div>
      )}

      {/* Top Header Controls (Kapatma & Başlık) */}
      <div className={`player-header ${showControls ? 'visible' : ''}`}>
        <button className="back-btn" onClick={onClose}>← Kapat</button>
        <h3 className="media-title">{mediaTitle}</h3>
      </div>

      {/* Bottom Overlay Controls */}
      <div className={`player-controls-overlay ${showControls ? 'visible' : ''}`}>
        
        {/* Seekbar (Buffer & Hover Önizleme) */}
        <div 
          className="seekbar-container"
          onClick={handleSeek}
          onMouseMove={handleSeekMouseMove}
          onMouseLeave={() => setShowHover(false)}
        >
          {showHover && (
            <div className="seekbar-hover-tooltip" style={{ left: `${hoverPos}px` }}>
              {formatTime(hoverTime)}
            </div>
          )}
          <div className="seekbar-bg">
            <div className="seekbar-buffer" style={{ width: `${(buffered / duration) * 100}%` }}></div>
            <div className="seekbar-progress" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
          </div>
        </div>

        {/* Kontrol Butonları Satırı */}
        <div className="controls-row">
          <div className="controls-left">
            <button className="ctrl-btn play-btn" onClick={togglePlay}>
              {state.status === PLAYER_STATES.PLAYING ? '❚❚' : '▶'}
            </button>
            <button className="ctrl-btn" onClick={() => { if(videoRef.current) videoRef.current.currentTime -= 10; }}>-10s</button>
            <button className="ctrl-btn" onClick={() => { if(videoRef.current) videoRef.current.currentTime += 10; }}>+10s</button>
            
            {/* Volume Control */}
            <div className="volume-wrapper">
              <button className="ctrl-btn" onClick={toggleMute}>{isMuted ? '🔇' : '🔊'}</button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={isMuted ? 0 : volume} 
                onChange={handleVolumeChange} 
                className="volume-slider"
              />
            </div>

            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="controls-right">
            {/* Kalite Seçimi (hls.levels) */}
            {state.levels.length > 0 && (
              <div className="dropdown-popover">
                <button className="ctrl-btn" onClick={() => setShowQualityMenu(!showQualityMenu)}>
                  ⚙️ {state.currentLevel === -1 ? 'Otomatik' : `${state.levels[state.currentLevel]?.height}p`}
                </button>
                {showQualityMenu && (
                  <div className="menu-dropdown">
                    <button 
                      className={state.currentLevel === -1 ? 'active' : ''} 
                      onClick={() => handleQualityChange(-1)}
                    >
                      Otomatik (ABR)
                    </button>
                    {state.levels.map((lvl, index) => (
                      <button 
                        key={index} 
                        className={state.currentLevel === index ? 'active' : ''}
                        onClick={() => handleQualityChange(index)}
                      >
                        {lvl.height}p ({Math.round(lvl.bitrate / 1000)}k)
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Oynatma Hızı */}
            <div className="dropdown-popover">
              <button className="ctrl-btn" onClick={() => setShowSpeedMenu(!showSpeedMenu)}>
                {playbackRate}x
              </button>
              {showSpeedMenu && (
                <div className="menu-dropdown">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <button 
                      key={speed} 
                      className={playbackRate === speed ? 'active' : ''}
                      onClick={() => handleSpeedChange(speed)}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button className="ctrl-btn" onClick={toggleFullscreen}>
              {isFullscreen ? '🗗' : '⛶'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Player;