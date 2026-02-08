export interface Translations {
  play: string;
  pause: string;
  mute: string;
  unmute: string;
  fullscreen: string;
  exitFullscreen: string;
  volume: string;
  currentTime: string;
  duration: string;
  subtitles: string;
  noSubtitles: string;
  playbackSpeed: string;
  settings: string;
  loading: string;
  skipForward: string;
  skipBackward: string;
  keyboardShortcuts: string;
  quality: string;
  audioTrack: string;
  auto: string;
}

export const translations: Record<string, Translations> = {
  en: {
    play: 'Play',
    pause: 'Pause',
    mute: 'Mute',
    unmute: 'Unmute',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit Fullscreen',
    volume: 'Volume',
    currentTime: 'Current Time',
    duration: 'Duration',
    subtitles: 'Subtitles',
    noSubtitles: 'No Subtitles',
    playbackSpeed: 'Playback Speed',
    settings: 'Settings',
    loading: 'Loading...',
    skipForward: 'Skip forward 10 seconds',
    skipBackward: 'Skip backward 10 seconds',
    keyboardShortcuts: 'Keyboard shortcuts available',
    quality: 'Quality',
    audioTrack: 'Audio Track',
    auto: 'Auto'
  },
  es: {
    play: 'Reproducir',
    pause: 'Pausar',
    mute: 'Silenciar',
    unmute: 'Activar sonido',
    fullscreen: 'Pantalla completa',
    exitFullscreen: 'Salir de pantalla completa',
    volume: 'Volumen',
    currentTime: 'Tiempo actual',
    duration: 'Duración',
    subtitles: 'Subtítulos',
    noSubtitles: 'Sin subtítulos',
    playbackSpeed: 'Velocidad de reproducción',
    settings: 'Configuración',
    loading: 'Cargando...',
    skipForward: 'Avanzar 10 segundos',
    skipBackward: 'Retroceder 10 segundos',
    keyboardShortcuts: 'Atajos de teclado disponibles',
    quality: 'Calidad',
    audioTrack: 'Pista de audio',
    auto: 'Auto'
  },
  fr: {
    play: 'Lire',
    pause: 'Pause',
    mute: 'Muet',
    unmute: 'Activer le son',
    fullscreen: 'Plein écran',
    exitFullscreen: 'Quitter le plein écran',
    volume: 'Volume',
    currentTime: 'Temps actuel',
    duration: 'Durée',
    subtitles: 'Sous-titres',
    noSubtitles: 'Pas de sous-titres',
    playbackSpeed: 'Vitesse de lecture',
    settings: 'Paramètres',
    loading: 'Chargement...',
    skipForward: 'Avancer de 10 secondes',
    skipBackward: 'Reculer de 10 secondes',
    keyboardShortcuts: 'Raccourcis clavier disponibles',
    quality: 'Qualité',
    audioTrack: 'Piste audio',
    auto: 'Auto'
  },
  de: {
    play: 'Abspielen',
    pause: 'Pause',
    mute: 'Stumm schalten',
    unmute: 'Ton aktivieren',
    fullscreen: 'Vollbild',
    exitFullscreen: 'Vollbild verlassen',
    volume: 'Lautstärke',
    currentTime: 'Aktuelle Zeit',
    duration: 'Dauer',
    subtitles: 'Untertitel',
    noSubtitles: 'Keine Untertitel',
    playbackSpeed: 'Wiedergabegeschwindigkeit',
    settings: 'Einstellungen',
    loading: 'Laden...',
    skipForward: '10 Sekunden vorspulen',
    skipBackward: '10 Sekunden zurückspulen',
    keyboardShortcuts: 'Tastenkürzel verfügbar',
    quality: 'Qualität',
    audioTrack: 'Audiospur',
    auto: 'Auto'
  },
  nl: {
    play: 'Afspelen',
    pause: 'Pauzeren',
    mute: 'Dempen',
    unmute: 'Geluid aanzetten',
    fullscreen: 'Volledig scherm',
    exitFullscreen: 'Volledig scherm verlaten',
    volume: 'Volume',
    currentTime: 'Huidige tijd',
    duration: 'Duur',
    subtitles: 'Ondertitels',
    noSubtitles: 'Geen ondertitels',
    playbackSpeed: 'Afspeelsnelheid',
    settings: 'Instellingen',
    loading: 'Laden...',
    skipForward: '10 seconden vooruitspoelen',
    skipBackward: '10 seconden terugspoelen',
    keyboardShortcuts: 'Sneltoetsen beschikbaar',
    quality: 'Kwaliteit',
    audioTrack: 'Audiotrack',
    auto: 'Auto'
  }
};

export const getTranslation = (language: string = 'en'): Translations => {
  return translations[language] || translations.en;
};
