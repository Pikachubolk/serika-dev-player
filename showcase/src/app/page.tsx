"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import 'serika-dev-player/dist/index.css';

const VideoPlayer = dynamic(() => import('serika-dev-player').then(mod => mod.VideoPlayer), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-black/50 animate-pulse rounded-2xl flex items-center justify-center text-white/20">
      Loading Player...
    </div>
  )
});

// Subtitle interface based on package
interface SubtitleTrack {
  src: string;
  label: string;
  language: string;
  default?: boolean;
}

export default function Home() {
  // Advanced options state
  const [customSrc, setCustomSrc] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4');
  const [customSubtitles, setCustomSubtitles] = useState<SubtitleTrack[]>([]);
  const [newSubSrc, setNewSubSrc] = useState('');
  const [newSubLabel, setNewSubLabel] = useState('');
  const [newSubLang, setNewSubLang] = useState('');
  const [playerKey, setPlayerKey] = useState(0); // Force re-render

  const refreshPlayer = () => {
    setPlayerKey(prev => prev + 1);
  };

  const addSubtitle = () => {
    if (newSubSrc && newSubLabel && newSubLang) {
      setCustomSubtitles([...customSubtitles, {
        src: newSubSrc,
        label: newSubLabel,
        language: newSubLang
      }]);
      setNewSubSrc('');
      setNewSubLabel('');
      setNewSubLang('');
    }
  };

  const removeSubtitle = (index: number) => {
    setCustomSubtitles(customSubtitles.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-purple-500/30">

      {/* Hero Section */}
      <header className="py-12 px-6 text-center bg-gradient-to-b from-purple-900/20 to-transparent border-b border-white/5">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          Serika Dev Player
        </h1>
        <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
          A modern, beautiful, and feature-rich video player component for React.
          Built with aesthetics and performance in mind.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a href="https://www.npmjs.com/package/serika-dev-player" target="_blank" rel="noreferrer"
            className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/10 font-medium">
            npm install serika-dev-player
          </a>
          <a href="https://github.com/pikachubolk/serika-dev-player" target="_blank" rel="noreferrer"
            className="px-6 py-2 rounded-full bg-purple-600 hover:bg-purple-500 transition-colors font-medium">
            View on GitHub
          </a>
        </div>
      </header>

      {/* Main Player Demonstration */}
      <main className="max-w-6xl mx-auto px-6 py-16 space-y-24">

        {/* Demo 1: The Main Showcase */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">HLS Streaming Demo</h2>
              <p className="text-neutral-400">Adaptive bitrate streaming with HLS support out of the box.</p>
            </div>
            <div className="px-3 py-1 rounded bg-green-500/10 text-green-400 text-sm font-mono border border-green-500/20">
              Live Demo
            </div>
          </div>

          <div className="relative group rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/20 border border-white/10 bg-black aspect-video">
            <VideoPlayer
              src="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
              poster="https://image.mux.com/VZtzUzGRv02OhRnZCxcNg49OilvolTqdnFLEqBsTwaxU/thumbnail.webp?time=268&width=1200"
              width="100%"
              height="100%"
              autoPlay={false}
              theme="dark"
            />
          </div>
        </section>

        {/* Demo 2: MP4 with Multi-Language */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">Multi-Language Support</h2>
              <p className="text-neutral-400">The player interface is fully localized. Try these different configurations:</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Spanish Player */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20">ES</span>
                <span>Spanish Interface</span>
              </div>
              <div className="rounded-xl overflow-hidden shadow-lg border border-white/10 bg-black aspect-video">
                <VideoPlayer
                  src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                  width="100%"
                  height="100%"
                  language="es"
                />
              </div>
            </div>

            {/* French Player with Light Theme */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded border border-blue-500/20">FR</span>
                <span className="bg-white/10 text-white px-2 py-0.5 rounded border border-white/20">Light Theme</span>
                <span>French Interface</span>
              </div>
              <div className="rounded-xl overflow-hidden shadow-lg border border-white/10 bg-white aspect-video">
                <VideoPlayer
                  src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
                  width="100%"
                  height="100%"
                  language="fr"
                  theme="light"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Demo 3: Advanced Options Playground */}
        <section className="space-y-8 pt-10 border-t border-white/5">
          <div>
            <h2 className="text-3xl font-bold mb-2">Advanced Playground</h2>
            <p className="text-neutral-400">Test the player with your own content.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Controls */}
            <div className="lg:col-span-1 space-y-6 bg-neutral-900/30 p-6 rounded-2xl border border-white/5 h-fit">

              <div className="space-y-3">
                <label className="text-sm font-medium text-purple-400">Video Source URL</label>
                <input
                  type="text"
                  value={customSrc}
                  onChange={(e) => setCustomSrc(e.target.value)}
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-sm"
                  placeholder="https://example.com/video.mp4"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-purple-400">Add Subtitle Track</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newSubLabel}
                    onChange={(e) => setNewSubLabel(e.target.value)}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-sm"
                    placeholder="Label (e.g. English)"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubLang}
                      onChange={(e) => setNewSubLang(e.target.value)}
                      className="w-1/3 px-4 py-2 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-sm"
                      placeholder="Lang (en)"
                    />
                    <input
                      type="text"
                      value={newSubSrc}
                      onChange={(e) => setNewSubSrc(e.target.value)}
                      className="w-2/3 px-4 py-2 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-sm"
                      placeholder="Source URL (.vtt, .srt)"
                    />
                  </div>
                  <button
                    onClick={addSubtitle}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors"
                  >
                    + Add Track
                  </button>
                </div>
              </div>

              {customSubtitles.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-purple-400">Active Tracks</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {customSubtitles.map((track, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5 text-xs">
                        <div className="truncate pr-2">
                          <span className="font-bold text-white/80">{track.label}</span>
                          <span className="mx-2 text-white/30">|</span>
                          <span className="text-white/50">{track.language}</span>
                        </div>
                        <button
                          onClick={() => removeSubtitle(idx)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={refreshPlayer}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Render Player
              </button>

            </div>

            {/* Right: Player Preview */}
            <div className="lg:col-span-2 space-y-4">
              <div
                key={playerKey}
                className="rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/10 border border-white/10 bg-black aspect-video relative"
              >
                <VideoPlayer
                  src={customSrc}
                  width="100%"
                  height="100%"
                  subtitles={customSubtitles}
                  onError={(e: any) => console.error("Player Error:", e)}
                />
              </div>
              <p className="text-center text-sm text-neutral-500">
                Note: Ensure your video URL supports CORS if loading from a generic external domain.
              </p>
            </div>
          </div>
        </section>

      </main>

      <footer className="py-8 text-center text-neutral-500 text-sm border-t border-white/5">
        <p>© {new Date().getFullYear()} Serika Dev. Released under MIT License.</p>
      </footer>
    </div>
  );
}
