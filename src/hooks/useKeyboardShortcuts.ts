import { useEffect } from 'react';

export interface KeyboardShortcuts {
  togglePlay: () => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  volumeUp: () => void;
  volumeDown: () => void;
  seekForward: (seconds?: number) => void;
  seekBackward: (seconds?: number) => void;
  increaseSpeed: () => void;
  decreaseSpeed: () => void;
  toggleSubtitles: () => void;
}

export const useKeyboardShortcuts = (
  enabled: boolean = true,
  shortcuts: KeyboardShortcuts,
  containerRef: React.RefObject<HTMLElement>
) => {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when the player is focused or when no input is focused
      const focusedElement = document.activeElement;
      const isInputFocused = focusedElement?.tagName === 'INPUT' || 
                            focusedElement?.tagName === 'TEXTAREA' ||
                            (focusedElement as HTMLElement)?.contentEditable === 'true';
      
      if (isInputFocused) return;
      
      // Check if the player container or its children have focus
      const playerContainer = containerRef.current;
      if (!playerContainer?.contains(focusedElement) && document.activeElement !== document.body) {
        return;
      }

      const { key, code, ctrlKey, shiftKey, altKey, metaKey } = event;
      
      // Don't handle shortcuts with modifier keys (except for some specific combinations)
      if (ctrlKey || metaKey || altKey) return;

      switch (key.toLowerCase()) {
        case ' ':
        case 'k':
          event.preventDefault();
          shortcuts.togglePlay();
          break;
          
        case 'm':
          event.preventDefault();
          shortcuts.toggleMute();
          break;
          
        case 'f':
          event.preventDefault();
          shortcuts.toggleFullscreen();
          break;
          
        case 'arrowup':
          event.preventDefault();
          shortcuts.volumeUp();
          break;
          
        case 'arrowdown':
          event.preventDefault();
          shortcuts.volumeDown();
          break;
          
        case 'arrowright':
          event.preventDefault();
          shortcuts.seekForward(shiftKey ? 30 : 10);
          break;
          
        case 'arrowleft':
          event.preventDefault();
          shortcuts.seekBackward(shiftKey ? 30 : 10);
          break;
          
        case '>':
        case '.':
          if (shiftKey) {
            event.preventDefault();
            shortcuts.increaseSpeed();
          }
          break;
          
        case '<':
        case ',':
          if (shiftKey) {
            event.preventDefault();
            shortcuts.decreaseSpeed();
          }
          break;
          
        case 'c':
          event.preventDefault();
          shortcuts.toggleSubtitles();
          break;

        // Number keys for seeking (0-9 = 0%-90%)
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          event.preventDefault();
          const percent = parseInt(key) * 10;
          // This would need to be implemented in the parent component
          break;
      }
    };

    const container = containerRef.current;
    container?.addEventListener('keydown', handleKeyDown);
    
    // Make the container focusable
    if (container && !container.hasAttribute('tabindex')) {
      container.setAttribute('tabindex', '0');
    }

    return () => {
      container?.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, shortcuts, containerRef]);
};
