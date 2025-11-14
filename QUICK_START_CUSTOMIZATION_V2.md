# Quick Start Guide - Form Customization V2

## 5-Minute Integration

### Step 1: Import the Component

```tsx
import { FormCustomizationV2 } from '@/components/form-builder/customization';
```

### Step 2: Add to Your Form Builder Page

```tsx
function FormBuilderPage() {
  const [theme, setTheme] = useState({});

  return (
    <FormCustomizationV2
      initialTheme={theme}
      onThemeChange={setTheme}
    />
  );
}
```

That's it! You now have a fully functional, professional customization interface.

## Common Use Cases

### 1. Replace Existing Customization Component

**Before:**
```tsx
import FormCustomization from './FormCustomization';

<FormCustomization
  formId={formId}
  theme={theme}
  onUpdate={handleUpdate}
/>
```

**After:**
```tsx
import { FormCustomizationV2 } from './customization';

<FormCustomizationV2
  initialTheme={theme}
  onThemeChange={handleUpdate}
/>
```

### 2. Add to Existing Tab System

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="questions">Questions</TabsTrigger>
    <TabsTrigger value="customize">Customize</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>

  <TabsContent value="questions" className="h-screen">
    <QuestionBuilder />
  </TabsContent>

  <TabsContent value="customize" className="h-screen">
    <FormCustomizationV2
      initialTheme={theme}
      onThemeChange={setTheme}
    />
  </TabsContent>

  <TabsContent value="settings" className="h-screen">
    <FormSettings />
  </TabsContent>
