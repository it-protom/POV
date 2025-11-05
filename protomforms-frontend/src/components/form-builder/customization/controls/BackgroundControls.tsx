/**
 * BackgroundControls Component
 * Advanced background customization: image, color, gradient, blur, overlay, patterns
 */

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Palette,
  Waves,
  Grid3x3,
  Upload,
  X,
} from 'lucide-react';
import { ThemeV2 } from '../../../../types/theme';
import { Button } from '../../../ui/button';
import { Label } from '../../../ui/label';
import { Slider } from '../../../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/tabs';
import { Input } from '../../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';

interface BackgroundControlsProps {
  theme: Partial<ThemeV2>;
  onUpdate: (updates: Partial<ThemeV2>) => void;
}

export function BackgroundControls({ theme, onUpdate }: BackgroundControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const backgroundType = theme.backgroundType || 'color';

  const handleTypeChange = (type: 'color' | 'image' | 'gradient' | 'pattern') => {
    // Pulisci le proprietà degli altri tipi di background quando si cambia tipo
    const updates: Partial<ThemeV2> = { backgroundType: type };
    
    if (type === 'color') {
      updates.backgroundImage = undefined;
      updates.backgroundGradient = undefined;
      updates.backgroundPattern = undefined;
    } else if (type === 'image') {
      updates.backgroundGradient = undefined;
      updates.backgroundPattern = undefined;
    } else if (type === 'gradient') {
      updates.backgroundImage = undefined;
      updates.backgroundPattern = undefined;
    } else if (type === 'pattern') {
      updates.backgroundImage = undefined;
      updates.backgroundGradient = undefined;
    }
    
    onUpdate(updates);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        onUpdate({
          backgroundImage: imageUrl,
          backgroundType: 'image',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGradientChange = (updates: Partial<ThemeV2['backgroundGradient']>) => {
    onUpdate({
      backgroundGradient: {
        ...theme.backgroundGradient,
        ...updates,
      } as ThemeV2['backgroundGradient'],
    });
  };

  const addGradientColor = () => {
    const currentColors = theme.backgroundGradient?.colors || ['#3b82f6', '#8b5cf6'];
    onUpdate({
      backgroundGradient: {
        ...(theme.backgroundGradient || { type: 'linear', angle: 135 }),
        colors: [...currentColors, '#10b981'],
      },
    });
  };

  const removeGradientColor = (index: number) => {
    const currentColors = theme.backgroundGradient?.colors || [];
    if (currentColors.length > 2) {
      onUpdate({
        backgroundGradient: {
          ...theme.backgroundGradient!,
          colors: currentColors.filter((_, i) => i !== index),
        },
      });
    }
  };

  const updateGradientColor = (index: number, color: string) => {
    const currentColors = [...(theme.backgroundGradient?.colors || [])];
    currentColors[index] = color;
    onUpdate({
      backgroundGradient: {
        ...theme.backgroundGradient!,
        colors: currentColors,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Background Type Selector */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Tipo di Sfondo</Label>
        <Tabs value={backgroundType} onValueChange={(value) => handleTypeChange(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="color" className="text-xs">
              <Palette className="w-3 h-3 mr-1" />
              Colore
            </TabsTrigger>
            <TabsTrigger value="image" className="text-xs">
              <ImageIcon className="w-3 h-3 mr-1" />
              Immagine
            </TabsTrigger>
            <TabsTrigger value="gradient" className="text-xs">
              <Waves className="w-3 h-3 mr-1" />
              Gradiente
            </TabsTrigger>
            <TabsTrigger value="pattern" className="text-xs">
              <Grid3x3 className="w-3 h-3 mr-1" />
              Pattern
            </TabsTrigger>
          </TabsList>

          {/* Color Background */}
          <TabsContent value="color" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-xs">Colore di Sfondo</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.backgroundColor || '#ffffff'}
                  onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                />
                <Input
                  value={theme.backgroundColor || '#ffffff'}
                  onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </TabsContent>

          {/* Image Background */}
          <TabsContent value="image" className="space-y-4 mt-4">
            <div className="space-y-3">
              {/* Upload Area */}
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {theme.backgroundImage ? (
                  <div className="relative">
                    <img
                      src={theme.backgroundImage}
                      alt="Background"
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdate({ 
                          backgroundImage: undefined, 
                          backgroundType: 'color',
                          backgroundGradient: undefined,
                          backgroundPattern: undefined,
                        });
                      }}
                      className="absolute top-2 right-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Clicca per caricare o trascina e rilascia
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, WEBP fino a 5MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Image Settings */}
              {theme.backgroundImage && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Dimensione</Label>
                      <Select
                        value={theme.backgroundSize || 'cover'}
                        onValueChange={(value) => onUpdate({ backgroundSize: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cover">Copri</SelectItem>
                          <SelectItem value="contain">Contieni</SelectItem>
                          <SelectItem value="auto">Automatico</SelectItem>
                          <SelectItem value="100% 100%">Allunga</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Posizione</Label>
                      <Select
                        value={theme.backgroundPosition || 'center'}
                        onValueChange={(value) => onUpdate({ backgroundPosition: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="center">Centro</SelectItem>
                          <SelectItem value="top">Alto</SelectItem>
                          <SelectItem value="bottom">Basso</SelectItem>
                          <SelectItem value="left">Sinistra</SelectItem>
                          <SelectItem value="right">Destra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Opacità</Label>
                      <span className="text-xs text-gray-500">{theme.backgroundOpacity || 100}%</span>
                    </div>
                    <Slider
                      value={[theme.backgroundOpacity || 100]}
                      onValueChange={([value]) => onUpdate({ backgroundOpacity: value })}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Gradient Background */}
          <TabsContent value="gradient" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Gradient Type */}
              <div className="space-y-2">
                <Label className="text-xs">Tipo di Gradiente</Label>
                <Select
                  value={theme.backgroundGradient?.type || 'linear'}
                  onValueChange={(value: 'linear' | 'radial') =>
                    handleGradientChange({ type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Lineare</SelectItem>
                    <SelectItem value="radial">Radiale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Angle (Linear only) */}
              {theme.backgroundGradient?.type === 'linear' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Angolo</Label>
                    <span className="text-xs text-gray-500">
                      {theme.backgroundGradient?.angle || 135}°
                    </span>
                  </div>
                  <Slider
                    value={[theme.backgroundGradient?.angle || 135]}
                    onValueChange={([value]) => handleGradientChange({ angle: value })}
                    min={0}
                    max={360}
                    step={15}
                  />
                </div>
              )}

              {/* Color Stops */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Colori</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addGradientColor}
                    className="h-auto py-1 px-2 text-xs"
                    disabled={(theme.backgroundGradient?.colors?.length || 0) >= 5}
                  >
                    Aggiungi Colore
                  </Button>
                </div>

                <div className="space-y-2">
                  {(theme.backgroundGradient?.colors || ['#3b82f6', '#8b5cf6']).map((color, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => updateGradientColor(index, e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                      />
                      <Input
                        value={color}
                        onChange={(e) => updateGradientColor(index, e.target.value)}
                        className="flex-1 font-mono text-sm"
                      />
                      {(theme.backgroundGradient?.colors?.length || 0) > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGradientColor(index)}
                          className="shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Gradient Preview */}
              <div
                className="h-24 rounded-lg border border-gray-300 dark:border-gray-600"
                style={{
                  background:
                    theme.backgroundGradient?.type === 'linear'
                      ? `linear-gradient(${theme.backgroundGradient.angle || 135}deg, ${(theme.backgroundGradient.colors || []).join(', ')})`
                      : `radial-gradient(circle, ${(theme.backgroundGradient?.colors || []).join(', ')})`,
                }}
              />
            </div>
          </TabsContent>

          {/* Pattern Background */}
          <TabsContent value="pattern" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label className="text-xs">Stile Pattern</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'dots', label: 'Punti' },
                  { value: 'grid', label: 'Griglia' },
                  { value: 'waves', label: 'Onde' },
                  { value: 'diagonal', label: 'Diagonale' },
                  { value: 'none', label: 'Nessuno' }
                ].map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={theme.backgroundPattern === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (value === 'none') {
                        // Rimuovi pattern e passa a color
                        onUpdate({ 
                          backgroundPattern: undefined,
                          backgroundType: 'color',
                          backgroundImage: undefined,
                          backgroundGradient: undefined,
                        });
                      } else {
                        onUpdate({ 
                          backgroundPattern: value as any,
                          backgroundType: 'pattern',
                          backgroundImage: undefined,
                          backgroundGradient: undefined,
                        });
                      }
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Background Blur */}
      <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Effetto Sfocatura</Label>
          <span className="text-xs text-gray-500">{theme.backgroundBlur || 0}px</span>
        </div>
        <Slider
          value={[theme.backgroundBlur || 0]}
          onValueChange={([value]) => onUpdate({ backgroundBlur: value })}
          min={0}
          max={50}
          step={1}
        />
      </div>

      {/* Background Overlay */}
      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Label className="text-xs font-semibold">Sovrapposizione</Label>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Colore Sovrapposizione</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.backgroundOverlay?.color || '#000000'}
                onChange={(e) =>
                  onUpdate({
                    backgroundOverlay: {
                      ...theme.backgroundOverlay,
                      color: e.target.value,
                      opacity: theme.backgroundOverlay?.opacity || 0,
                    },
                  })
                }
                className="w-12 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
              />
              <Input
                value={theme.backgroundOverlay?.color || '#000000'}
                onChange={(e) =>
                  onUpdate({
                    backgroundOverlay: {
                      ...theme.backgroundOverlay,
                      color: e.target.value,
                      opacity: theme.backgroundOverlay?.opacity || 0,
                    },
                  })
                }
                className="flex-1 font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Opacità Sovrapposizione</Label>
              <span className="text-xs text-gray-500">
                {Math.round((theme.backgroundOverlay?.opacity || 0) * 100)}%
              </span>
            </div>
            <Slider
              value={[(theme.backgroundOverlay?.opacity || 0) * 100]}
              onValueChange={([value]) =>
                onUpdate({
                  backgroundOverlay: {
                    color: theme.backgroundOverlay?.color || '#000000',
                    opacity: value / 100,
                  },
                })
              }
              min={0}
              max={100}
              step={5}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
