import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Layers,
  ChevronDown,
  Settings2
} from 'lucide-react';
import { formatTime } from '../utils/helpers';

export default function CustomVideoPlayer({
  m3u8,
  embed,
  title = 'Trình phát video',
  poster,
  initialTime = 0,
  onTimeUpdate,
  onEnded,
  autoPlay = true
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const lastReportedTimeRef = useRef(0);
  const seekAppliedRef = useRef(false);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('player_volume');
    return saved !== null ? parseFloat(saved) : 1;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [quickActionNotice, setQuickActionNotice] = useState(null);
  const quickActionTimerRef = useRef(null);

  // Fallback mode state
  const [mode, setMode] = useState(m3u8 ? 'hls' : 'iframe');

  // Qualities list from HLS
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);

  // Timeline hover state
  const [hoverPosition, setHoverPosition] = useState(null);
  const [hoverTime, setHoverTime] = useState(0);

  // Sync mode when m3u8 prop changes
  useEffect(() => {
    if (m3u8) {
      setMode('hls');
    } else {
      setMode('iframe');
    }
    seekAppliedRef.current = false;
  }, [m3u8]);

  // Flash quick action badge in center (e.g. "+10s", "Tạm dừng")
  const triggerActionNotice = useCallback((text, iconType = 'info') => {
    if (quickActionTimerRef.current) clearTimeout(quickActionTimerRef.current);
    setQuickActionNotice({ text, iconType });
    quickActionTimerRef.current = setTimeout(() => {
      setQuickActionNotice(null);
    }, 700);
  }, []);

  // Initialize Hls.js
  useEffect(() => {
    if (mode !== 'hls' || !m3u8 || !videoRef.current) return;

    const video = videoRef.current;
    let hlsInstance = null;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setIsBuffering(true);

    if (Hls.isSupported()) {
      hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600
      });

      hlsRef.current = hlsInstance;
      hlsInstance.loadSource(m3u8);
      hlsInstance.attachMedia(video);

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsBuffering(false);
        if (data.levels && data.levels.length > 0) {
          const list = data.levels.map((lvl, index) => ({
            index,
            height: lvl.height,
            bitrate: lvl.bitrate,
            label: lvl.height ? `${lvl.height}p` : `Level ${index + 1}`
          }));
          setQualities(list);
        }

        // Apply initial resume time if available
        if (initialTime > 0 && !seekAppliedRef.current) {
          video.currentTime = initialTime;
          seekAppliedRef.current = true;
          triggerActionNotice(`Tiếp tục từ ${formatTime(initialTime)}`, 'play');
        }

        if (autoPlay) {
          video.play().then(() => setIsPlaying(true)).catch(() => {
            // Browser autoplay restrictions
            setIsPlaying(false);
          });
        }
      });

      hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('HLS Network error, attempting recovery...', data);
              hlsInstance.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('HLS Media error, attempting recovery...', data);
              hlsInstance.recoverMediaError();
              break;
            default:
              console.error('HLS Fatal error, fallback to iframe...', data);
              hlsInstance.destroy();
              if (embed) setMode('iframe');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple HLS (Safari on iOS & macOS)
      video.src = m3u8;
      video.addEventListener('loadedmetadata', () => {
        setIsBuffering(false);
        if (initialTime > 0 && !seekAppliedRef.current) {
          video.currentTime = initialTime;
          seekAppliedRef.current = true;
        }
        if (autoPlay) {
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
      });
    } else {
      // Browser doesn't support HLS at all -> fallback to iframe
      if (embed) setMode('iframe');
    }

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsRef.current = null;
      }
    };
  }, [m3u8, mode]);

  // Handle Seek when initialTime changes externally
  useEffect(() => {
    if (initialTime > 0 && videoRef.current && mode === 'hls') {
      videoRef.current.currentTime = initialTime;
      seekAppliedRef.current = true;
      triggerActionNotice(`Đã chuyển tới ${formatTime(initialTime)}`, 'play');
    }
  }, [initialTime, mode]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Controls auto-hide timer
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setIsQualityOpen(false);
        setIsSpeedOpen(false);
      }, 2600);
    }
  }, [isPlaying]);

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      video.play().then(() => {
        setIsPlaying(true);
        triggerActionNotice('Phát', 'play');
      }).catch((err) => console.error(err));
    } else {
      video.pause();
      setIsPlaying(false);
      triggerActionNotice('Tạm dừng', 'pause');
    }
    resetControlsTimeout();
  }, [resetControlsTimeout, triggerActionNotice]);

  // Seek relative
  const seekRelative = useCallback((seconds) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    video.currentTime = newTime;
    setCurrentTime(newTime);
    triggerActionNotice(`${seconds > 0 ? '+' : ''}${seconds}s`, seconds > 0 ? 'forward' : 'rewind');
    resetControlsTimeout();
  }, [resetControlsTimeout, triggerActionNotice]);

  // Volume change
  const handleVolumeChange = useCallback((newVol) => {
    const video = videoRef.current;
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    localStorage.setItem('player_volume', clamped.toString());

    if (video) {
      video.volume = clamped;
      if (clamped === 0) {
        video.muted = true;
        setIsMuted(true);
      } else if (isMuted) {
        video.muted = false;
        setIsMuted(false);
      }
    }
  }, [isMuted]);

  // Mute toggle
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.muted || volume === 0) {
      const restoreVol = volume > 0 ? volume : 0.8;
      video.muted = false;
      video.volume = restoreVol;
      setIsMuted(false);
      setVolume(restoreVol);
      triggerActionNotice(`Âm lượng ${Math.round(restoreVol * 100)}%`, 'volume');
    } else {
      video.muted = true;
      setIsMuted(true);
      triggerActionNotice('Đã tắt tiếng', 'volume');
    }
    resetControlsTimeout();
  }, [volume, resetControlsTimeout, triggerActionNotice]);

  // Speed change
  const handleSpeedChange = useCallback((speed) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setIsSpeedOpen(false);
    triggerActionNotice(`Tốc độ: ${speed}x`, 'info');
    resetControlsTimeout();
  }, [resetControlsTimeout, triggerActionNotice]);

  // Quality switch (HLS)
  const handleQualityChange = useCallback((levelIndex) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = levelIndex;
    setCurrentQuality(levelIndex);
    setIsQualityOpen(false);
    const label = levelIndex === -1 ? 'Tự động' : `${qualities[levelIndex]?.height || ''}p`;
    triggerActionNotice(`Chất lượng: ${label}`, 'info');
    resetControlsTimeout();
  }, [qualities, resetControlsTimeout, triggerActionNotice]);

  // Toggle Fullscreen
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
    resetControlsTimeout();
  }, [isFullscreen, resetControlsTimeout]);

  // Picture in picture
  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP error:', e);
    }
  }, []);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) {
        return;
      }

      if (mode !== 'hls') return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
        case 'j':
        case 'J':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'ArrowRight':
        case 'l':
        case 'L':
          e.preventDefault();
          seekRelative(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          triggerActionNotice(`Âm lượng ${Math.round(Math.min(1, volume + 0.1) * 100)}%`, 'volume');
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          triggerActionNotice(`Âm lượng ${Math.round(Math.max(0, volume - 0.1) * 100)}%`, 'volume');
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, togglePlay, seekRelative, handleVolumeChange, volume, toggleMute, toggleFullscreen, triggerActionNotice]);

  // Video element events
  const onVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const current = video.currentTime;
    setCurrentTime(current);

    // Calculate buffer
    if (video.buffered.length > 0) {
      for (let i = 0; i < video.buffered.length; i++) {
        if (video.buffered.start(i) <= current && current <= video.buffered.end(i)) {
          setBufferedEnd(video.buffered.end(i));
          break;
        }
      }
    }

    // Throttle calling onTimeUpdate to once every ~4 seconds
    if (Math.abs(current - lastReportedTimeRef.current) >= 4) {
      lastReportedTimeRef.current = current;
      if (onTimeUpdate) {
        onTimeUpdate(Math.floor(current), Math.floor(video.duration || 0));
      }
    }
  };

  const onVideoLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration || 0);
    video.volume = volume;
    video.muted = isMuted;
    setIsBuffering(false);
  };

  // Timeline scrubber click / drag
  const handleTimelineClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pos * duration;

    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
    resetControlsTimeout();
  };

  const handleTimelineMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(pos * 100);
    setHoverTime(pos * duration);
  };

  const handleTimelineMouseLeave = () => {
    setHoverPosition(null);
  };

  // Switch between Native HLS and iframe
  const togglePlayerMode = () => {
    if (mode === 'hls') {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      setMode('iframe');
    } else {
      if (m3u8) {
        setMode('hls');
      }
    }
  };

  // IFRAME FALLBACK VIEW
  if (mode === 'iframe') {
    return (
      <div className="relative w-full h-full bg-black group flex flex-col justify-center">
        {embed ? (
          <iframe
            src={embed}
            title={title}
            allowFullScreen={true}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full border-0"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400">
            <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
            <p className="text-sm">Không tìm thấy nguồn phát trực tiếp hoặc embed cho tập này.</p>
          </div>
        )}

        {/* Floating switch button to revert to HLS if available */}
        {m3u8 && (
          <div className="absolute top-3 right-3 z-20">
            <button
              type="button"
              onClick={togglePlayerMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black text-white text-xs font-semibold backdrop-blur-md border border-brand-red/40 hover:border-brand-red transition shadow-lg"
              title="Chuyển sang Native HLS Player tốc độ cao không quảng cáo"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-gold fill-brand-gold animate-spin" />
              <span>Dùng Player VIP HLS (1080p)</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // NATIVE HLS CUSTOM PLAYER VIEW
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-black select-none overflow-hidden group cursor-default font-sans ${
        !showControls && isPlaying ? 'cursor-none' : ''
      }`}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => {
        if (isPlaying) setShowControls(false);
      }}
      onClick={resetControlsTimeout}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        poster={poster}
        playsInline
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onTimeUpdate={onVideoTimeUpdate}
        onLoadedMetadata={onVideoLoadedMetadata}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
      />

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-black/30 backdrop-blur-[2px] z-10 transition-opacity">
          <div className="w-14 h-14 rounded-full border-4 border-white/20 border-t-brand-red animate-spin" />
          <span className="mt-3 text-xs font-semibold text-white/90 tracking-wide uppercase">
            Đang tải 1080p FHD...
          </span>
        </div>
      )}

      {/* Quick Action Flash Badge in Center */}
      {quickActionNotice && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <div className="px-5 py-2.5 rounded-2xl bg-black/80 backdrop-blur-md border border-white/15 text-white font-bold text-sm shadow-2xl flex items-center gap-2 animate-scale-in">
            {quickActionNotice.iconType === 'forward' && <RotateCw className="w-5 h-5 text-brand-red" />}
            {quickActionNotice.iconType === 'rewind' && <RotateCcw className="w-5 h-5 text-brand-red" />}
            {quickActionNotice.iconType === 'play' && <Play className="w-5 h-5 text-emerald-400 fill-emerald-400" />}
            {quickActionNotice.iconType === 'pause' && <Pause className="w-5 h-5 text-amber-400 fill-amber-400" />}
            {quickActionNotice.iconType === 'volume' && <Volume2 className="w-5 h-5 text-cyan-400" />}
            <span>{quickActionNotice.text}</span>
          </div>
        </div>
      )}

      {/* Big Center Play/Pause button overlay on paused / initial */}
      {!isPlaying && !isBuffering && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer bg-black/20"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-brand-red/90 hover:bg-brand-red text-white flex items-center justify-center shadow-2xl transition transform hover:scale-110 active:scale-95">
            <Play className="w-9 h-9 fill-current ml-1" />
          </div>
        </div>
      )}

      {/* Top Header Overlay (Video title & Player mode switcher) */}
      <div
        className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 flex items-center justify-between gap-3 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold tracking-wider">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            HLS NATIVE 1080P
          </span>
          <h3 className="text-white text-sm sm:text-base font-semibold truncate drop-shadow">
            {title}
          </h3>
        </div>

        {/* Switcher button */}
        {embed && (
          <button
            type="button"
            onClick={togglePlayerMode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-medium border border-white/10 backdrop-blur-md transition flex-shrink-0"
            title="Chuyển sang trình phát nhúng iFrame nếu video này gặp sự cố"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">Dự phòng iFrame</span>
          </button>
        )}
      </div>

      {/* Bottom Controls Bar Overlay */}
      <div
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-3 sm:px-5 pb-3 sm:pb-4 pt-8 z-20 flex flex-col gap-2 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Timeline Scrubbing Bar */}
        <div
          className="relative w-full h-3 group/timeline cursor-pointer flex items-center"
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={handleTimelineMouseLeave}
        >
          {/* Background rail */}
          <div className="w-full h-1 group-hover/timeline:h-2 bg-white/20 rounded-full overflow-hidden relative transition-all duration-150">
            {/* Buffered progress */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-white/30 rounded-full transition-all duration-200"
              style={{ width: `${bufferPercent}%` }}
            />
            {/* Played progress */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-red-600 via-brand-red to-rose-400 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Scrubber thumb handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg scale-0 group-hover/timeline:scale-100 transition-transform duration-150 pointer-events-none"
            style={{ left: `${progressPercent}%` }}
          />

          {/* Time Preview Tooltip on Hover */}
          {hoverPosition !== null && (
            <div
              className="absolute -top-8 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 text-white text-[11px] font-bold border border-white/20 pointer-events-none shadow-md"
              style={{ left: `${hoverPosition}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 text-white text-xs sm:text-sm pt-1">
          {/* Left Group: Play/Pause, Rewind, Forward, Volume, Time */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-white/15 transition text-white"
              title={isPlaying ? 'Tạm dừng (Space)' : 'Phát (Space)'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
            </button>

            {/* Rewind 10s (Desktop) */}
            <button
              type="button"
              onClick={() => seekRelative(-10)}
              className="hidden sm:inline-flex p-1.5 sm:p-2 rounded-lg hover:bg-white/15 transition text-gray-200 hover:text-white"
              title="Tua lùi 10s (← hoặc J)"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Forward 10s (Desktop) */}
            <button
              type="button"
              onClick={() => seekRelative(10)}
              className="hidden sm:inline-flex p-1.5 sm:p-2 rounded-lg hover:bg-white/15 transition text-gray-200 hover:text-white"
              title="Tua tới 10s (→ hoặc L)"
            >
              <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Volume control with hover slider (Desktop) */}
            <div className="hidden sm:flex items-center group/volume relative">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white/15 transition text-gray-200 hover:text-white"
                title={isMuted ? 'Bật âm thanh (M)' : 'Tắt tiếng (M)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              <div className="w-0 group-hover/volume:w-16 sm:group-hover/volume:w-20 overflow-hidden transition-all duration-200 flex items-center pl-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-brand-red"
                  title="Âm lượng"
                />
              </div>
            </div>

            {/* Time display */}
            <div className="text-[10px] sm:text-xs text-gray-300 font-mono ml-0.5 sm:ml-1 whitespace-nowrap">
              <span>{formatTime(currentTime)}</span>
              <span className="text-gray-500 mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Group: Quality, Speed, PiP, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile Settings Button (Quality & Speed) */}
            <div className="relative sm:hidden">
              <button
                type="button"
                onClick={() => setIsMobileSettingsOpen(!isMobileSettingsOpen)}
                className="p-1.5 rounded-lg hover:bg-white/15 transition text-gray-200 hover:text-white"
                title="Cài đặt phát"
              >
                <Settings2 className="w-4 h-4" />
              </button>

              {isMobileSettingsOpen && (
                <div className="absolute bottom-full right-0 mb-2 py-2 w-48 bg-dark-card/95 border border-dark-border rounded-xl shadow-2xl backdrop-blur-md z-30 animate-fade-in text-xs">
                  <div className="px-3 py-1 font-bold text-gray-400 border-b border-white/10 text-[10px] uppercase">
                    Cài đặt video
                  </div>
                  <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-gray-400">Tốc độ:</div>
                  <div className="grid grid-cols-3 gap-1 px-2 pb-2 border-b border-white/10">
                    {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          handleSpeedChange(s);
                          setIsMobileSettingsOpen(false);
                        }}
                        className={`py-1 rounded text-center text-xs ${
                          playbackSpeed === s ? 'bg-brand-red text-white font-bold' : 'bg-white/5 text-gray-300'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                  {qualities.length > 0 && (
                    <>
                      <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-gray-400">Độ phân giải:</div>
                      <div className="px-2 space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            handleQualityChange(-1);
                            setIsMobileSettingsOpen(false);
                          }}
                          className={`w-full py-1 px-2 rounded text-left text-xs ${
                            currentQuality === -1 ? 'bg-brand-red text-white font-bold' : 'hover:bg-white/10 text-gray-300'
                          }`}
                        >
                          Tự động (FHD)
                        </button>
                        {qualities.map((q) => (
                          <button
                            key={q.index}
                            type="button"
                            onClick={() => {
                              handleQualityChange(q.index);
                              setIsMobileSettingsOpen(false);
                            }}
                            className={`w-full py-1 px-2 rounded text-left text-xs ${
                              currentQuality === q.index ? 'bg-brand-red text-white font-bold' : 'hover:bg-white/10 text-gray-300'
                            }`}
                          >
                            {q.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Quality selector dropdown (Desktop) */}
            {qualities.length > 0 && (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => {
                    setIsQualityOpen(!isQualityOpen);
                    setIsSpeedOpen(false);
                  }}
                  className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs font-semibold text-gray-200 hover:text-white flex items-center gap-1 transition"
                  title="Chất lượng video"
                >
                  <Layers className="w-3.5 h-3.5 text-brand-red" />
                  <span>
                    {currentQuality === -1 ? 'Auto' : `${qualities[currentQuality]?.height}p`}
                  </span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {isQualityOpen && (
                  <div className="absolute bottom-full right-0 mb-2 py-1 w-28 bg-dark-card/95 border border-dark-border rounded-xl shadow-2xl backdrop-blur-md z-30 animate-fade-in text-xs">
                    <div className="px-3 py-1 font-bold text-gray-400 border-b border-white/10 text-[10px] uppercase">
                      Độ phân giải
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQualityChange(-1)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-white/10 transition flex items-center justify-between ${
                        currentQuality === -1 ? 'text-brand-red font-bold' : 'text-gray-300'
                      }`}
                    >
                      <span>Tự động (FHD)</span>
                      {currentQuality === -1 && <span className="w-1.5 h-1.5 rounded-full bg-brand-red" />}
                    </button>
                    {qualities.map((q) => (
                      <button
                        key={q.index}
                        type="button"
                        onClick={() => handleQualityChange(q.index)}
                        className={`w-full text-left px-3 py-1.5 hover:bg-white/10 transition flex items-center justify-between ${
                          currentQuality === q.index ? 'text-brand-red font-bold' : 'text-gray-300'
                        }`}
                      >
                        <span>{q.label}</span>
                        {currentQuality === q.index && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-red" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Playback speed selector (Desktop) */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => {
                  setIsSpeedOpen(!isSpeedOpen);
                  setIsQualityOpen(false);
                }}
                className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs font-semibold text-gray-200 hover:text-white flex items-center gap-1 transition"
                title="Tốc độ phát video"
              >
                <span>{playbackSpeed === 1 ? '1x' : `${playbackSpeed}x`}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {isSpeedOpen && (
                <div className="absolute bottom-full right-0 mb-2 py-1 w-28 bg-dark-card/95 border border-dark-border rounded-xl shadow-2xl backdrop-blur-md z-30 animate-fade-in text-xs">
                  <div className="px-3 py-1 font-bold text-gray-400 border-b border-white/10 text-[10px] uppercase">
                    Tốc độ phát
                  </div>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSpeedChange(s)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-white/10 transition flex items-center justify-between ${
                        playbackSpeed === s ? 'text-brand-red font-bold' : 'text-gray-300'
                      }`}
                    >
                      <span>{s === 1 ? '1x (Chuẩn)' : `${s}x`}</span>
                      {playbackSpeed === s && <span className="w-1.5 h-1.5 rounded-full bg-brand-red" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture-in-Picture */}
            {document.pictureInPictureEnabled && (
              <button
                type="button"
                onClick={togglePiP}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white/15 transition text-gray-200 hover:text-white hidden sm:inline-flex"
                title="Thu nhỏ xem góc màn hình (PiP)"
              >
                <PictureInPicture2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-white/15 transition text-gray-200 hover:text-white"
              title={isFullscreen ? 'Thu nhỏ màn hình (F)' : 'Toàn màn hình (F)'}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
