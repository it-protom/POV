# Form Customization V2 - Architecture Diagram

## Component Tree

```
FormCustomizationV2 (Main Container)
├── CustomizationSidebar (Left Panel - 280px/60px)
│   ├── Header
│   │   ├── Title ("Customize")
│   │   └── Collapse Button
│   │
│   ├── Search Bar
│   │   └── Input with clear button
│   │
│   ├── Quick Actions Bar
│   │   ├── Undo Button (Ctrl+Z)
│   │   ├── Redo Button (Ctrl+Y)
│   │   ├── Reset Button
│   │   └── Save Preset Button (opens dialog)
│   │
│   └── Accordion Sections
│       ├── [Section 1] Preset Templates
│       │   ├── Search Bar
│       │   ├── Category Filter Buttons
│       │   └── Preset Grid
│       │       ├── PresetCard (Corporate Blue)
│       │       ├── PresetCard (Modern Minimal)
│       │       ├── PresetCard (Creative Bold)
│       │       ├── PresetCard (Dark Elegant)
│       │       ├── PresetCard (Nature Green)
│       │       ├── PresetCard (Tech Purple)
│       │       ├── PresetCard (Warm Sunset)
│       │       ├── PresetCard (Classic Formal)
│       │       └── [Custom Presets...]
│       │
│       ├── [Section 2] Colors & Palette
│       │   ├── Main Colors Grid (2x2)
│       │   │   ├── Primary Color Picker
│       │   │   ├── Background Color Picker
│       │   │   ├── Text Color Picker
│       │   │   └── Accent Color Picker
│       │   ├── Contrast Checker
│       │   │   ├── Text/Background Ratio
│       │   │   └── Primary/Background Ratio
│       │   ├── Primary Shades Grid
│       │   │   ├── Lighter Shades (5)
│       │   │   └── Darker Shades (5)
│       │   ├── Color Harmony Tabs
│       │   │   ├── Complementary Tab
│       │   │   ├── Analogous Tab
│       │   │   └── Triadic Tab
│       │   └── Advanced Component Colors (collapsible)
│       │
│       ├── [Section 3] Background
│       │   ├── Type Selector Tabs
│       │   │   ├── Color Tab
│       │   │   │   └── Color Picker
│       │   │   ├── Image Tab
│       │   │   │   ├── Upload Area (drag-drop)
│       │   │   │   ├── Size Select
│       │   │   │   ├── Position Select
│       │   │   │   └── Opacity Slider
│       │   │   ├── Gradient Tab
│       │   │   │   ├── Type Select (linear/radial)
│       │   │   │   ├── Angle Slider
│       │   │   │   ├── Color Stops (2-5)
│       │   │   │   └── Preview
│       │   │   └── Pattern Tab
│       │   │       └── Pattern Grid (dots/grid/waves/diagonal)
│       │   ├── Blur Slider (0-50px)
│       │   └── Overlay Controls
│       │       ├── Color Picker
│       │       └── Opacity Slider
│       │
│       ├── [Section 4] Typography
│       │   ├── Font Family Tabs
│       │   │   ├── Body Text Tab
│       │   │   │   ├── Font Select (11 options)
│       │   │   │   └── Preview Text
│       │   │   └── Headings Tab
│       │   │       ├── Font Select
│       │   │       └── Preview Heading
│       │   ├── Font Sizes
│       │   │   ├── Question Size Slider
│       │   │   └── Option Size Slider
│       │   ├── Font Weight Select
│       │   └── Advanced Typography
│       │       ├── Line Height Slider
│       │       ├── Letter Spacing Slider
│       │       └── Live Preview Block
│       │
│       ├── [Section 5] Layout & Spacing
│       │   ├── Border Radius Slider
│       │   ├── Card Padding Slider
│       │   ├── Question Spacing Slider
│       │   └── Option Spacing Slider
│       │
│       └── [Section 6] Buttons & Effects
│           ├── Button Style Toggle (filled/outlined)
│           ├── Hover Scale Slider
│           └── Animation Speed Buttons (slow/normal/fast)
│
└── PreviewCanvas (Right Panel - Flexible)
    ├── Top Toolbar
    │   ├── Device Frame Buttons
    │   │   ├── Desktop Button
    │   │   ├── Tablet Button
    │   │   ├── Mobile Button
    │   │   └── Fullscreen Button
    │   └── Zoom Controls
    │       ├── Zoom Out Button (-)
    │       ├── Zoom Percentage (click to reset)
    │       └── Zoom In Button (+)
    │
    ├── Preview Area (scrollable)
    │   ├── Device Frame Border (if tablet/mobile)
    │   └── Form Preview
    │       ├── Background Layer (image/gradient/pattern)
    │       ├── Blur Layer (if enabled)
    │       ├── Overlay Layer (if enabled)
    │       ├── Pattern Layer (if enabled)
    │       └── Content Layer
    │           ├── Form Header
    │           │   ├── Title (with theme styles)
    │           │   └── Description
    │           └── Questions
    │               ├── Question Card 1
    │               │   ├── Number Badge
    │               │   ├── Question Text
    │               │   └── Options (radio/text/etc)
    │               ├── Question Card 2
    │               └── Submit Button
    │
    └── Bottom Status Bar
        ├── Device Info
        └── Zoom Info

[Floating Elements]
├── Save Indicator (bottom-right, appears on save)
└── Keyboard Shortcuts Hint (bottom-center)
```

