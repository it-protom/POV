/**
 * Extended Theme Types for ProtomForms V2
 * Supports advanced customization including gradients, blur effects, and intelligent color systems
 */

export interface GradientConfig {
  type: 'linear' | 'radial';
  colors: string[];
  angle?: number; // 0-360 for linear gradients
  position?: { x: number; y: number }; // center point for radial (0-100%)
}

export interface BackgroundOverlay {
  color: string;
  opacity: number; // 0-1
}

export interface GlowEffect {
  enabled: boolean;
  color: string;
  intensity: number; // 0-100
}

/**
 * Base Theme Interface (existing structure)
 */
export interface Theme {
  // Base Colors
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;

  // Typography
  fontFamily: string;
  questionFontSize?: number;
  optionFontSize?: number;
  questionFontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';

  // Question Styling
  questionNumberBgColor?: string;
  questionNumberTextColor?: string;
  questionTextColor?: string;
  questionBorderColor?: string;
  questionBackgroundColor?: string;

  // Option Styling
  optionTextColor?: string;
  optionHoverColor?: string;
  optionSelectedColor?: string;
  optionBorderColor?: string;
  radioCheckColor?: string;

  // Buttons
  buttonStyle: 'filled' | 'outlined';
  buttonTextColor?: string;
  buttonHoverColor?: string;
  navigationButtonBgColor?: string;
  navigationButtonTextColor?: string;

  // Borders & Spacing
  borderRadius: number;
  cardPadding?: number;
  optionSpacing?: number;

  // Images & Layout
  headerImage: string;
  logo: string;
  backgroundImage: string;
  backgroundPosition?: string;
  backgroundSize?: string;
  backgroundOpacity?: number;

  // Effects
  shadowIntensity?: number;
  hoverEffect?: boolean;
}

/**
 * Extended Theme Interface V2 with advanced features
 */
export interface ThemeV2 extends Theme {
  // Background Enhancements
  backgroundType?: 'image' | 'color' | 'gradient' | 'pattern';
  backgroundGradient?: GradientConfig;
  backgroundBlur?: number; // 0-50px
  backgroundOverlay?: BackgroundOverlay;
  backgroundPattern?: 'dots' | 'grid' | 'waves' | 'diagonal' | 'none';

  // Typography Enhancements
  lineHeight?: number; // 1.0-3.0
  letterSpacing?: number; // -2 to 4px
  textShadow?: string;
  headingFontFamily?: string; // Separate font for headings

  // Effects
  glowEffect?: GlowEffect;
  cardShadow?: string;
  hoverScale?: number; // 1.0-1.1

  // Advanced Color System
  colorPalette?: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    neutral: string[];
  };

  // Animation Settings
  animationSpeed?: 'slow' | 'normal' | 'fast';
  enableTransitions?: boolean;

  // Layout Enhancements
  containerMaxWidth?: number; // px
  questionSpacing?: number; // px between questions
  sectionSpacing?: number; // px between sections

  // Advanced Border Settings
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  borderWidth?: number; // 0-8px

  // Custom CSS
  customCSS?: string;
}

/**
 * Preset Template Interface
 */
export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'creative' | 'minimal' | 'bold';
  theme: Partial<ThemeV2>;
  thumbnail?: string; // Base64 or URL
  isPremium?: boolean;
}

/**
 * Theme History for Undo/Redo
 */
export interface ThemeHistoryEntry {
  theme: Partial<ThemeV2>;
  timestamp: number;
  action?: string; // Description of the change
}

/**
 * Color Palette Generation Options
 */
export interface ColorPaletteOptions {
  baseColor: string;
  shades?: number; // Number of lighter/darker shades
  includeComplementary?: boolean;
  includeAnalogous?: boolean;
  includeTriadic?: boolean;
}

/**
 * WCAG Contrast Check Result
 */
export interface ContrastCheckResult {
  ratio: number;
  levelAA: boolean;
  levelAAA: boolean;
  rating: 'fail' | 'AA' | 'AAA';
}

/**
 * Device Frame Options for Preview
 */
export type DeviceFrame = 'desktop' | 'tablet' | 'mobile' | 'fullscreen';

/**
 * Customization Section State
 */
export interface CustomizationSection {
  id: string;
  title: string;
  icon: string;
  isOpen: boolean;
  badge?: number | string;
}

/**
 * Default Theme V2 Values
 */
export const DEFAULT_THEME_V2: ThemeV2 = {
  // Base (from Theme)
  primaryColor: '#3b82f6',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  accentColor: '#8b5cf6',
  fontFamily: 'Inter, system-ui, sans-serif',
  questionFontSize: 18,
  optionFontSize: 16,
  questionFontWeight: 'semibold',
  buttonStyle: 'filled',
  borderRadius: 8,
  cardPadding: 24,
  optionSpacing: 12,
  headerImage: '',
  logo: '',
  backgroundImage: '',
  backgroundOpacity: 100,
  shadowIntensity: 2,
  hoverEffect: true,

  // V2 Enhancements
  backgroundType: 'color',
  backgroundBlur: 0,
  backgroundPattern: 'none',
  backgroundOverlay: {
    color: '#000000',
    opacity: 0,
  },
  lineHeight: 1.5,
  letterSpacing: 0,
  glowEffect: {
    enabled: false,
    color: '#3b82f6',
    intensity: 50,
  },
  animationSpeed: 'normal',
  enableTransitions: true,
  containerMaxWidth: 800,
  questionSpacing: 32,
  sectionSpacing: 48,
  borderStyle: 'solid',
  borderWidth: 1,
  hoverScale: 1.02,
};

/**
 * Utility type for partial theme updates
 */
export type ThemeUpdate = Partial<ThemeV2>;
