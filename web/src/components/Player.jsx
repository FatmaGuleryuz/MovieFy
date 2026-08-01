import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { usePlayerState } from '../hooks/usePlayerState';

const TEST_STREAM = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

const Player = ({ src = TEST_STREAM, movieId = "demo-movie" }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const hideControlsTimeout = useRef(null);

  const [state, dispatch] = usePlayerState();
  const [showControls, setShowControls] = useState(true);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPos, setHoverPos] = useState(0);

  // 1. HLS Entegrasyonu & Error Recovery (Observer & State Machine)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        dispatch({ type: 'SET_STATUS', payload: 'paused' });
        const levels = data.levels.map((level, index) => ({
          id: index,
          height: level.height,
          name: `${level.height}p`,
        }));
        dispatch({ type: 'SET_QUALITIES', payload: levels });

        // --- İZLEMEYE DEVAM ET (KALAN SÜREYİ BURADA VERİYORUZ) ---
        const savedData = localStorage.getItem(`continue_watch_${movieId}`);
        if (savedData) {
          try {
            const { progress } = JSON.parse(savedData);
            if (progress && progress > 0) {
              video.currentTime = progress;
            }
          } catch (e) {
            console.error("Kayıtlı süre okunamadı", e);
          }
        }
        // ---------------------------------------------------------
      });

      // Hata Yönetimi & Dayanıklılık (hls.recoverMediaError)
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              dispatch({ type: 'SET_ERROR', payload: "Yayın yüklenirken bir hata oluştu." });
              hls.destroy();
              break;
          }
        }
      });

      return () => hls.destroy();
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      // Apple cihazlar için yerel HLS desteği (kaldığı yerden başlatma)
      video.addEventListener('loadedmetadata', () => {
        const savedData = localStorage.getItem(`continue_watch_${movieId}`);
        if (savedData) {
          try {
            const { progress } = JSON.parse(savedData);
            if (progress && progress > 0) {
              video.currentTime = progress;
            }
          } catch (e) {}
        }
      });
    }
  }, [src, movieId]);

  // 2. İzlemeye Devam Et (Süreyi Kaydetme)
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    dispatch({
      type: 'SET_TIME',
      payload: { currentTime: video.currentTime, duration: video.duration }
    });

    if (video.buffered.length > 0) {
      dispatch({ 
        type: 'SET_BUFFERED', 
        payload: video.buffered.end(video.buffered.length - 1) 
      });
    }

    // Video bitimine 5 saniye kala kaydı sil, yoksa kaydetmeye devam et
    if (video.duration && (video.duration - video.currentTime < 5)) {
        localStorage.removeItem(`continue_watch_${movieId}`);
    } else if (video.currentTime > 3) {
      localStorage.setItem(`continue_watch_${movieId}`, JSON.stringify({
        movieId,
        progress: video.currentTime,
        duration: video.duration,
        updatedAt: Date.now()
      }));
    }
  };

  // 3. Klavye Kısayolları (Space, Ok Tuşları, F, M)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const video = videoRef.current;
      if (!video) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.currentTime + 10, video.duration);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(video.currentTime - 10, 0);
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.status, state.isMuted]);

  // Kontrol Eylemleri
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      dispatch({ type: 'SET_STATUS', payload: 'playing' });
    } else {
      video.pause();
      dispatch({ type: 'SET_STATUS', payload: 'paused' });
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    dispatch({ type: 'TOGGLE_MUTE' });
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    dispatch({ type: 'SET_VOLUME', payload: val });
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const seekTime = parseFloat(e.target.value);
    video.currentTime = seekTime;
    dispatch({ type: 'SET_TIME', payload: { currentTime: seekTime } });
  };

  const handleSpeedChange = (speed) => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
    dispatch({ type: 'SET_SPEED', payload: speed });
  };

  const handleQualityChange = (levelIndex) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      dispatch({ type: 'SET_CURRENT_QUALITY', payload: levelIndex });
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Harekesizlikte Kontrolleri Gizleme
  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(hideControlsTimeout.current);
    hideControlsTimeout.current = setTimeout(() => {
      if (state.status === 'playing') setShowControls(false);
    }, 3500);
  };

  // Hover Zaman Önizleme (SeekBar)
  const handleSeekBarMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    setHoverPos(e.clientX - rect.left);
    setHoverTime(pos * state.duration);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{ 
        position: 'relative', width: '100%', height: '100%', 
        backgroundColor: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center' 
      }}
    >
      {/* Yükleniyor Göstergesi */}
      {state.status === 'buffering' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ width: '50px', height: '50px', border: '4px solid transparent', borderTopColor: '#9333ea', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      )}

      {/* VİDEO (objectFit: contain ile orantıyı korur, taşmaz) */}
      <video
        ref={videoRef}
        style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => dispatch({ type: 'SET_STATUS', payload: 'buffering' })}
        onPlaying={() => dispatch({ type: 'SET_STATUS', payload: 'playing' })}
        onPause={() => dispatch({ type: 'SET_STATUS', payload: 'paused' })}
        onClick={togglePlay}
      />

      {/* MODERN KONTROL PANELİ (Tek satır, yatay hizalı) */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
          padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px',
          opacity: showControls ? 1 : 0, transition: 'opacity 0.3s ease', zIndex: 20
        }}
      >
        {/* İlerleme Çubuğu (Seekbar) */}
        <input
          type="range"
          min={0}
          max={state.duration || 100}
          value={state.currentTime}
          onChange={handleSeek}
          style={{ width: '100%', height: '4px', cursor: 'pointer', accentColor: '#9333ea' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', marginTop: '5px' }}>
          
          {/* Sol Kısım: Play, Ses, Süre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>
              {state.status === 'playing' ? '❚❚' : '▶'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>
                {state.isMuted || state.volume === 0 ? '🔇' : '🔊'}
              </button>
              <input
                type="range" min={0} max={1} step={0.05}
                value={state.isMuted ? 0 : state.volume}
                onChange={handleVolumeChange}
                style={{ width: '80px', accentColor: '#9333ea', cursor: 'pointer' }}
              />
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#ccc' }}>
              {formatTime(state.currentTime)} / {formatTime(state.duration)}
            </span>
          </div>

          {/* Sağ Kısım: Hız, Kalite, Tam Ekran */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <select
              value={state.playbackRate}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
            >
              {[0.5, 1, 1.25, 1.5, 2].map((r) => <option key={r} value={r} style={{ color: 'black' }}>{r}x</option>)}
            </select>

            {state.qualities.length > 0 && (
              <select
                value={state.currentQuality}
                onChange={(e) => handleQualityChange(parseInt(e.target.value))}
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
              >
                <option value={-1} style={{ color: 'black' }}>Auto</option>
                {state.qualities.map((q) => <option key={q.id} value={q.id} style={{ color: 'black' }}>{q.name}</option>)}
              </select>
            )}

            <button onClick={toggleFullscreen} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>
              ⛶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;