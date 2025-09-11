import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VideoPlayerProps, VideoPlayerState, SubtitleCue, ParsedSubtitles } from './types';
import { parseSubtitles, getCurrentSubtitle } from './utils/subtitleParser';
import { formatTime } from './utils/formatTime';
import { loadVideo, VideoLoaderResult } from './utils/videoLoader';
import { getTranslation } from './locales';
import { useCustomTheme } from './hooks/useCustomTheme';
import './VideoPlayer.css';

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  width = '100%',
  height = 'auto',
  autoPlay = false,
  controls = true,
  loop = false,
  muted = false,
  preload = 'metadata',
  subtitles = [],
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onLoadedMetadata,
  className,
  style,
  language = 'en',
  theme = 'dark',
  customTheme,
  rounded,
  ambient = false,
  ambientIntensity = 0.35,
  ambientBlur = 60
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: muted,
    isFullscreen: false,
    showControls: true,
    selectedSubtitle: subtitles.findIndex(sub => sub.default) || (subtitles.length > 0 ? 0 : null),
    buffered: null,
    playbackRate: 1,
    availableQualities: [],
    selectedQuality: 'auto',
    isLoading: true,
    error: null,
    isMiniPlayer: false,
    showSettings: false
  });

  const [parsedSubtitles, setParsedSubtitles] = useState<ParsedSubtitles>({});
  const [hideControlsTimeout, setHideControlsTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [videoLoader, setVideoLoader] = useState<VideoLoaderResult | null>(null);

  const t = getTranslation(language);

  // Apply theme variables to the container
  useCustomTheme(theme, customTheme, containerRef as unknown as React.RefObject<HTMLElement>);

  // Initialize video source with advanced format support
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Reset states when source changes
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null 
    }));

    // Pause video before changing source to prevent play() interruption
    if (!video.paused) {
      video.pause();
    }

    // Cleanup previous video loader
    if (videoLoader?.cleanup) {
      videoLoader.cleanup();
    }

    // Small delay to ensure previous operations complete
    const timeoutId = setTimeout(() => {
      loadVideo(video, src).then(newLoader => {
        setVideoLoader(newLoader);
      }).catch(error => {
        console.error('Error loading video:', error);
        setState(prev => ({ ...prev, error: error as Error, isLoading: false }));
        // Fallback to native video element
        video.src = src;
      });
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      if (videoLoader?.cleanup) {
        videoLoader.cleanup();
      }
    };
  }, [src]); // Remove videoLoader dependency to prevent loops

  // Initialize subtitles
  useEffect(() => {
    const loadSubtitles = async () => {
      const newParsedSubtitles: ParsedSubtitles = {};
      
      for (let i = 0; i < subtitles.length; i++) {
        const subtitle = subtitles[i];
        const cues = await parseSubtitles(subtitle.src);
        newParsedSubtitles[i] = cues;
      }
      
      setParsedSubtitles(newParsedSubtitles);
    };

    if (subtitles.length > 0) {
      loadSubtitles();
    }
  }, [subtitles]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => setState(prev => ({ ...prev, isLoading: true }));
    const handleCanPlay = () => setState(prev => ({ ...prev, isLoading: false }));
    
    const handleLoadedMetadata = () => {
      setState(prev => ({ ...prev, duration: video.duration, isLoading: false }));
      onLoadedMetadata?.(video.duration);
    };

    const handleTimeUpdate = () => {
      setState(prev => ({ 
        ...prev, 
        currentTime: video.currentTime,
        buffered: video.buffered
      }));
      onTimeUpdate?.(video.currentTime);
    };

    const handlePlay = () => {
      setState(prev => ({ ...prev, isPlaying: true }));
      onPlay?.();
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
      onPause?.();
    };

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
      onEnded?.();
    };

    const handleVolumeChange = () => {
      setState(prev => ({ 
        ...prev, 
        volume: video.volume,
        isMuted: video.muted
      }));
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [onPlay, onPause, onEnded, onTimeUpdate, onLoadedMetadata]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setState(prev => ({ ...prev, isFullscreen: isCurrentlyFullscreen }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (hideControlsTimeout) {
      clearTimeout(hideControlsTimeout);
    }
    
    setState(prev => ({ ...prev, showControls: true }));
    
    const timeout = setTimeout(() => {
      if (state.isPlaying) {
        setState(prev => ({ ...prev, showControls: false }));
      }
    }, 3000);
    
    setHideControlsTimeout(timeout);
  }, [hideControlsTimeout, state.isPlaying]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (state.isPlaying) {
        video.pause();
      } else {
        // Ensure video is ready before playing
        if (video.readyState >= 2) { // HAVE_CURRENT_DATA
          await video.play();
        } else {
          // Wait for video to load enough data
          const playWhenReady = () => {
            video.removeEventListener('canplay', playWhenReady);
            video.play().catch(error => {
              console.warn('Play request failed:', error);
              setState(prev => ({ ...prev, error: error as Error }));
            });
          };
          video.addEventListener('canplay', playWhenReady);
        }
      }
    } catch (error) {
      console.warn('Play request failed:', error);
      setState(prev => ({ ...prev, error: error as Error }));
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
  };

  const setVolume = (volume: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = Math.max(0, Math.min(1, volume));
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(state.duration, time));
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (state.isFullscreen) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      } else {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        } else if ((container as any).mozRequestFullScreen) {
          await (container as any).mozRequestFullScreen();
        } else if ((container as any).msRequestFullscreen) {
          await (container as any).msRequestFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const setPlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setState(prev => ({ ...prev, playbackRate: rate }));
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seekTo(percent * state.duration);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    setVolume(percent);
  };

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  const getCurrentSubtitleText = () => {
    if (state.selectedSubtitle === null || !parsedSubtitles[state.selectedSubtitle]) {
      return '';
    }

    return getCurrentSubtitle(parsedSubtitles[state.selectedSubtitle], state.currentTime);
  };

  const getBufferedPercent = () => {
    if (!state.buffered || state.duration === 0) return 0;
    
    const buffered = state.buffered;
    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= state.currentTime && state.currentTime <= buffered.end(i)) {
        return (buffered.end(i) / state.duration) * 100;
      }
    }
    
    return 0;
  };

  const currentSubtitleText = getCurrentSubtitleText();

  return (
    <div
      ref={containerRef}
      className={`serika-video-player serika-video-player-${theme} ${state.isFullscreen ? 'serika-video-player-fullscreen' : ''} ${className || ''}`}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        aspectRatio: height === 'auto' ? '16/9' : undefined,
        // CSS variables for runtime customization
        ['--serika-border-radius' as any]: rounded !== undefined ? (typeof rounded === 'number' ? `${rounded}px` : rounded) : undefined,
        ['--serika-ambient-opacity' as any]: ambient ? String(Math.max(0, Math.min(1, ambientIntensity))) : undefined,
        ['--serika-ambient-blur' as any]: ambient ? `${Math.max(0, ambientBlur)}px` : undefined,
        ...style 
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => state.isPlaying && setState(prev => ({ ...prev, showControls: false }))}
    >
      <div className="serika-video-player-video-container" onClick={togglePlay}>
        {ambient && <div className="serika-video-player-ambient" />}
        <video
          ref={videoRef}
          className="serika-video-player-video-element"
          poster={poster}
          autoPlay={autoPlay && !state.isLoading}
          loop={loop}
          muted={state.isMuted}
          preload={preload}
          playsInline
        />

        {state.isLoading && (
          <div className="serika-video-player-loading">
            <div className="serika-video-player-spinner"></div>
            <div>{t.loading || 'Loading...'}</div>
          </div>
        )}

        {state.error && (
          <div className="serika-video-player-error">
            <div className="serika-video-player-error-icon">⚠️</div>
            <div>Error loading video</div>
          </div>
        )}

        {!state.isPlaying && !state.isLoading && (
          <button className="serika-video-player-center-button" onClick={togglePlay}>
            <PlayIcon />
          </button>
        )}

        {currentSubtitleText && (
          <div className="serika-video-player-subtitle-display">
            {currentSubtitleText}
          </div>
        )}

        {controls && (
          <div className={`serika-video-player-controls ${!state.showControls ? 'serika-video-player-controls-hidden' : ''}`}>
            <div
              className="serika-video-player-progress-container"
              ref={progressRef}
              onClick={handleProgressClick}
            >
              <div
                className="serika-video-player-progress-buffer"
                style={{ width: `${getBufferedPercent()}%` }}
              />
              <div
                className="serika-video-player-progress-bar"
                style={{ width: `${(state.currentTime / state.duration) * 100}%` }}
              >
                <div className="serika-video-player-progress-handle" />
              </div>
            </div>

            <div className="serika-video-player-controls-row">
              <button className="serika-video-player-control-button serika-video-player-play-button" onClick={togglePlay}>
                {state.isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>

              <div className="serika-video-player-volume-container">
                <button className="serika-video-player-control-button" onClick={toggleMute}>
                  {state.isMuted || state.volume === 0 ? <MuteIcon /> : <VolumeIcon />}
                </button>
                <div
                  className="serika-video-player-volume-slider"
                  ref={volumeRef}
                  onClick={handleVolumeClick}
                >
                  <div
                    className="serika-video-player-volume-bar"
                    style={{ width: `${state.isMuted ? 0 : state.volume * 100}%` }}
                  />
                </div>
              </div>

              <div className="serika-video-player-time-display">
                <span>{formatTime(state.currentTime)}</span>
                <span>/</span>
                <span>{formatTime(state.duration)}</span>
              </div>

              <div style={{ flex: 1 }} />

              <div className="serika-video-player-settings-container">
                <button
                  className="serika-video-player-control-button"
                  onClick={() => setState(prev => ({ ...prev, showSettings: !prev.showSettings }))}
                >
                  <SettingsIcon />
                </button>

                {state.showSettings && (
                  <div className="serika-video-player-settings-menu">
                    <div className="serika-video-player-settings-item">
                      <span>{t.playbackSpeed}</span>
                      <select
                        value={state.playbackRate}
                        onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                        style={{ background: 'transparent', color: 'white', border: 'none' }}
                      >
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1}>1x</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2x</option>
                      </select>
                    </div>
                    
                    <div className="serika-video-player-settings-item">
                      <span>{t.subtitles}</span>
                      <select
                        value={state.selectedSubtitle ?? -1}
                        onChange={(e) => setState(prev => ({ 
                          ...prev, 
                          selectedSubtitle: e.target.value === '-1' ? null : parseInt(e.target.value) 
                        }))}
                        style={{ background: 'transparent', color: 'white', border: 'none' }}
                      >
                        <option value={-1}>{t.noSubtitles}</option>
                        {subtitles.map((subtitle, index) => (
                          <option key={index} value={index}>
                            {subtitle.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <button className="serika-video-player-control-button" onClick={toggleFullscreen}>
                {state.isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// SVG Icons
const PlayIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
  </svg>
);

const VolumeIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

const MuteIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);

const FullscreenIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
);

const ExitFullscreenIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </svg>
);

export default VideoPlayer;
