export interface VideoPlayerProps {
  src: string;
  poster?: string;
  width?: string | number;
  height?: string | number;
  autoPlay?: boolean;
  controls?: boolean; // keep prop but controls will show by default when true
  loop?: boolean;
  muted?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  subtitles?: SubtitleTrack[];
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onLoadedMetadata?: (duration: number) => void;
  onQualityChange?: (quality: string) => void;
  className?: string;
  style?: React.CSSProperties;
  language?: string;
  theme?: 'dark' | 'light' | 'custom';
  customTheme?: CustomTheme;
  enableQualitySelector?: boolean;
  enableThumbnails?: boolean;
  thumbnailsVTT?: string;
  enableKeyboardShortcuts?: boolean;
  enableMiniPlayer?: boolean;
  enableAirplay?: boolean;
  enableChromecast?: boolean;
  onError?: (error: Error) => void;
  // New UX options
  rounded?: string | number; // e.g. '16px' or 16
  ambient?: boolean; // enable ambilight effect
  ambientIntensity?: number; // 0-1
  ambientBlur?: number; // px
}

export interface CustomTheme {
  primaryColor?: string;
  primaryGradient?: string;
  backgroundColor?: string;
  controlsBackground?: string;
  textColor?: string;
  accentColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  progressBarColor?: string;
  progressBarBackground?: string;
  bufferColor?: string;
  volumeColor?: string;
  subtitleBackground?: string;
  subtitleTextColor?: string;
  subtitleFontSize?: string;
  loadingSpinnerColor?: string;
  shadowColor?: string;
  ambientColor?: string; // overrides ambient calculated color
}

export interface SubtitleTrack {
  src: string;
  label: string;
  language: string;
  default?: boolean;
  kind?: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata';
}

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  showControls: boolean;
  selectedSubtitle: number | null;
  buffered: TimeRanges | null;
  playbackRate: number;
  availableQualities: QualityLevel[];
  selectedQuality: string;
  isLoading: boolean;
  error: Error | null;
  isMiniPlayer: boolean;
  showSettings: boolean;
}

export interface QualityLevel {
  height: number;
  width?: number;
  bitrate?: number;
  label: string;
  index: number;
}

export interface SubtitleCue {
  startTime: number;
  endTime: number;
  text: string;
}

export interface ParsedSubtitles {
  [key: number]: SubtitleCue[];
}
