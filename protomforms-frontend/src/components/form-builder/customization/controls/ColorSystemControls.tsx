/**
 * ColorSystemControls Component
 * Intelligent color palette generation, harmony, and WCAG contrast checking
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  RefreshCw,
  Check,
  Copy,
  Droplet,
  Zap,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Info,
} from 'lucide-react';
import { ThemeV2 } from '../../../../types/theme';
import { useColorSystem } from '../hooks/useColorSystem';
import { Button } from '../../../ui/button';
import { Label } from '../../../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../../../ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/tabs';
import { Badge } from '../../../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';

interface ColorSystemControlsProps {
  theme: Partial<ThemeV2>;
  onUpdate: (updates: Partial<ThemeV2>) => void;
}

export function ColorSystemControls({ theme, onUpdate }: ColorSystemControlsProps) {
  const colorSystem = useColorSystem();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [showContrastInfo, setShowContrastInfo] = useState(false);

  // Generate color harmonies for current primary color
  const colorHarmony = useMemo(() => {
    if (!theme.primaryColor) return null;
    return colorSystem.generateHarmony(theme.primaryColor);
  }, [theme.primaryColor, colorSystem]);

  // Generate shades for primary color
  const primaryShades = useMemo(() => {
    if (!theme.primaryColor) return null;
    return colorSystem.generateShades(theme.primaryColor, 5);
  }, [theme.primaryColor, colorSystem]);

  // Check contrast ratios
  const primaryBackgroundContrast = useMemo(() => {
    if (!theme.primaryColor || !theme.backgroundColor) return null;
    return colorSystem.checkContrast(theme.primaryColor, theme.backgroundColor);
  }, [theme.primaryColor, theme.backgroundColor, colorSystem]);

  const textBackgroundContrast = useMemo(() => {
    if (!theme.textColor || !theme.backgroundColor) return null;
    return colorSystem.checkContrast(theme.textColor, theme.backgroundColor);
  }, [theme.textColor, theme.backgroundColor, colorSystem]);

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const handleColorChange = (key: keyof ThemeV2, value: string) => {
    onUpdate({ [key]: value });
  };

  const handleApplyHarmony = (type: 'complementary' | 'analogous' | 'triadic') => {
    if (!colorHarmony) return;

    switch (type) {
      case 'complementary':
        onUpdate({ accentColor: colorHarmony.complementary });
        break;
      case 'analogous':
        onUpdate({
          accentColor: colorHarmony.analogous[0],
          questionNumberBgColor: colorHarmony.analogous[1],
        });
        break;
      case 'triadic':
        onUpdate({
          accentColor: colorHarmony.triadic[0],
          questionNumberBgColor: colorHarmony.triadic[1],
        });
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Colors */}
      <div className="space-y-4">
        <h3 
          className="text-base font-bold flex items-center gap-2" 
          style={{ color: '#000000' }}
        >
          <Palette className="w-4 h-4" style={{ color: '#000000' }} />
          Colori Principali
        </h3>
        <p className="text-xs text-gray-600 -mt-2" style={{ color: '#6b7280' }}>
          Modifica questi colori e vedi l'effetto immediato nell'anteprima
        </p>

        <div className="space-y-3">
          <ColorPicker
            label="Primario (Numeri domande, pulsanti, stelle)"
            value={theme.primaryColor || '#3b82f6'}
            onChange={(value) => handleColorChange('primaryColor', value)}
            onCopy={handleCopyColor}
            isCopied={copiedColor === theme.primaryColor}
          />
          <ColorPicker
            label="Sfondo generale"
            value={theme.backgroundColor || '#ffffff'}
            onChange={(value) => handleColorChange('backgroundColor', value)}
            onCopy={handleCopyColor}
            isCopied={copiedColor === theme.backgroundColor}
          />
          <ColorPicker
            label="Testo generale"
            value={theme.textColor || '#1f2937'}
            onChange={(value) => handleColorChange('textColor', value)}
            onCopy={handleCopyColor}
            isCopied={copiedColor === theme.textColor}
          />
        </div>
      </div>

      {/* Color Shades - Info Card */}
      {primaryShades && (
        <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-200" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f3f4f6' }}>
              <Droplet className="w-5 h-5" style={{ color: '#6b7280' }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#000000' }}>
                Sfumature Colore Primario
            </h3>
              <p className="text-xs" style={{ color: '#6b7280' }}>
                Varianti più chiare e scure del tuo colore primario. Clicca per copiare.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium" style={{ color: '#6b7280' }}>Più chiaro</p>
          <div className="grid grid-cols-5 gap-2">
            {primaryShades.lighter.map((color, i) => (
              <ColorSwatch
                key={`lighter-${i}`}
                color={color}
                label={`+${(i + 1) * 10}`}
                onClick={() => handleCopyColor(color)}
                isCopied={copiedColor === color}
              />
            ))}
          </div>
            
            <p className="text-xs font-medium pt-2" style={{ color: '#6b7280' }}>Più scuro</p>
          <div className="grid grid-cols-5 gap-2">
            {primaryShades.darker.map((color, i) => (
              <ColorSwatch
                key={`darker-${i}`}
                color={color}
                label={`-${(i + 1) * 10}`}
                onClick={() => handleCopyColor(color)}
                isCopied={copiedColor === color}
              />
            ))}
            </div>
          </div>
        </div>
      )}

      {/* Contrast Checker - Info Card (Last) */}
      {(primaryBackgroundContrast || textBackgroundContrast) && (
        <>
          <div className="p-4 bg-white rounded-lg border border-gray-200" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold" style={{ color: '#000000' }}>
                    Verifica Accessibilità
          </h3>
                  <button
                    type="button"
                    onClick={() => setShowContrastInfo(true)}
                    className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors flex-shrink-0"
                    style={{ backgroundColor: '#e5e7eb' }}
                    title="Informazioni sul contrasto"
                  >
                    <Info className="w-3 h-3" style={{ color: '#6b7280' }} />
                  </button>
              </div>
                <p className="text-xs mb-3" style={{ color: '#4b5563' }}>
                  Controlla automaticamente se i colori hanno contrasto sufficiente per essere leggibili
                </p>
                
                <div className="space-y-2">
                  {textBackgroundContrast && (
                    <ContrastIndicator
                      label="Testo / Sfondo"
                      contrast={textBackgroundContrast}
                    />
                  )}
                  {primaryBackgroundContrast && (
                    <ContrastIndicator
                      label="Primario / Sfondo"
                      contrast={primaryBackgroundContrast}
                    />
                  )}
                  </div>
              </div>
            </div>
          </div>

          {/* Dialog Info Contrasto */}
          <Dialog open={showContrastInfo} onOpenChange={setShowContrastInfo}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-base">Controllo Contrasto</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 rounded bg-green-50" style={{ backgroundColor: '#f0fdf4' }}>
                    <div className="font-bold text-green-700" style={{ color: '#15803d' }}>WCAG AAA</div>
                    <div className="text-green-600 mt-1" style={{ color: '#16a34a' }}>≥ 7:1</div>
                  </div>
                  <div className="text-center p-2 rounded bg-yellow-50" style={{ backgroundColor: '#fefce8' }}>
                    <div className="font-bold text-yellow-700" style={{ color: '#a16207' }}>WCAG AA</div>
                    <div className="text-yellow-600 mt-1" style={{ color: '#ca8a04' }}>≥ 4.5:1</div>
                  </div>
                  <div className="text-center p-2 rounded bg-red-50" style={{ backgroundColor: '#fef2f2' }}>
                    <div className="font-bold text-red-700" style={{ color: '#dc2626' }}>Non Valido</div>
                    <div className="text-red-600 mt-1" style={{ color: '#ef4444' }}>&lt; 4.5:1</div>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 pt-2 border-t" style={{ borderColor: '#e5e7eb' }}>
                  <div className="flex items-start gap-2">
                    <span className="font-medium" style={{ color: '#000000' }}>•</span>
                    <span style={{ color: '#4b5563' }}>Più alto è il rapporto, migliore è la leggibilità</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium" style={{ color: '#000000' }}>•</span>
                    <span style={{ color: '#4b5563' }}>WCAG AA è il minimo consigliato per l'accessibilità</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Toggle Advanced Options Button */}
      <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs gap-2"
              >
          {showAdvanced ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Nascondi colori dettagliati
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Mostra colori dettagliati
            </>
          )}
              </Button>
        </div>

      {/* Advanced Options */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 overflow-hidden"
          >
            <div className="pt-4 border-t border-gray-200" style={{ borderColor: '#e5e7eb' }}>
              <h3 
                className="text-sm font-semibold mb-1" 
                style={{ color: '#000000' }}
              >
                Colori Dettagliati
              </h3>
              <p className="text-xs text-gray-600 mb-3" style={{ color: '#6b7280' }}>
                Personalizzazione avanzata per elementi specifici
              </p>

              <div className="space-y-3">
                <ColorPicker
                  label="Sfondo card domanda"
                  value={theme.questionBackgroundColor || '#f9fafb'}
                  onChange={(value) => handleColorChange('questionBackgroundColor', value)}
                  onCopy={handleCopyColor}
                  isCopied={copiedColor === theme.questionBackgroundColor}
                />
                <ColorPicker
                  label="Bordo card domanda"
                  value={theme.questionBorderColor || '#e5e7eb'}
                  onChange={(value) => handleColorChange('questionBorderColor', value)}
                  onCopy={handleCopyColor}
                  isCopied={copiedColor === theme.questionBorderColor}
                />
                <ColorPicker
                  label="Opzione selezionata (risposta scelta)"
                  value={theme.optionSelectedColor || '#dbeafe'}
                  onChange={(value) => handleColorChange('optionSelectedColor', value)}
                  onCopy={handleCopyColor}
                  isCopied={copiedColor === theme.optionSelectedColor}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Color Picker Component
 */
interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onCopy: (value: string) => void;
  isCopied: boolean;
}

function ColorPicker({ label, value, onChange, onCopy, isCopied }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  // Sincronizza tempValue quando value cambia esternamente
  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleColorChange = (newValue: string) => {
    setTempValue(newValue);
    onChange(newValue);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setTempValue(newValue);
    // Valida e applica solo se è un colore valido
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(value);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 relative overflow-hidden group hover:border-gray-400 dark:hover:border-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            style={{ backgroundColor: value }}
            aria-label={`Seleziona colore ${label}`}
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjY2NjIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNjY2MiLz48L3N2Zz4=')] opacity-20" />
            <span className="absolute bottom-1 right-1 text-[10px] font-mono bg-black/50 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              {value}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-72 p-4 bg-white border-gray-200 shadow-lg" 
          align="start"
          side="bottom"
          sideOffset={8}
          style={{ backgroundColor: '#ffffff', color: '#000000' }}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Previeni la chiusura quando si clicca sul selettore di colore nativo
            const target = e.target as HTMLElement;
            if (target?.closest('input[type="color"]')) {
              e.preventDefault();
            }
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative">
              <input
                type="color"
                  value={tempValue}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-16 h-16 rounded-md cursor-pointer border-2 border-gray-300"
                  style={{ 
                    backgroundColor: tempValue,
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none',
                  }}
                />
              </div>
              <div className="flex-1 space-y-2">
              <input
                type="text"
                  value={tempValue}
                  onChange={handleTextChange}
                  onBlur={() => {
                    // Valida e correggi il valore quando perde il focus
                    if (!/^#[0-9A-Fa-f]{6}$/.test(tempValue)) {
                      setTempValue(value);
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-md font-mono bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{ backgroundColor: '#ffffff', color: '#000000' }}
                  placeholder="#000000"
                  pattern="^#[0-9A-Fa-f]{6}$"
              />
                <div className="text-xs text-gray-600" style={{ color: '#4b5563' }}>
                  Formato: #RRGGBB
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="shrink-0 h-10 w-10 p-0 hover:bg-gray-100"
                title="Copia colore"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-700" />
                )}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Color Swatch Component
 */
interface ColorSwatchProps {
  color: string;
  label?: string;
  onClick: () => void;
  isCopied: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function ColorSwatch({ color, label, onClick, isCopied, size = 'sm' }: ColorSwatchProps) {
  const sizeClasses = {
    sm: 'h-10',
    md: 'h-12',
    lg: 'h-14',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`${sizeClasses[size]} w-full rounded-md border border-gray-300 dark:border-gray-600 relative overflow-hidden group`}
      style={{ backgroundColor: color }}
      title={`${color} - Clicca per copiare`}
    >
      {label && (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference">
          {label}
        </span>
      )}
      <AnimatePresence>
        {isCopied && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 bg-green-500 flex items-center justify-center"
          >
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/**
 * Contrast Indicator Component
 */
interface ContrastIndicatorProps {
  label: string;
  contrast: {
    ratio: number;
    levelAA: boolean;
    levelAAA: boolean;
    rating: 'fail' | 'AA' | 'AAA';
  };
}

function ContrastIndicator({ label, contrast }: ContrastIndicatorProps) {
  const ratingColors = {
    fail: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    AA: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    AAA: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Rapporto: {contrast.ratio}:1
        </p>
      </div>
      <Badge className={`${ratingColors[contrast.rating]} text-xs font-bold`}>
        {contrast.rating === 'fail' ? 'Non Valido' : `WCAG ${contrast.rating}`}
      </Badge>
    </div>
  );
}