## Data Flow

```
User Interaction
      ↓
UI Component (Button/Slider/Input)
      ↓
Event Handler
      ↓
updateTheme() with partial theme
      ↓
Debounce Timer (300ms)
      ↓
useThemeCustomization Hook
      ↓
┌─────────────────────────────────┐
│ 1. Update theme state           │
│ 2. Add to history (undo/redo)   │
│ 3. Call onThemeChange callback  │
└─────────────────────────────────┘
      ↓
Parent Component (FormCustomizationV2)
      ↓
PreviewCanvas receives new theme
      ↓
Preview Re-renders with Applied Styles
```

## State Management Flow

```
┌─────────────────────────────────────────────────┐
│ FormCustomizationV2 (Container)                 │
├─────────────────────────────────────────────────┤
│ State:                                          │
│ - isSidebarCollapsed: boolean                   │
│ - deviceFrame: 'desktop' | 'tablet' | 'mobile'  │
│ - showSaveIndicator: boolean                    │
│                                                 │
│ Hooks:                                          │
│ - useThemeCustomization()                       │
│   ├── theme: Partial<ThemeV2>                   │
│   ├── updateTheme: (updates) => void            │
│   ├── setTheme: (theme) => void                 │
│   ├── resetTheme: () => void                    │
│   ├── undo: () => void                          │
│   ├── redo: () => void                          │
│   ├── canUndo: boolean                          │
│   ├── canRedo: boolean                          │
│   ├── isDirty: boolean                          │
│   └── history: ThemeHistoryEntry[]              │
│                                                 │
│ - usePresets()                                  │
│   ├── presets: PresetTemplate[]                 │
│   ├── customPresets: PresetTemplate[]           │
│   ├── applyPreset: (id) => theme                │
│   ├── saveCustomPreset: (name, desc) => void    │
│   └── deleteCustomPreset: (id) => void          │
└─────────────────────────────────────────────────┘
            │                          │
            │                          │
            ↓                          ↓
┌──────────────────────┐    ┌──────────────────────┐
│ CustomizationSidebar │    │    PreviewCanvas     │
├──────────────────────┤    ├──────────────────────┤
│ Props:               │    │ Props:               │
│ - theme              │    │ - theme              │
│ - onThemeUpdate      │    │ - deviceFrame        │
│ - canUndo/canRedo    │    │ - children           │
│ - onUndo/onRedo      │    └──────────────────────┘
│ - presets            │
│ - onApplyPreset      │
│                      │
│ Internal State:      │
│ - searchQuery        │
│ - openSections[]     │
└──────────────────────┘
```

## Hook Architecture

```
useThemeCustomization
├── State
│   ├── theme (current)
│   ├── history (array of themes)
│   └── historyIndex (position in history)
│
├── Refs
│   ├── debounceTimer
│   └── pendingUpdates
│
└── Functions
    ├── updateTheme() - debounced
    ├── setTheme() - immediate
    ├── resetTheme()
    ├── undo() - go back in history
    └── redo() - go forward in history

useColorSystem
└── Pure Functions (no state)
    ├── generateShades()
    ├── generateHarmony()
    ├── checkContrast()
    ├── hexToRgb()
    ├── rgbToHex()
    ├── rgbToHsl()
    ├── hslToRgb()
    ├── lighten()
    ├── darken()
    ├── adjustSaturation()
    └── isValidColor()

usePresets
├── State
│   └── customPresets (from localStorage)
│
├── Computed
│   └── presets (built-in + custom)
│
└── Functions
    ├── applyPreset()
    ├── saveCustomPreset()
    └── deleteCustomPreset()
```

## Animation Flow

```
User Action (e.g., click preset)
      ↓
State Change Triggered
      ↓
┌─────────────────────────────────┐
│ Framer Motion Detects Change    │
└─────────────────────────────────┘
      ↓
┌─────────────────────────────────┐
│ Animation Phase 1: Exit          │
│ - Old content fades out          │
│ - Duration: 200ms                │
│ - Easing: easeIn                 │
└─────────────────────────────────┘
      ↓
DOM Update (React re-render)
      ↓
┌─────────────────────────────────┐
│ Animation Phase 2: Enter         │
│ - New content fades in           │
│ - Duration: 300ms                │
│ - Easing: easeOut                │
└─────────────────────────────────┘
      ↓
Animation Complete
```

