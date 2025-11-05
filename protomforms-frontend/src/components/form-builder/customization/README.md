# Form Customization V2

Modern, professional form customization system for ProtomForms with "wow factor" design and intelligent features.

## Overview

FormCustomizationV2 is a complete reimagining of the form customization experience, featuring:

- **Collapsible Sidebar Layout** (280px → 60px) with central preview canvas
- **8 Professional Presets** (Corporate Blue, Modern Minimal, Creative Bold, etc.)
- **Intelligent Color System** with palette generation, harmony suggestions, and WCAG contrast checking
- **Advanced Background Controls** (image, gradient, patterns, blur, overlay)
- **Modern Typography Controls** with live previews
- **Undo/Redo System** with keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- **Device Preview Modes** (desktop, tablet, mobile, fullscreen)
- **Smooth Animations** using Framer Motion
- **Search Functionality** to find controls quickly

## Architecture

```
customization/
├── FormCustomizationV2.tsx          # Main container component
├── CustomizationSidebar.tsx         # Collapsible sidebar with sections
├── PreviewCanvas.tsx                # Central preview with device frames
├── controls/
│   ├── QuickActions.tsx             # Undo/Redo/Reset/Save
│   ├── PresetsManager.tsx           # Template presets grid
│   ├── ColorSystemControls.tsx      # Intelligent color palette
│   ├── BackgroundControls.tsx       # Advanced background options
│   └── TypographyControls.tsx       # Font and text styling
├── hooks/
│   ├── useThemeCustomization.ts     # Theme state + history
│   ├── usePresets.ts                # Preset management
│   └── useColorSystem.ts            # Color utilities + WCAG
└── index.ts                         # Public exports
```

## Usage

### Basic Implementation

```tsx
import { FormCustomizationV2 } from '@/components/form-builder/customization';

function FormBuilder() {
  const [theme, setTheme] = useState<Partial<ThemeV2>>({});

  return (
    <FormCustomizationV2
      initialTheme={theme}
      onThemeChange={setTheme}
      onSave={(finalTheme) => {
        console.log('Save theme:', finalTheme);
      }}
    />
  );
}
```

### With Custom Preview Content

```tsx
<FormCustomizationV2
  initialTheme={existingTheme}
  onThemeChange={handleThemeChange}
  previewContent={
    <YourCustomFormPreview theme={theme} />
  }
/>
```

## Features

### 1. Preset Templates

8 built-in professional themes:

- **Corporate Blue** - Professional, trustworthy for business
- **Modern Minimal** - Clean, spacious black & white
- **Creative Bold** - Vibrant colors, engaging
- **Dark Elegant** - Sophisticated dark mode with gold
- **Nature Green** - Calming, eco-friendly
- **Tech Purple** - Modern tech with gradients
- **Warm Sunset** - Inviting orange/pink gradient
- **Classic Formal** - Traditional serif design

Users can also save custom presets.

### 2. Intelligent Color System

- **Auto-generate color shades** (5 lighter, 5 darker)
- **Color harmony suggestions** (complementary, analogous, triadic)
- **WCAG contrast checker** with AA/AAA ratings
- **Quick apply** harmony colors to theme
- **Copy to clipboard** for any color

### 3. Advanced Background Controls

- **4 Background Types:**
  - Solid Color
  - Image Upload (with position/size/opacity controls)
  - Gradient (linear/radial with multiple color stops)
  - Patterns (dots, grid, waves, diagonal)
- **Blur Effect** (0-50px)
- **Overlay** with color and opacity
- **Live Preview** of all changes

### 4. Typography Controls

- **Font Family Selection** (11 fonts including system, sans, serif, mono)
- **Separate Heading Font** option
- **Font Sizes** for questions and options
- **Font Weight** control
- **Line Height** (1.0-3.0)
- **Letter Spacing** (-2 to 4px)
- **Live Preview** with sample text

### 5. Layout & Spacing

- Border Radius (0-24px)
- Card Padding (12-48px)
- Question Spacing (16-64px)
- Option Spacing (4-24px)
- Container Max Width

### 6. Button & Effects

- Button Style (filled/outlined)
- Hover Scale (1.0-1.1)
- Animation Speed (slow/normal/fast)
- Glow Effects
- Transition Controls

## Theme Structure

The extended theme interface (`ThemeV2`) includes:

```typescript
interface ThemeV2 {
  // Base Colors
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;

  // Typography
  fontFamily: string;
  headingFontFamily?: string;
  questionFontSize: number;
  optionFontSize: number;
  questionFontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  lineHeight: number;
  letterSpacing: number;

  // Background
  backgroundType: 'image' | 'color' | 'gradient' | 'pattern';
  backgroundImage: string;
  backgroundGradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    angle?: number;
  };
  backgroundBlur: number;
  backgroundOverlay?: {
    color: string;
    opacity: number;
  };
  backgroundPattern?: 'dots' | 'grid' | 'waves' | 'diagonal' | 'none';

  // Layout
  borderRadius: number;
  cardPadding: number;
  questionSpacing: number;
  optionSpacing: number;
  containerMaxWidth: number;

  // Effects
  buttonStyle: 'filled' | 'outlined';
  hoverScale: number;
  animationSpeed: 'slow' | 'normal' | 'fast';
  glowEffect?: {
    enabled: boolean;
    color: string;
    intensity: number;
  };

  // ... and more (see types/theme.ts for complete interface)
}
```

