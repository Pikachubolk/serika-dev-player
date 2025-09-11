// Browser-only imports - will be loaded dynamically
let Hls: any = null;
let MediaPlayer: any = null;

// Dynamic import for browser environment
const loadHls = async () => {
  if (typeof window !== 'undefined' && !Hls) {
    try {
      const hlsModule = await import('hls.js');
      Hls = hlsModule.default;
    } catch (error) {
      console.warn('HLS.js not available:', error);
    }
  }
  return Hls;
};

const loadDashjs = async () => {
  if (typeof window !== 'undefined' && !MediaPlayer) {
    try {
      const dashModule = await import('dashjs');
      MediaPlayer = dashModule.MediaPlayer;
    } catch (error) {
      console.warn('DASH.js not available:', error);
    }
  }
  return MediaPlayer;
};

export interface VideoLoaderResult {
  cleanup?: () => void;
  player?: any;
  type?: 'native' | 'hls' | 'dash';
}

export const loadVideo = async (
  videoElement: HTMLVideoElement, 
  src: string
): Promise<VideoLoaderResult> => {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return { type: 'native' };
  }

  const extension = src.toLowerCase().split('.').pop() || '';
  
  // Handle HLS streams
  if (extension === 'm3u8' || src.includes('.m3u8')) {
    const HlsClass = await loadHls();
    
    if (HlsClass && HlsClass.isSupported()) {
      const hls = new HlsClass({
        enableWorker: false,
        lowLatencyMode: true
      });
      
      hls.loadSource(src);
      hls.attachMedia(videoElement);
      
      return {
        cleanup: () => {
          hls.destroy();
        },
        player: hls,
        type: 'hls'
      };
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoElement.src = src;
      return { type: 'native' };
    }
  }
  
  // Handle DASH streams
  if (extension === 'mpd' || src.includes('.mpd')) {
    try {
      const DashClass = await loadDashjs();
      
      if (DashClass) {
        const dashPlayer = DashClass().create();
        dashPlayer.initialize(videoElement, src, false);
        
        return {
          cleanup: () => {
            dashPlayer.destroy();
          },
          player: dashPlayer,
          type: 'dash'
        };
      }
    } catch (error) {
      console.warn('DASH.js not available, falling back to native support', error);
      videoElement.src = src;
      return { type: 'native' };
    }
  }
  
  // Handle regular video files (MP4, WebM, MKV, etc.)
  // Modern browsers support MKV with proper codecs
  const supportedFormats = [
    'mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', '3gp', 'wmv'
  ];
  
  if (supportedFormats.indexOf(extension) !== -1 || !extension) {
    videoElement.src = src;
  }
  
  return {
    type: 'native'
  };
};

export const getSupportedFormats = async (): Promise<string[]> => {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return ['mp4', 'webm']; // Default safe formats for SSR
  }

  const video = document.createElement('video');
  const formats: string[] = [];
  
  // Test common video formats
  const formatTests = [
    { format: 'mp4', mime: 'video/mp4; codecs="avc1.42E01E"' },
    { format: 'webm', mime: 'video/webm; codecs="vp8, vorbis"' },
    { format: 'webm', mime: 'video/webm; codecs="vp9"' },
    { format: 'ogg', mime: 'video/ogg; codecs="theora"' },
    { format: 'mkv', mime: 'video/x-matroska' },
    { format: 'hls', mime: 'application/vnd.apple.mpegurl' }
  ];
  
  formatTests.forEach(test => {
    if (video.canPlayType(test.mime) !== '') {
      if (formats.indexOf(test.format) === -1) {
        formats.push(test.format);
      }
    }
  });
  
  // Check HLS.js support
  const HlsClass = await loadHls();
  if (HlsClass && HlsClass.isSupported()) {
    if (formats.indexOf('hls') === -1) {
        formats.push('hls');
      }
  }
  
  return formats;
};

export const getVideoInfo = (src: string): { format: string; isStream: boolean } => {
  const extension = src.toLowerCase().split('.').pop() || '';
  const streamFormats = ['m3u8', 'mpd'];
  
  return {
    format: extension,
    isStream: streamFormats.indexOf(extension) !== -1
  };
};
