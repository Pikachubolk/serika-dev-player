# Serika Video Player 🎥

A beautiful purple-themed video player component for React with multi-language and subtitle support.

## Features

- 🎨 **Beautiful Purple Theme** - Modern gradient design with smooth animations
- 🌍 **Multi-language Support** - Built-in support for English, Spanish, French, German, and Dutch
- 📝 **Subtitle Support** - Advanced styled subtitle parsing for WebVTT, SRT, ASS/SSA, YouTube YTT, and SRV3
- 🎬 **Multiple Video Formats** - Support for MP4, WebM, MKV, HLS streams and more
- 🎮 **Custom Controls** - Play/pause, volume, timeline scrubbing, fullscreen
- ⚙️ **Settings Menu** - Playback speed, subtitles, adaptive quality, and audio track selection
- 📱 **Responsive Design** - Works great on desktop and mobile
- 🎯 **TypeScript Support** - Full TypeScript definitions included
- ♿ **Accessible** - ARIA labels and keyboard navigation

## Installation

```bash
npm install serika-dev-player
```

## Quick Start

```tsx
import React from 'react';
import { VideoPlayer } from 'serika-dev-player';

function App() {
  return (
    <VideoPlayer
      src="https://example.com/video.mp4"
      width="800px"
      height="450px"
      subtitles={[
        {
          src: "https://example.com/subtitles-en.vtt",
          label: "English",
          language: "en",
          default: true
        },
        {
          src: "https://example.com/subtitles-es.vtt", 
          label: "Español",
          language: "es"
        }
      ]}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | - | **Required.** Video source URL |
| `poster` | `string` | - | Poster image URL |
| `width` | `string \| number` | `"100%"` | Player width |
| `height` | `string \| number` | `"auto"` | Player height |
| `autoPlay` | `boolean` | `false` | Auto-play video |
| `controls` | `boolean` | `true` | Show player controls |
| `loop` | `boolean` | `false` | Loop video |
| `muted` | `boolean` | `false` | Start muted |
| `preload` | `"none" \| "metadata" \| "auto"` | `"metadata"` | Preload behavior |
| `subtitles` | `SubtitleTrack[]` | `[]` | Subtitle tracks |
| `language` | `string` | `"en"` | UI language |
| `theme` | `"dark" \| "light"` | `"dark"` | Player theme |
| `className` | `string` | - | Additional CSS class |
| `style` | `React.CSSProperties` | - | Inline styles |

### Event Handlers

| Prop | Type | Description |
|------|------|-------------|
| `onPlay` | `() => void` | Fired when video starts playing |
| `onPause` | `() => void` | Fired when video is paused |
| `onEnded` | `() => void` | Fired when video ends |
| `onTimeUpdate` | `(currentTime: number) => void` | Fired during playback |
| `onLoadedMetadata` | `(duration: number) => void` | Fired when metadata loads |

## Subtitle Support

The player supports WebVTT (.vtt), SRT (.srt), ASS/SSA (.ass/.ssa), YouTube YTT (.ytt), and SRV3 (.srv3) subtitle files with styled text rendering:

```tsx
const subtitles = [
  {
    src: "/subtitles/movie-en.vtt",
    label: "English", 
    language: "en",
    default: true,
    kind: "subtitles"
  },
  {
    src: "/subtitles/movie-es.srt",
    label: "Español",
    language: "es", 
    kind: "subtitles"
  }
];

<VideoPlayer 
  src="/video.mp4"
  subtitles={subtitles}
/>
```

## Multi-language Support

The player UI supports multiple languages out of the box:

```tsx
<VideoPlayer 
  src="/video.mp4"
  language="es" // Spanish UI
/>
```

Supported languages:
- `en` - English (default)
- `es` - Español  
- `fr` - Français
- `de` - Deutsch
- `nl` - Nederlands

## Video Format Support

The player supports various video formats including:

- **MP4** - Standard web video format
- **WebM** - Open web video format  
- **MKV** - Matroska container (with compatible codecs)
- **HLS** - HTTP Live Streaming (.m3u8)
- **Other formats** supported by your browser

For HLS streams, the player automatically uses HLS.js when needed and exposes quality/audio-track selectors when multiple variants are available:

```tsx
<VideoPlayer 
  src="https://example.com/stream.m3u8" 
/>
```

## Custom Styling

The player uses CSS modules with custom properties for easy theming:

```css
/* Override default purple theme */
.my-player {
  --primary-color: #your-color;
  --primary-gradient: linear-gradient(135deg, #start, #end);
}
```

```tsx
<VideoPlayer 
  src="/video.mp4"
  className="my-player"
/>
```

## Advanced Usage

```tsx
import { VideoPlayer, getSupportedFormats } from 'serika-dev-player';

function AdvancedPlayer() {
  const supportedFormats = getSupportedFormats();
  
  return (
    <VideoPlayer
      src="/video.mkv"
      poster="/thumbnail.jpg"
      width="100%"
      height="500px"
      autoPlay={false}
      loop={false}
      language="fr"
      theme="light"
      subtitles={[
        {
          src: "/subs-en.vtt",
          label: "English",
          language: "en"
        },
        {
          src: "/subs-fr.vtt", 
          label: "Français",
          language: "fr",
          default: true
        }
      ]}
      onPlay={() => console.log('Started playing')}
      onPause={() => console.log('Paused')}
      onTimeUpdate={(time) => console.log('Current time:', time)}
    />
  );
}
```

## TypeScript Support

The package includes full TypeScript definitions:

```tsx
import { VideoPlayerProps, SubtitleTrack } from 'serika-dev-player';

const playerProps: VideoPlayerProps = {
  src: "/video.mp4",
  subtitles: [] as SubtitleTrack[]
};
```

## Browser Support

- Chrome 60+
- Firefox 55+  
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with ❤️ by [serika.dev](https://serika.dev)