import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AudioTrackOption, VideoPlayerProps, VideoPlayerState, ParsedSubtitles } from './types';
import { parseSubtitles, getCurrentSubtitleCue } from './utils/subtitleParser';
import { formatTime } from './utils/formatTime';
import { loadVideo, VideoLoaderResult } from './utils/videoLoader';
import { getTranslation } from './locales';
import { useCustomTheme } from './hooks/useCustomTheme';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import './VideoPlayer.css';

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SEEK_STEP_SECONDS = 10;

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
  onQualityChange,
  onError,
  className,
  style,
  language = 'en',
  theme = 'dark',
  customTheme,
  rounded,
  ambient = false,
  ambientIntensity = 0.35,
  ambientBlur = 60,
  enableKeyboardShortcuts = true
}) => {
  const getInitialSubtitleIndex = () => {
    if (subtitles.length === 0) {
      return null;
    }

    const defaultTrackIndex = subtitles.findIndex(subtitle => subtitle.default);
    return defaultTrackIndex >= 0 ? defaultTrackIndex : 0;
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: muted,
    isFullscreen: false,
    showControls: true,
    selectedSubtitle: getInitialSubtitleIndex(),
    buffered: null,
    playbackRate: 1,
    availableQualities: [],
    selectedQuality: 'auto',
    isLoading: true,
    error: null,
    isMiniPlayer: false,
    showSettings: false,
    availableAudioTracks: [],
    selectedAudioTrack: 0
  });

  const [parsedSubtitles, setParsedSubtitles] = useState<ParsedSubtitles>({});
  const [hideControlsTimeout, setHideControlsTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [videoLoader, setVideoLoader] = useState<VideoLoaderResult | null>(null);
  const [progressHover, setProgressHover] = useState<{ visible: boolean; x: number; time: number }>({
    visible: false,
    x: 0,
    time: 0
  });

  const t = getTranslation(language);

  useCustomTheme(theme, customTheme, containerRef as unknown as React.RefObject<HTMLElement>);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setState(prev => ({
      ...prev,
      isLoading: true,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null
    }));

    if (!video.paused) {
      video.pause();
    }

    if (videoLoader?.cleanup) {
      videoLoader.cleanup();
    }

    const timeoutId = setTimeout(() => {
      loadVideo(video, src)
        .then(newLoader => {
          setVideoLoader(newLoader);
        })
        .catch(error => {
          const castedError = error as Error;
          console.error('Error loading video:', error);
          setState(prev => ({ ...prev, error: castedError, isLoading: false }));
          onError?.(castedError);
          video.src = src;
        });
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      if (videoLoader?.cleanup) {
        videoLoader.cleanup();
      }
    };
  }, [src]);

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

  useEffect(() => {
    if (!videoLoader || videoLoader.type !== 'hls' || !videoLoader.player) {
      setState(prev => ({
        ...prev,
        availableQualities: [],
        selectedQuality: 'auto',
        availableAudioTracks: [],
        selectedAudioTrack: 0
      }));
      return;
    }

    const hls = videoLoader.player;
    const events = hls.constructor?.Events ?? {};

    const mapQualityLevels = () => {
      const levels = (hls.levels || []) as Array<{ height?: number; width?: number; bitrate?: number }>;
      const mapped = levels.map((level, index) => ({
        index,
        height: level.height || 0,
        width: level.width,
        bitrate: level.bitrate,
        label: level.height ? `${level.height}p` : `Level ${index + 1}`
      }));

      setState(prev => ({
        ...prev,
        availableQualities: mapped,
        selectedQuality: hls.currentLevel === -1 ? 'auto' : String(hls.currentLevel)
      }));
    };

    const mapAudioTracks = () => {
      const tracks = (hls.audioTracks || []) as Array<{ id?: number; name?: string; lang?: string }>;
      const mapped: AudioTrackOption[] = tracks.map((track, index) => ({
        id: track.id ?? index,
        label: track.name || track.lang || `Track ${index + 1}`,
        language: track.lang
      }));

      setState(prev => ({
        ...prev,
        availableAudioTracks: mapped,
        selectedAudioTrack: hls.audioTrack ?? 0
      }));
    };

    const handleManifestParsed = () => {
      mapQualityLevels();
      mapAudioTracks();
    };

    const handleLevelSwitched = (_event: unknown, data: { level: number }) => {
      setState(prev => ({ ...prev, selectedQuality: data.level === -1 ? 'auto' : String(data.level) }));
    };

    const handleAudioSwitching = (_event: unknown, data: { id: number }) => {
      setState(prev => ({ ...prev, selectedAudioTrack: data.id }));
    };

    if (events.MANIFEST_PARSED) hls.on(events.MANIFEST_PARSED, handleManifestParsed);
    if (events.LEVEL_SWITCHED) hls.on(events.LEVEL_SWITCHED, handleLevelSwitched);
    if (events.AUDIO_TRACKS_UPDATED) hls.on(events.AUDIO_TRACKS_UPDATED, mapAudioTracks);
    if (events.AUDIO_TRACK_SWITCHED) hls.on(events.AUDIO_TRACK_SWITCHED, handleAudioSwitching);

    mapQualityLevels();
    mapAudioTracks();

    return () => {
      if (events.MANIFEST_PARSED) hls.off(events.MANIFEST_PARSED, handleManifestParsed);
      if (events.LEVEL_SWITCHED) hls.off(events.LEVEL_SWITCHED, handleLevelSwitched);
      if (events.AUDIO_TRACKS_UPDATED) hls.off(events.AUDIO_TRACKS_UPDATED, mapAudioTracks);
      if (events.AUDIO_TRACK_SWITCHED) hls.off(events.AUDIO_TRACK_SWITCHED, handleAudioSwitching);
    };
  }, [videoLoader]);

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

    const handleError = () => {
      const mediaError = video.error;
      const err = new Error(mediaError ? `Video error code ${mediaError.code}` : 'Unknown video playback error');
      setState(prev => ({ ...prev, error: err, isLoading: false }));
      onError?.(err);
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('error', handleError);
    };
  }, [onPlay, onPause, onEnded, onTimeUpdate, onLoadedMetadata, onError]);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setState(prev => ({ ...prev, showSettings: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetControlsTimeout = useCallback(() => {
    if (hideControlsTimeout) {
      clearTimeout(hideControlsTimeout);
    }

    setState(prev => ({ ...prev, showControls: true }));

    const timeout = setTimeout(() => {
      setState(prev => (prev.isPlaying ? { ...prev, showControls: false } : prev));
    }, 3000);

    setHideControlsTimeout(timeout);
  }, [hideControlsTimeout]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (state.isPlaying) {
        video.pause();
      } else if (video.readyState >= 2) {
        await video.play();
      } else {
        const playWhenReady = () => {
          video.removeEventListener('canplay', playWhenReady);
          video.play().catch(error => {
            const castedError = error as Error;
            console.warn('Play request failed:', error);
            setState(prev => ({ ...prev, error: castedError }));
            onError?.(castedError);
          });
        };
        video.addEventListener('canplay', playWhenReady);
      }
    } catch (error) {
      const castedError = error as Error;
      console.warn('Play request failed:', error);
      setState(prev => ({ ...prev, error: castedError }));
      onError?.(castedError);
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
    if (video.volume > 0 && video.muted) {
      video.muted = false;
    }
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(state.duration, time));
  };

  const seekBy = (seconds: number) => {
    seekTo(state.currentTime + seconds);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (state.isFullscreen) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen();
        else if ((document as any).mozCancelFullScreen) await (document as any).mozCancelFullScreen();
        else if ((document as any).msExitFullscreen) await (document as any).msExitFullscreen();
      } else {
        if (container.requestFullscreen) await container.requestFullscreen();
        else if ((container as any).webkitRequestFullscreen) await (container as any).webkitRequestFullscreen();
        else if ((container as any).mozRequestFullScreen) await (container as any).mozRequestFullScreen();
        else if ((container as any).msRequestFullscreen) await (container as any).msRequestFullscreen();
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

  const toggleSubtitles = () => {
    setState(prev => ({
      ...prev,
      selectedSubtitle: prev.selectedSubtitle === null ? (subtitles.length > 0 ? 0 : null) : null
    }));
  };

  const setQuality = (quality: string) => {
    const hls = videoLoader?.type === 'hls' ? videoLoader.player : null;
    if (!hls) return;

    if (quality === 'auto') {
      hls.currentLevel = -1;
      setState(prev => ({ ...prev, selectedQuality: 'auto' }));
      return;
    }

    const levelIndex = Number(quality);
    if (Number.isNaN(levelIndex)) return;

    hls.currentLevel = levelIndex;
    setState(prev => ({ ...prev, selectedQuality: String(levelIndex) }));
    onQualityChange?.(String(levelIndex));
  };

  const setAudioTrack = (trackId: number) => {
    const hls = videoLoader?.type === 'hls' ? videoLoader.player : null;
    if (!hls) return;

    hls.audioTrack = trackId;
    setState(prev => ({ ...prev, selectedAudioTrack: trackId }));
  };

  const getPercentFromPointer = (target: HTMLDivElement, clientX: number) => {
    const rect = target.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    seekTo(getPercentFromPointer(e.currentTarget, e.clientX) * state.duration);
  };

  const handleProgressMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const percent = getPercentFromPointer(e.currentTarget, e.clientX);
    const rect = e.currentTarget.getBoundingClientRect();
    setProgressHover({ visible: true, x: e.clientX - rect.left, time: percent * state.duration });
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setVolume(getPercentFromPointer(e.currentTarget, e.clientX));
  };

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  const getCurrentSubtitleCueForTime = () => {
    if (state.selectedSubtitle === null || !parsedSubtitles[state.selectedSubtitle]) {
      return null;
    }

    return getCurrentSubtitleCue(parsedSubtitles[state.selectedSubtitle], state.currentTime);
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

  useKeyboardShortcuts(
    enableKeyboardShortcuts,
    {
      togglePlay,
      toggleMute,
      toggleFullscreen,
      volumeUp: () => setVolume((state.isMuted ? 0 : state.volume) + 0.05),
      volumeDown: () => setVolume((state.isMuted ? 0 : state.volume) - 0.05),
      seekForward: (seconds = SEEK_STEP_SECONDS) => seekBy(seconds),
      seekBackward: (seconds = SEEK_STEP_SECONDS) => seekBy(-seconds),
      increaseSpeed: () => {
        const currentIndex = PLAYBACK_RATES.findIndex(rate => rate === state.playbackRate);
        const nextRate = PLAYBACK_RATES[Math.min(PLAYBACK_RATES.length - 1, currentIndex + 1)];
        setPlaybackRate(nextRate);
      },
      decreaseSpeed: () => {
        const currentIndex = PLAYBACK_RATES.findIndex(rate => rate === state.playbackRate);
        const nextRate = PLAYBACK_RATES[Math.max(0, currentIndex - 1)];
        setPlaybackRate(nextRate);
      },
      toggleSubtitles
    },
    containerRef as React.RefObject<HTMLElement>
  );

  const currentSubtitleCue = getCurrentSubtitleCueForTime();

  return (
    <div
      ref={containerRef}
      className={`serika-video-player serika-video-player-${theme} ${state.isFullscreen ? 'serika-video-player-fullscreen' : ''} ${className || ''}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        aspectRatio: height === 'auto' ? '16/9' : undefined,
        ['--serika-border-radius' as any]: rounded !== undefined ? (typeof rounded === 'number' ? `${rounded}px` : rounded) : undefined,
        ['--serika-ambient-opacity' as any]: ambient ? String(Math.max(0, Math.min(1, ambientIntensity))) : undefined,
        ['--serika-ambient-blur' as any]: ambient ? `${Math.max(0, ambientBlur)}px` : undefined,
        ...style
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => state.isPlaying && setState(prev => ({ ...prev, showControls: false }))}
      aria-label={enableKeyboardShortcuts ? t.keyboardShortcuts : undefined}
    >
      <div className="serika-video-player-video-container" onDoubleClick={toggleFullscreen}>
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
          onClick={togglePlay}
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
          <button className="serika-video-player-center-button" onClick={togglePlay} aria-label={t.play}>
            <PlayIcon />
          </button>
        )}

        {currentSubtitleCue && (
          <div
            className={`serika-video-player-subtitle-display ${currentSubtitleCue.noBackground ? 'serika-video-player-subtitle-no-background' : ''} serika-video-player-subtitle-align-${currentSubtitleCue.alignment ?? 'center'} serika-video-player-subtitle-vertical-${currentSubtitleCue.verticalAlign ?? 'bottom'}`}
          >
            {(currentSubtitleCue.lines && currentSubtitleCue.lines.length > 0
              ? currentSubtitleCue.lines
              : [[{ text: currentSubtitleCue.text }]]
            ).map((line, lineIndex) => (
              <div key={`subtitle-line-${lineIndex}`} className="serika-video-player-subtitle-line">
                {line.map((segment, segmentIndex) => (
                  <span key={`subtitle-segment-${lineIndex}-${segmentIndex}`} style={segment.style}>
                    {segment.text}
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}

        {controls && (
          <div className={`serika-video-player-controls ${!state.showControls ? 'serika-video-player-controls-hidden' : ''}`}>
            <div
              className="serika-video-player-progress-container"
              ref={progressRef}
              onClick={handleProgressClick}
              onMouseMove={handleProgressMove}
              onMouseLeave={() => setProgressHover(prev => ({ ...prev, visible: false }))}
            >
              <div className="serika-video-player-progress-buffer" style={{ width: `${getBufferedPercent()}%` }} />
              <div className="serika-video-player-progress-bar" style={{ width: `${(state.currentTime / (state.duration || 1)) * 100}%` }}>
                <div className="serika-video-player-progress-handle" />
              </div>
              {progressHover.visible && (
                <div className="serika-video-player-progress-tooltip" style={{ left: `${progressHover.x}px` }}>
                  {formatTime(progressHover.time)}
                </div>
              )}
            </div>

            <div className="serika-video-player-controls-row">
              <button className="serika-video-player-control-button serika-video-player-play-button" onClick={togglePlay} aria-label={state.isPlaying ? t.pause : t.play}>
                {state.isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>

              <button className="serika-video-player-control-button" onClick={() => seekBy(-SEEK_STEP_SECONDS)} aria-label={t.skipBackward} title={t.skipBackward}>
                <BackIcon />
              </button>

              <button className="serika-video-player-control-button" onClick={() => seekBy(SEEK_STEP_SECONDS)} aria-label={t.skipForward} title={t.skipForward}>
                <ForwardIcon />
              </button>

              <div className="serika-video-player-volume-container">
                <button className="serika-video-player-control-button" onClick={toggleMute} aria-label={state.isMuted ? t.unmute : t.mute}>
                  {state.isMuted || state.volume === 0 ? <MuteIcon /> : <VolumeIcon />}
                </button>
                <div className="serika-video-player-volume-slider" ref={volumeRef} onClick={handleVolumeClick}>
                  <div className="serika-video-player-volume-bar" style={{ width: `${state.isMuted ? 0 : state.volume * 100}%` }} />
                </div>
              </div>

              <div className="serika-video-player-time-display">
                <span>{formatTime(state.currentTime)}</span>
                <span>/</span>
                <span>{formatTime(state.duration)}</span>
              </div>

              <div style={{ flex: 1 }} />

              <div className="serika-video-player-settings-container" ref={settingsRef}>
                <button className="serika-video-player-control-button" onClick={() => setState(prev => ({ ...prev, showSettings: !prev.showSettings }))} aria-label={t.settings}>
                  <SettingsIcon />
                </button>

                {state.showSettings && (
                  <div className="serika-video-player-settings-menu">
                    <div className="serika-video-player-settings-item">
                      <span>{t.playbackSpeed}</span>
                      <select value={state.playbackRate} onChange={e => setPlaybackRate(parseFloat(e.target.value))} className="serika-video-player-settings-select">
                        {PLAYBACK_RATES.map(rate => (
                          <option key={rate} value={rate}>{rate}x</option>
                        ))}
                      </select>
                    </div>

                    {state.availableQualities.length > 0 && (
                      <div className="serika-video-player-settings-item">
                        <span>{t.quality}</span>
                        <select
                          value={state.selectedQuality}
                          onChange={e => setQuality(e.target.value)}
                          className="serika-video-player-settings-select"
                        >
                          <option value="auto">{t.auto}</option>
                          {state.availableQualities.map(quality => (
                            <option key={quality.index} value={quality.index}>
                              {quality.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {state.availableAudioTracks.length > 1 && (
                      <div className="serika-video-player-settings-item">
                        <span>{t.audioTrack}</span>
                        <select
                          value={state.selectedAudioTrack}
                          onChange={e => setAudioTrack(parseInt(e.target.value, 10))}
                          className="serika-video-player-settings-select"
                        >
                          {state.availableAudioTracks.map(track => (
                            <option key={`audio-track-${track.id}`} value={track.id}>
                              {track.label}{track.language ? ` (${track.language})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="serika-video-player-settings-item">
                      <span>{t.subtitles}</span>
                      <select
                        value={state.selectedSubtitle ?? -1}
                        onChange={e => setState(prev => ({ ...prev, selectedSubtitle: e.target.value === '-1' ? null : parseInt(e.target.value, 10) }))}
                        className="serika-video-player-settings-select"
                      >
                        <option value={-1}>{t.noSubtitles}</option>
                        {subtitles.map((subtitle, index) => (
                          <option key={subtitle.src + subtitle.label} value={index}>
                            {subtitle.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <button className="serika-video-player-control-button" onClick={toggleFullscreen} aria-label={state.isFullscreen ? t.exitFullscreen : t.fullscreen}>
                {state.isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PlayIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
);
const VolumeIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
);
const MuteIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
);
const FullscreenIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
);
const ExitFullscreenIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" /></svg>
);
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" /></svg>
);
const BackIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M11 18V6l-8.5 6L11 18zm1-6l8.5 6V6L12 12z" /></svg>
);
const ForwardIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M13 6v12l8.5-6L13 6zm-1 6L3.5 6v12L12 12z" /></svg>
);

export default VideoPlayer;
