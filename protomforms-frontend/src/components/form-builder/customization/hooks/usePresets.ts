/**
 * usePresets Hook
 * Manages preset templates with 8 professional themes
 */

import { useState, useCallback, useMemo } from 'react';
import { PresetTemplate, ThemeV2 } from '../../../../types/theme';

interface UsePresetsReturn {
  presets: PresetTemplate[];
  applyPreset: (presetId: string) => Partial<ThemeV2> | null;
  saveCustomPreset: (name: string, description: string, theme: Partial<ThemeV2>) => void;
  deleteCustomPreset: (presetId: string) => void;
  customPresets: PresetTemplate[];
}

// Built-in professional presets
const BUILT_IN_PRESETS: PresetTemplate[] = [
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Professional and trustworthy design for business surveys',
    category: 'professional',
    theme: {
      primaryColor: '#FFCD00',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      accentColor: '#868789',
      fontFamily: 'Inter, system-ui, sans-serif',
      headingFontFamily: 'Inter, system-ui, sans-serif',
      questionFontSize: 18,
      optionFontSize: 16,
      questionFontWeight: 'semibold',
      buttonStyle: 'filled',
      borderRadius: 8,
      cardPadding: 32,
      backgroundType: 'color',
      lineHeight: 1.6,
      letterSpacing: 0,
      questionSpacing: 28,
      sectionSpacing: 48,
      hoverEffect: true,
      hoverScale: 1.02,
      animationSpeed: 'normal',
      enableTransitions: true,
      questionBackgroundColor: '#f9fafb',
      questionBorderColor: '#e5e7eb',
      optionBorderColor: '#d1d5db',
      optionHoverColor: '#f9fafb',
      optionSelectedColor: '#FFCD00',
    },
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean, spacious design with black and white aesthetics',
    category: 'minimal',
    theme: {
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      accentColor: '#404040',
      fontFamily: 'Inter, system-ui, sans-serif',
      headingFontFamily: 'Inter, system-ui, sans-serif',
      questionFontSize: 20,
      optionFontSize: 16,
      questionFontWeight: 'medium',
      buttonStyle: 'outlined',
      borderRadius: 0,
      cardPadding: 40,
      backgroundType: 'color',
      lineHeight: 1.8,
      letterSpacing: 0.5,
      questionSpacing: 48,
      sectionSpacing: 64,
      hoverEffect: true,
      hoverScale: 1.0,
      animationSpeed: 'slow',
      enableTransitions: true,
      questionBackgroundColor: 'transparent',
      questionBorderColor: '#e5e5e5',
      optionBorderColor: '#000000',
      optionHoverColor: '#f5f5f5',
      optionSelectedColor: '#000000',
      optionTextColor: '#000000',
      borderWidth: 2,
      borderStyle: 'solid',
    },
  },
  {
    id: 'creative-bold',
    name: 'Creative Bold',
    description: 'Vibrant colors and large typography for engaging surveys',
    category: 'bold',
    theme: {
      primaryColor: '#dc2626',
      backgroundColor: '#fef2f2',
      textColor: '#1f2937',
      accentColor: '#f59e0b',
      fontFamily: 'Poppins, system-ui, sans-serif',
      headingFontFamily: 'Poppins, system-ui, sans-serif',
      questionFontSize: 24,
      optionFontSize: 18,
      questionFontWeight: 'bold',
      buttonStyle: 'filled',
      borderRadius: 16,
      cardPadding: 36,
      backgroundType: 'color',
      lineHeight: 1.5,
      letterSpacing: 0,
      questionSpacing: 32,
      sectionSpacing: 56,
      hoverEffect: true,
      hoverScale: 1.05,
      animationSpeed: 'fast',
      enableTransitions: true,
      questionBackgroundColor: '#ffffff',
      questionBorderColor: '#fecaca',
      optionBorderColor: '#fca5a5',
      optionHoverColor: '#fee2e2',
      optionSelectedColor: '#fecaca',
      shadowIntensity: 3,
      glowEffect: {
        enabled: true,
        color: '#dc2626',
        intensity: 30,
      },
    },
  },
  {
    id: 'dark-elegant',
    name: 'Dark Elegant',
    description: 'Sophisticated dark mode with gold accents',
    category: 'professional',
    theme: {
      primaryColor: '#d97706',
      backgroundColor: '#1f2937',
      textColor: '#f3f4f6',
      accentColor: '#fbbf24',
      fontFamily: 'Playfair Display, serif',
      headingFontFamily: 'Playfair Display, serif',
      questionFontSize: 20,
      optionFontSize: 16,
      questionFontWeight: 'semibold',
      buttonStyle: 'filled',
      borderRadius: 12,
      cardPadding: 32,
      backgroundType: 'color',
      lineHeight: 1.7,
      letterSpacing: 0.3,
      questionSpacing: 32,
      sectionSpacing: 52,
      hoverEffect: true,
      hoverScale: 1.02,
      animationSpeed: 'normal',
      enableTransitions: true,
      questionBackgroundColor: '#374151',
      questionBorderColor: '#4b5563',
      optionBorderColor: '#6b7280',
      optionHoverColor: '#4b5563',
      optionSelectedColor: '#92400e',
      shadowIntensity: 4,
    },
  },
  {
    id: 'nature-green',
    name: 'Nature Green',
    description: 'Calming, eco-friendly design with natural tones',
    category: 'creative',
    theme: {
      primaryColor: '#059669',
      backgroundColor: '#f0fdf4',
      textColor: '#064e3b',
      accentColor: '#10b981',
      fontFamily: 'Nunito, system-ui, sans-serif',
      headingFontFamily: 'Nunito, system-ui, sans-serif',
      questionFontSize: 18,
      optionFontSize: 16,
      questionFontWeight: 'semibold',
      buttonStyle: 'filled',
      borderRadius: 12,
      cardPadding: 28,
      backgroundType: 'gradient',
      backgroundGradient: {
        type: 'linear',
        colors: ['#f0fdf4', '#dcfce7', '#bbf7d0'],
        angle: 135,
      },
      lineHeight: 1.6,
      letterSpacing: 0,
      questionSpacing: 28,
      sectionSpacing: 48,
      hoverEffect: true,
      hoverScale: 1.02,
      animationSpeed: 'normal',
      enableTransitions: true,
      questionBackgroundColor: '#ffffff',
      questionBorderColor: '#86efac',
      optionBorderColor: '#6ee7b7',
      optionHoverColor: '#d1fae5',
      optionSelectedColor: '#a7f3d0',
    },
  },
  {
    id: 'tech-purple',
    name: 'Tech Purple',
    description: 'Modern tech aesthetic with purple gradients',
    category: 'bold',
    theme: {
      primaryColor: '#7c3aed',
      backgroundColor: '#faf5ff',
      textColor: '#1f2937',
      accentColor: '#a855f7',
      fontFamily: 'Montserrat, system-ui, sans-serif',
      headingFontFamily: 'Montserrat, system-ui, sans-serif',
      questionFontSize: 19,
      optionFontSize: 16,
      questionFontWeight: 'semibold',
      buttonStyle: 'filled',
      borderRadius: 10,
      cardPadding: 30,
      backgroundType: 'gradient',
      backgroundGradient: {
        type: 'linear',
        colors: ['#faf5ff', '#f3e8ff', '#e9d5ff'],
        angle: 180,
      },
      lineHeight: 1.6,
      letterSpacing: 0,
      questionSpacing: 30,
      sectionSpacing: 50,
      hoverEffect: true,
      hoverScale: 1.03,
      animationSpeed: 'fast',
      enableTransitions: true,
      questionBackgroundColor: '#ffffff',
      questionBorderColor: '#d8b4fe',
      optionBorderColor: '#c084fc',
      optionHoverColor: '#f3e8ff',
      optionSelectedColor: '#e9d5ff',
      glowEffect: {
        enabled: true,
        color: '#7c3aed',
        intensity: 25,
      },
    },
  },
  {
    id: 'warm-sunset',
    name: 'Warm Sunset',
    description: 'Inviting design with orange and pink gradient',
    category: 'creative',
    theme: {
      primaryColor: '#ea580c',
      backgroundColor: '#fff7ed',
      textColor: '#1f2937',
      accentColor: '#f97316',
      fontFamily: 'Quicksand, system-ui, sans-serif',
      headingFontFamily: 'Quicksand, system-ui, sans-serif',
      questionFontSize: 19,
      optionFontSize: 16,
      questionFontWeight: 'semibold',
      buttonStyle: 'filled',
      borderRadius: 14,
      cardPadding: 32,
      backgroundType: 'gradient',
      backgroundGradient: {
        type: 'linear',
        colors: ['#fff7ed', '#ffedd5', '#fed7aa'],
        angle: 120,
      },
      lineHeight: 1.6,
      letterSpacing: 0,
      questionSpacing: 30,
      sectionSpacing: 50,
      hoverEffect: true,
      hoverScale: 1.02,
      animationSpeed: 'normal',
      enableTransitions: true,
      questionBackgroundColor: '#ffffff',
      questionBorderColor: '#fdba74',
      optionBorderColor: '#fb923c',
      optionHoverColor: '#ffedd5',
      optionSelectedColor: '#fed7aa',
    },
  },
  {
    id: 'classic-formal',
    name: 'Classic Formal',
    description: 'Traditional, professional design with serif typography',
    category: 'professional',
    theme: {
      primaryColor: '#1e3a8a',
      backgroundColor: '#fefce8',
      textColor: '#1e293b',
      accentColor: '#334155',
      fontFamily: 'Merriweather, serif',
      headingFontFamily: 'Merriweather, serif',
      questionFontSize: 18,
      optionFontSize: 15,
      questionFontWeight: 'bold',
      buttonStyle: 'outlined',
      borderRadius: 4,
      cardPadding: 36,
      backgroundType: 'color',
      lineHeight: 1.8,
      letterSpacing: 0.2,
      questionSpacing: 32,
      sectionSpacing: 56,
      hoverEffect: true,
      hoverScale: 1.0,
      animationSpeed: 'slow',
      enableTransitions: true,
      questionBackgroundColor: '#ffffff',
      questionBorderColor: '#cbd5e1',
      optionBorderColor: '#94a3b8',
      optionHoverColor: '#f8fafc',
      optionSelectedColor: '#e2e8f0',
      borderWidth: 1,
      borderStyle: 'solid',
    },
  },
];

