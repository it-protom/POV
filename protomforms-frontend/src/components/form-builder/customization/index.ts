/**
 * Form Customization V2 - Export Index
 * Modern, professional form customization system
 */

export { FormCustomizationV2 as default } from './FormCustomizationV2';
export { FormCustomizationV2 } from './FormCustomizationV2';
export { CustomizationSidebar } from './CustomizationSidebar';
export { PreviewCanvas } from './PreviewCanvas';
export { CategoryHeader } from './CategoryHeader';
export type { CategoryId } from './CategoryHeader';

// Controls
export { QuickActions } from './controls/QuickActions';
export { PresetsManager } from './controls/PresetsManager';
export { ColorSystemControls } from './controls/ColorSystemControls';
export { BackgroundControls } from './controls/BackgroundControls';
export { TypographyControls } from './controls/TypographyControls';
export { LayoutControls } from './controls/LayoutControls';
export { EffectsControls } from './controls/EffectsControls';

// Hooks
export { useThemeCustomization } from './hooks/useThemeCustomization';
export { usePresets } from './hooks/usePresets';
export { useColorSystem } from './hooks/useColorSystem';

// Types (re-export from types folder)
export type {
  ThemeV2,
  Theme,
  PresetTemplate,
  GradientConfig,
  BackgroundOverlay,
  GlowEffect,
  DeviceFrame,
  ContrastCheckResult,
  ColorPaletteOptions,
  ThemeUpdate,
} from '../../../types/theme';
