/**
 * useThemeCustomization Hook
 * Manages theme state, history (undo/redo), and debounced updates
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ThemeV2, ThemeUpdate, ThemeHistoryEntry, DEFAULT_THEME_V2 } from '../../../../types/theme';

interface UseThemeCustomizationOptions {
  initialTheme?: Partial<ThemeV2>;
  onThemeChange?: (theme: Partial<ThemeV2>) => void;
  debounceMs?: number;
  maxHistorySize?: number;
}

interface UseThemeCustomizationReturn {
  theme: Partial<ThemeV2>;
  updateTheme: (updates: ThemeUpdate) => void;
  setTheme: (theme: Partial<ThemeV2>) => void;
  resetTheme: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  history: ThemeHistoryEntry[];
}

export function useThemeCustomization({
  initialTheme = DEFAULT_THEME_V2,
  onThemeChange,
  debounceMs = 300,
  maxHistorySize = 50,
}: UseThemeCustomizationOptions = {}): UseThemeCustomizationReturn {
  // Current theme state
  const [theme, setThemeState] = useState<Partial<ThemeV2>>(initialTheme);

  // History for undo/redo
  const [history, setHistory] = useState<ThemeHistoryEntry[]>([
    { theme: initialTheme, timestamp: Date.now() },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Track if theme has been modified
  const [isDirty, setIsDirty] = useState(false);

  // Debounce timer
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdates = useRef<ThemeUpdate>({});

  /**
   * Apply pending updates with debouncing
   */
  const applyPendingUpdates = useCallback(() => {
    if (Object.keys(pendingUpdates.current).length === 0) return;

    const updates = pendingUpdates.current;
    pendingUpdates.current = {};

    setThemeState((prev) => {
      const newTheme = { ...prev, ...updates };

      // Add to history (trim future history if we're not at the end)
      setHistory((prevHistory) => {
        const newHistory = prevHistory.slice(0, historyIndex + 1);
        newHistory.push({
          theme: newTheme,
          timestamp: Date.now(),
        });

        // Limit history size
        if (newHistory.length > maxHistorySize) {
          return newHistory.slice(newHistory.length - maxHistorySize);
        }

        return newHistory;
      });

      setHistoryIndex((prev) => {
        const newIndex = prev + 1;
        // Adjust if we trimmed history
        return Math.min(newIndex, maxHistorySize - 1);
      });

      setIsDirty(true);

      // Notify parent
      if (onThemeChange) {
        onThemeChange(newTheme);
      }

      return newTheme;
    });
  }, [historyIndex, maxHistorySize, onThemeChange]);

  /**
   * Update theme with immediate visual update + debounced history
   */
  const updateTheme = useCallback(
    (updates: ThemeUpdate) => {
      // Aggiorna immediatamente lo stato per l'anteprima in real-time
      setThemeState((prev) => {
        const newTheme = { ...prev, ...updates };
        
        // Notifica immediatamente il parent
        if (onThemeChange) {
          onThemeChange(newTheme);
        }
        
        return newTheme;
      });

      // Merge with pending updates per la cronologia
      pendingUpdates.current = { ...pendingUpdates.current, ...updates };

      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Aggiungi alla cronologia con debounce (per non creare troppe entry)
      debounceTimer.current = setTimeout(() => {
        if (Object.keys(pendingUpdates.current).length === 0) return;
        
        const historyUpdates = pendingUpdates.current;
        pendingUpdates.current = {};
        
        setHistory((prevHistory) => {
          const newHistory = prevHistory.slice(0, historyIndex + 1);
          newHistory.push({
            theme: { ...theme, ...historyUpdates },
            timestamp: Date.now(),
          });

          if (newHistory.length > maxHistorySize) {
            return newHistory.slice(newHistory.length - maxHistorySize);
          }

          return newHistory;
        });

        setHistoryIndex((prev) => Math.min(prev + 1, maxHistorySize - 1));
        setIsDirty(true);
      }, debounceMs);
    },
    [historyIndex, maxHistorySize, onThemeChange, theme, debounceMs]
  );

  /**
   * Set theme immediately (no debounce)
   */
  const setTheme = useCallback(
    (newTheme: Partial<ThemeV2>) => {
      // Clear pending updates
      pendingUpdates.current = {};
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      setThemeState(newTheme);

      // Add to history
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push({
          theme: newTheme,
          timestamp: Date.now(),
        });

        if (newHistory.length > maxHistorySize) {
          return newHistory.slice(newHistory.length - maxHistorySize);
        }

        return newHistory;
      });

      setHistoryIndex((prev) => Math.min(prev + 1, maxHistorySize - 1));
      setIsDirty(true);

      if (onThemeChange) {
        onThemeChange(newTheme);
      }
    },
    [historyIndex, maxHistorySize, onThemeChange]
  );

  /**
   * Reset to initial theme
   */
  const resetTheme = useCallback(() => {
    setTheme(initialTheme);
    setIsDirty(false);
  }, [initialTheme, setTheme]);

  /**
   * Undo last change
   */
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setThemeState(history[newIndex].theme);

      if (onThemeChange) {
        onThemeChange(history[newIndex].theme);
      }
    }
  }, [historyIndex, history, onThemeChange]);

  /**
   * Redo last undone change
   */
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setThemeState(history[newIndex].theme);

      if (onThemeChange) {
        onThemeChange(history[newIndex].theme);
      }
    }
  }, [historyIndex, history, onThemeChange]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    theme,
    updateTheme,
    setTheme,
    resetTheme,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    isDirty,
    history,
  };
}