## Hooks

### useThemeCustomization

Manages theme state with undo/redo history:

```typescript
const {
  theme,              // Current theme
  updateTheme,        // Debounced update (300ms)
  setTheme,           // Immediate update
  resetTheme,         // Reset to initial
  undo,               // Undo last change
  redo,               // Redo last undo
  canUndo,            // Boolean flag
  canRedo,            // Boolean flag
  isDirty,            // Has unsaved changes
  history,            // Full history array
} = useThemeCustomization({
  initialTheme,
  onThemeChange: (theme) => console.log('Changed:', theme),
  debounceMs: 300,
  maxHistorySize: 50,
});
```

### useColorSystem

Color utilities and WCAG contrast checking:

```typescript
const {
  generateShades,      // (color, count) => { base, lighter[], darker[] }
  generateHarmony,     // (color) => { complementary, analogous, triadic }
  checkContrast,       // (fg, bg) => { ratio, levelAA, levelAAA, rating }
  hexToRgb,            // Hex → RGB conversion
  rgbToHex,            // RGB → Hex conversion
  lighten,             // (color, amount) => lightened color
  darken,              // (color, amount) => darkened color
  adjustSaturation,    // (color, amount) => adjusted color
  isValidColor,        // (color) => boolean
} = useColorSystem();
```

### usePresets

Manage preset templates:

```typescript
const {
  presets,             // All presets (built-in + custom)
  customPresets,       // User's custom presets
  applyPreset,         // (id) => theme | null
  saveCustomPreset,    // (name, desc, theme) => void
  deleteCustomPreset,  // (id) => void
} = usePresets();
```

## Keyboard Shortcuts

- **Ctrl+Z** / **Cmd+Z** - Undo
- **Ctrl+Y** / **Cmd+Y** - Redo
- **Ctrl+Shift+Z** / **Cmd+Shift+Z** - Redo (alternative)

## Design Principles

### Visual Style

- **No Gradients in UI** (solid colors only for interface)
- **No Shadows in UI** (borders and spacing for depth)
- **Smooth Animations** (fade-in/out with ease-in-out)
- **Backdrop Blur** for focused elements
- **Professional Polish** (every detail matters)

### Animation Guidelines

```typescript
// Standard fade-in
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: 0.3, ease: 'easeInOut' }}

// With scale for emphasis
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ duration: 0.3, ease: 'easeOut' }}

// Staggered children
variants={{
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }
}}
```

### Colors (UI Interface)

```css
/* Sidebar */
bg-white dark:bg-gray-900
backdrop-blur-xl bg-opacity-95

/* Accent */
blue-600 (primary actions)
blue-700 (hover states)

/* Text */
gray-900 dark:gray-100 (primary)
gray-600 dark:gray-400 (secondary)
gray-400 dark:gray-600 (muted)
```

## Performance

- **Debounced Updates** (300ms) to prevent excessive re-renders
- **Memoized Values** for expensive calculations (color harmonies, shades)
- **React.memo** for preview content
- **Lazy Loading** for control sections

## Migration from V1

The old `FormCustomization.tsx` component remains for backwards compatibility. To migrate:

```typescript
// Old
import FormCustomization from '@/components/form-builder/FormCustomization';

// New
import { FormCustomizationV2 } from '@/components/form-builder/customization';

// The theme structure is backwards compatible
// Additional V2 fields are optional
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires support for:
  - CSS Grid
  - CSS Variables
  - Backdrop Filter
  - ES2020 features

## Future Enhancements

Potential additions:

- [ ] Import/Export theme as JSON
- [ ] More preset templates
- [ ] Animation preset builder
- [ ] Custom CSS editor with syntax highlighting
- [ ] A/B testing for themes
- [ ] Theme marketplace
- [ ] Accessibility audit tool
- [ ] Mobile-optimized controls (drawer)
- [ ] Real-time collaboration
- [ ] Theme versioning

## Troubleshooting

### Sidebar not collapsing

Check that Framer Motion is installed:
```bash
npm install framer-motion@^12.0.0
```

### Colors not updating in preview

Ensure `onThemeChange` callback is provided and updating parent state.

### Undo/Redo not working

Keyboard shortcuts require the component to be mounted. Check browser console for errors.

### Preview showing wrong device size

Device frame state is internal. Pass `deviceFrame` prop to override.

## Contributing

When adding new controls:

1. Create component in `controls/` folder
2. Add to `CustomizationSidebar` sections array
3. Update `ThemeV2` interface if adding new theme properties
4. Add keywords for search functionality
5. Include live preview where applicable
6. Follow animation guidelines
7. Test undo/redo functionality

## License

Part of ProtomForms project. See project root for license information.
