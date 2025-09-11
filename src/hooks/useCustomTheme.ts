import { useEffect } from 'react';
import { CustomTheme } from '../types';

export const useCustomTheme = (theme: 'dark' | 'light' | 'custom', customTheme?: CustomTheme, elementRef?: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    if (!elementRef?.current) return;
    
    const element = elementRef.current;
    
    // Default themes
    const defaultThemes = {
      dark: {
        primaryColor: '#8a2be2',
        primaryGradient: 'linear-gradient(135deg, #6a5acd, #8a2be2)',
        backgroundColor: '#000000',
        controlsBackground: 'linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent)',
        textColor: '#ffffff',
        accentColor: '#9370db',
        borderRadius: '12px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        progressBarColor: 'linear-gradient(90deg, #8a2be2, #9370db)',
        progressBarBackground: 'rgba(255, 255, 255, 0.2)',
        bufferColor: 'rgba(138, 43, 226, 0.4)',
        volumeColor: 'linear-gradient(90deg, #8a2be2, #9370db)',
        subtitleBackground: 'rgba(0, 0, 0, 0.7)',
        subtitleTextColor: '#ffffff',
        subtitleFontSize: '18px',
        loadingSpinnerColor: '#8a2be2',
        shadowColor: 'rgba(106, 90, 205, 0.3)'
      },
      light: {
        primaryColor: '#8a2be2',
        primaryGradient: 'linear-gradient(135deg, #e1bee7, #ce93d8)',
        backgroundColor: '#ffffff',
        controlsBackground: 'linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent)',
        textColor: '#000000',
        accentColor: '#ba68c8',
        borderRadius: '12px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        progressBarColor: 'linear-gradient(90deg, #8a2be2, #ba68c8)',
        progressBarBackground: 'rgba(0, 0, 0, 0.2)',
        bufferColor: 'rgba(138, 43, 226, 0.3)',
        volumeColor: 'linear-gradient(90deg, #8a2be2, #ba68c8)',
        subtitleBackground: 'rgba(255, 255, 255, 0.9)',
        subtitleTextColor: '#000000',
        subtitleFontSize: '18px',
        loadingSpinnerColor: '#8a2be2',
        shadowColor: 'rgba(138, 43, 226, 0.2)'
      }
    };
    
    // Apply theme
    const themeConfig = theme === 'custom' && customTheme ? customTheme : defaultThemes[theme as 'dark' | 'light'] || defaultThemes.dark;
    
    // Set CSS custom properties
    Object.entries(themeConfig).forEach(([key, value]) => {
      if (value !== undefined) {
        const cssVar = `--serika-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        element.style.setProperty(cssVar, value);
      }
    });
    
  }, [theme, customTheme, elementRef]);
};

export const getCSSVariables = (): Record<string, string> => {
  return {
    '--serika-primary-color': 'var(--serika-primary-color, #8a2be2)',
    '--serika-primary-gradient': 'var(--serika-primary-gradient, linear-gradient(135deg, #6a5acd, #8a2be2))',
    '--serika-background-color': 'var(--serika-background-color, #000000)',
    '--serika-controls-background': 'var(--serika-controls-background, linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent))',
    '--serika-text-color': 'var(--serika-text-color, #ffffff)',
    '--serika-accent-color': 'var(--serika-accent-color, #9370db)',
    '--serika-border-radius': 'var(--serika-border-radius, 12px)',
    '--serika-font-family': 'var(--serika-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
    '--serika-progress-bar-color': 'var(--serika-progress-bar-color, linear-gradient(90deg, #8a2be2, #9370db))',
    '--serika-progress-bar-background': 'var(--serika-progress-bar-background, rgba(255, 255, 255, 0.2))',
    '--serika-buffer-color': 'var(--serika-buffer-color, rgba(138, 43, 226, 0.4))',
    '--serika-volume-color': 'var(--serika-volume-color, linear-gradient(90deg, #8a2be2, #9370db))',
    '--serika-subtitle-background': 'var(--serika-subtitle-background, rgba(0, 0, 0, 0.7))',
    '--serika-subtitle-text-color': 'var(--serika-subtitle-text-color, #ffffff)',
    '--serika-subtitle-font-size': 'var(--serika-subtitle-font-size, 18px)',
    '--serika-loading-spinner-color': 'var(--serika-loading-spinner-color, #8a2be2)',
    '--serika-shadow-color': 'var(--serika-shadow-color, rgba(106, 90, 205, 0.3))'
  };
};