## File Dependencies

```
FormCustomizationV2.tsx
├── imports CustomizationSidebar
├── imports PreviewCanvas
├── imports useThemeCustomization
├── imports usePresets
└── imports ThemeV2 types

CustomizationSidebar.tsx
├── imports QuickActions
├── imports PresetsManager
├── imports ColorSystemControls
├── imports BackgroundControls
├── imports TypographyControls
└── imports UI components (Accordion, ScrollArea, etc.)

PreviewCanvas.tsx
├── imports ThemeV2 types
├── imports UI components (Button)
└── imports Lucide icons

QuickActions.tsx
├── imports UI components (Button, Dialog, Input, Textarea)
└── imports ThemeV2 types

PresetsManager.tsx
├── imports PresetTemplate types
├── imports UI components (Badge, AlertDialog, Input)
└── imports Lucide icons

ColorSystemControls.tsx
├── imports useColorSystem
├── imports ThemeV2 types
└── imports UI components (Popover, Tabs, Slider)

BackgroundControls.tsx
├── imports ThemeV2 types
└── imports UI components (Tabs, Slider, Select, Input)

TypographyControls.tsx
├── imports ThemeV2 types
└── imports UI components (Tabs, Slider, Select)

useThemeCustomization.ts
├── imports ThemeV2, ThemeUpdate types
└── uses React hooks (useState, useCallback, useEffect, useRef)

useColorSystem.ts
├── imports ContrastCheckResult type
└── uses React hooks (useMemo, useCallback)

usePresets.ts
├── imports PresetTemplate, ThemeV2 types
└── uses React hooks (useState, useCallback, useMemo)
```

## External Dependencies

```
Required (already installed):
├── react (18.x)
├── react-dom (18.x)
├── framer-motion (12.23.24)
├── lucide-react (icons)
├── @radix-ui/* (47 components)
│   ├── @radix-ui/react-accordion
│   ├── @radix-ui/react-alert-dialog
│   ├── @radix-ui/react-dialog
│   ├── @radix-ui/react-popover
│   ├── @radix-ui/react-select
│   ├── @radix-ui/react-slider
│   ├── @radix-ui/react-tabs
│   └── @radix-ui/react-scroll-area
├── tailwindcss (3.4.18)
└── sonner (toast notifications)

No additional dependencies needed!
```

## Interaction Patterns

### Pattern 1: Color Picker Interaction
```
User clicks color swatch
      ↓
Popover opens with color picker
      ↓
User selects new color
      ↓
updateTheme({ primaryColor: newColor })
      ↓
Preview updates immediately
      ↓
After 300ms: History entry added
```

### Pattern 2: Preset Application
```
User clicks preset card
      ↓
setTheme(preset.theme) - immediate
      ↓
All controls update to show new values
      ↓
Preview morphs to new theme (500ms animation)
      ↓
History entry added
      ↓
User can undo to previous theme
```

### Pattern 3: Undo/Redo
```
User presses Ctrl+Z
      ↓
historyIndex decremented
      ↓
theme = history[newIndex]
      ↓
All controls update
      ↓
Preview updates (no animation, instant)
      ↓
onThemeChange callback fires
```

### Pattern 4: Sidebar Collapse
```
User clicks collapse button
      ↓
isSidebarCollapsed = !isSidebarCollapsed
      ↓
Framer Motion animates width (300ms)
      ↓
Content fades out/in (200ms)
      ↓
Icon mode shows/hides
```

## Browser Storage

```
localStorage
├── 'protomforms-custom-presets'
│   └── Array<PresetTemplate>
│       ├── Custom preset 1
│       ├── Custom preset 2
│       └── ...
│
└── (Future: could add)
    ├── 'protomforms-recent-colors'
    ├── 'protomforms-ui-preferences'
    └── 'protomforms-theme-drafts'
```

## Performance Considerations

```
Optimization Strategies:
├── Debouncing (300ms)
│   └── Prevents excessive theme updates
│
├── Memoization
│   ├── useMemo for color harmonies
│   ├── useMemo for color shades
│   └── useMemo for filtered presets
│
├── Callback Stability
│   ├── useCallback for event handlers
│   └── Prevents unnecessary re-renders
│
├── Lazy Evaluation
│   ├── Color harmony only calculated when needed
│   └── Shades only calculated when color changes
│
└── Efficient DOM Updates
    ├── Framer Motion uses transform (GPU)
    └── CSS variables for theme properties
```

---

This architecture supports:
- ✅ Modular, maintainable code
- ✅ Easy testing (hooks are pure functions)
- ✅ Performance (debouncing, memoization)
- ✅ Extensibility (add new sections/controls easily)
- ✅ Type safety (full TypeScript coverage)
- ✅ User experience (smooth animations, instant feedback)