export function usePresets(): UsePresetsReturn {
  // Custom presets saved by the user
  const [customPresets, setCustomPresets] = useState<PresetTemplate[]>(() => {
    const stored = localStorage.getItem('protomforms-custom-presets');
    return stored ? JSON.parse(stored) : [];
  });

  // All presets (built-in + custom)
  const presets = useMemo(() => {
    return [...BUILT_IN_PRESETS, ...customPresets];
  }, [customPresets]);

  /**
   * Apply a preset by ID
   */
  const applyPreset = useCallback(
    (presetId: string): Partial<ThemeV2> | null => {
      const preset = presets.find((p) => p.id === presetId);
      return preset ? preset.theme : null;
    },
    [presets]
  );

  /**
   * Save a custom preset
   */
  const saveCustomPreset = useCallback(
    (name: string, description: string, theme: Partial<ThemeV2>) => {
      const newPreset: PresetTemplate = {
        id: `custom-${Date.now()}`,
        name,
        description,
        category: 'professional',
        theme,
      };

      const updated = [...customPresets, newPreset];
      setCustomPresets(updated);
      localStorage.setItem('protomforms-custom-presets', JSON.stringify(updated));
    },
    [customPresets]
  );

  /**
   * Delete a custom preset
   */
  const deleteCustomPreset = useCallback(
    (presetId: string) => {
      const updated = customPresets.filter((p) => p.id !== presetId);
      setCustomPresets(updated);
      localStorage.setItem('protomforms-custom-presets', JSON.stringify(updated));
    },
    [customPresets]
  );

  return {
    presets,
    applyPreset,
    saveCustomPreset,
    deleteCustomPreset,
    customPresets,
  };
}
