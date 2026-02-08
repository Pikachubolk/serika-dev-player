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

export interface AudioTrackOption {
  id: number;
  label: string;
  language?: string;
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
  availableAudioTracks: AudioTrackOption[];
  selectedAudioTrack: number;
}

export interface QualityLevel {
  height: number;
  width?: number;
  bitrate?: number;
  label: string;
  index: number;
}

export interface SubtitleStyle {
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: string;
  textShadow?: string;
  letterSpacing?: string;
  opacity?: number;
  transform?: string;
  position?: 'absolute' | 'relative';
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  display?: string;
}

export interface SubtitleSegment {
  text: string;
  style?: SubtitleStyle;
}

export interface SubtitleCue {
  startTime: number;
  endTime: number;
  text: string;
  lines?: SubtitleSegment[][];
  alignment?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  noBackground?: boolean;
}

export interface ParsedSubtitles {
  [key: number]: SubtitleCue[];
}