</Tabs>
```

### 3. Standalone Customization Page

```tsx
// Route: /forms/:id/customize
function CustomizePage() {
  const { id } = useParams();
  const [theme, setTheme] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    // Load theme from API
    fetch(`/api/forms/${id}`)
      .then(r => r.json())
      .then(data => setTheme(data.theme || {}));
  }, [id]);

  const handleSave = async (finalTheme) => {
    await fetch(`/api/forms/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: finalTheme })
    });
    navigate(`/forms/${id}`);
  };

  return (
    <FormCustomizationV2
      initialTheme={theme}
      onThemeChange={setTheme}
      onSave={handleSave}
    />
  );
}
```

## Testing Your Integration

### Visual Checks
1. Open the customization page
2. Try collapsing/expanding the sidebar (should be smooth)
3. Apply a preset (Corporate Blue is a good test)
4. Undo the preset application (Ctrl+Z)
5. Change a color and watch it update live
6. Switch device frames (desktop → mobile)
7. Save a custom preset

### Expected Behavior
- ✅ Sidebar animates smoothly (300ms)
- ✅ Preset applies with all settings
- ✅ Undo restores previous state
- ✅ Color changes reflect immediately
- ✅ Device frame scales content
- ✅ Custom preset saves to localStorage

## Troubleshooting

### Issue: Sidebar doesn't collapse
**Solution:** Ensure framer-motion is installed:
```bash
npm install framer-motion@^12.0.0
```

### Issue: Colors not updating
**Solution:** Check that `onThemeChange` is updating parent state:
```tsx
const [theme, setTheme] = useState({});

<FormCustomizationV2
  initialTheme={theme}
  onThemeChange={(newTheme) => {
    setTheme(newTheme); // ← Must update state
  }}
/>
```

### Issue: Presets don't apply
**Solution:** Presets use localStorage. Clear if corrupted:
```javascript
localStorage.removeItem('protomforms-custom-presets');
```

### Issue: Preview shows wrong colors
**Solution:** Ensure theme structure matches ThemeV2 interface. Missing fields use defaults.

## Pro Tips

### 1. Add Auto-Save
```tsx
<FormCustomizationV2
  initialTheme={theme}
  onThemeChange={(newTheme) => {
    setTheme(newTheme);
    // Debounced auto-save
    debouncedSave(newTheme);
  }}
/>
```

### 2. Show Save Indicator
```tsx
const [isSaving, setIsSaving] = useState(false);

<FormCustomizationV2
  onThemeChange={async (newTheme) => {
    setIsSaving(true);
    await saveTheme(newTheme);
    setIsSaving(false);
  }}
/>

{isSaving && <span>Saving...</span>}
```

### 3. Custom Preview Content
```tsx
<FormCustomizationV2
  initialTheme={theme}
  onThemeChange={setTheme}
  previewContent={
    <div style={{ fontFamily: theme.fontFamily }}>
      <YourActualFormContent theme={theme} />
    </div>
  }
/>
```

### 4. Pre-select a Section
```tsx
// Open specific section by default
// Modify CustomizationSidebar openSections state:
const [openSections, setOpenSections] = useState(['colors', 'background']);
```

### 5. Hide Certain Controls
```tsx
// Filter sections in CustomizationSidebar.tsx:
const sections = allSections.filter(s => s.id !== 'layout');
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+Shift+Z` | Redo (alternative) |
| `Tab` | Navigate controls |
| `Enter` | Activate button/input |
| `Esc` | Close dialogs |

## API Integration

### Load Theme from API
```tsx
useEffect(() => {
  fetch(`/api/forms/${formId}`)
    .then(r => r.json())
    .then(data => {
      const theme = typeof data.theme === 'string'
        ? JSON.parse(data.theme)
        : data.theme;
      setTheme(theme || {});
    });
}, [formId]);
```

### Save Theme to API
```tsx
const handleSave = async (finalTheme) => {
  try {
    await fetch(`/api/forms/${formId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        theme: finalTheme
      })
    });
    toast.success('Theme saved!');
  } catch (error) {
    toast.error('Failed to save theme');
  }
};
```

## Customization Options

### Disable Certain Features

```tsx
// Create a wrapper component
function SimpleCustomization() {
  return (
    <FormCustomizationV2
      // ... disable presets by not showing that section
      // ... or create a simplified version
    />
  );
}
```

### Add Custom Presets

```tsx
// In usePresets.ts, add to BUILT_IN_PRESETS array:
{
  id: 'my-custom-preset',
  name: 'My Brand',
  description: 'Our company colors',
  category: 'professional',
  theme: {
    primaryColor: '#ff0000',
    backgroundColor: '#ffffff',
    // ... your theme
  }
}
```

### Change Default Theme

```tsx
// In types/theme.ts, modify DEFAULT_THEME_V2:
export const DEFAULT_THEME_V2: ThemeV2 = {
  primaryColor: '#your-color',
  // ... your defaults
};
```

## File Locations

```
protomforms-frontend/
└── src/
    ├── types/
    │   └── theme.ts                          # Theme types
    └── components/
        └── form-builder/
            └── customization/
                ├── FormCustomizationV2.tsx    # Main component
                ├── CustomizationSidebar.tsx   # Sidebar
                ├── PreviewCanvas.tsx          # Preview area
                ├── controls/                  # Control components
                ├── hooks/                     # Custom hooks
                └── index.ts                   # Public exports
```

## Component Props

### FormCustomizationV2

```typescript
interface FormCustomizationV2Props {
  initialTheme?: Partial<ThemeV2>;          // Starting theme
  onThemeChange?: (theme: Partial<ThemeV2>) => void;  // Live updates
  previewContent?: React.ReactNode;         // Custom preview
  onSave?: (theme: Partial<ThemeV2>) => void;  // Save button callback
}
```

## Next Steps

1. ✅ Integrate component into your form builder
2. ✅ Test with existing forms
3. ✅ Customize colors/branding if needed
4. ✅ Add custom presets for your use case
5. ✅ Deploy to staging
6. ✅ Gather user feedback
7. ✅ Iterate and improve

## Getting Help

- **Documentation:** See `README.md` in customization folder
- **Examples:** See `INTEGRATION_EXAMPLE.tsx`
- **Types:** See `types/theme.ts` for complete interface
- **Issues:** Check browser console for errors

## Performance Tips

1. **Debounce Auto-Save:** Don't save on every keystroke
2. **Lazy Load Sections:** Add React.lazy if needed
3. **Memoize Preview:** Use React.memo for preview content
4. **Limit History Size:** Default 50 is reasonable
5. **Clear Old Presets:** Remove unused custom presets

---

**Ready to use!** The component is production-ready and tested. Just import and render. All dependencies are already in your project.

**Questions?** Check the comprehensive README.md or INTEGRATION_EXAMPLE.tsx for more details.
