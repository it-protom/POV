/**
 * TypographyControls Component
 * Modern typography controls with font selection, sizing, and spacing
 */

import React, { useState } from 'react';
import { Type, LineChart, AlignLeft, ChevronDown } from 'lucide-react';
import { ThemeV2 } from '../../../../types/theme';
import { Label } from '../../../ui/label';
import { Slider } from '../../../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '../../../ui/popover';
import { Button } from '../../../ui/button';

interface TypographyControlsProps {
  theme: Partial<ThemeV2>;
  onUpdate: (updates: Partial<ThemeV2>) => void;
}

const FONT_FAMILIES = [
  { value: 'Inter, system-ui, sans-serif', label: 'Inter (Sans)' },
  { value: 'Roboto, system-ui, sans-serif', label: 'Roboto (Sans)' },
  { value: 'Poppins, system-ui, sans-serif', label: 'Poppins (Sans)' },
  { value: 'Montserrat, system-ui, sans-serif', label: 'Montserrat (Sans)' },
  { value: 'Nunito, system-ui, sans-serif', label: 'Nunito (Sans)' },
  { value: 'Quicksand, system-ui, sans-serif', label: 'Quicksand (Sans)' },
  { value: 'Merriweather, serif', label: 'Merriweather (Serif)' },
  { value: 'Playfair Display, serif', label: 'Playfair Display (Serif)' },
  { value: 'Lora, serif', label: 'Lora (Serif)' },
  { value: 'Roboto Mono, monospace', label: 'Roboto Mono (Mono)' },
  { value: 'system-ui, sans-serif', label: 'System Default' },
];

const FONT_WEIGHTS = [
  { value: 'normal', label: 'Normal (400)' },
  { value: 'medium', label: 'Medium (500)' },
  { value: 'semibold', label: 'Semibold (600)' },
  { value: 'bold', label: 'Bold (700)' },
];

export function TypographyControls({ theme, onUpdate }: TypographyControlsProps) {
  const [bodyFontOpen, setBodyFontOpen] = useState(false);
  const [headingFontOpen, setHeadingFontOpen] = useState(false);

  const getFontLabel = (fontValue: string) => {
    return FONT_FAMILIES.find(f => f.value === fontValue)?.label || fontValue;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#000000' }}>
          <Type className="w-4 h-4" style={{ color: '#000000' }} />
          Famiglie Font
        </h3>

        <Tabs defaultValue="body" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="body">Testo Corpo</TabsTrigger>
            <TabsTrigger value="heading">Intestazioni</TabsTrigger>
          </TabsList>

          <TabsContent value="body" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-xs" style={{ color: '#000000' }}>Famiglia Font</Label>
              <Popover open={bodyFontOpen} onOpenChange={setBodyFontOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between h-auto py-3 px-4"
                    style={{ 
                      fontFamily: theme.fontFamily || 'Inter, system-ui, sans-serif',
                      backgroundColor: '#ffffff',
                      color: '#000000'
                    }}
                  >
                    <span className="text-base">{getFontLabel(theme.fontFamily || 'Inter, system-ui, sans-serif')}</span>
                    <ChevronDown className="w-4 h-4 ml-2 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2" align="start" style={{ backgroundColor: '#ffffff' }}>
                  <div className="space-y-1 max-h-72 overflow-y-auto">
                    {FONT_FAMILIES.map((font) => (
                      <button
                        key={font.value}
                        type="button"
                        onClick={() => {
                          onUpdate({ fontFamily: font.value });
                          setBodyFontOpen(false);
                        }}
                        className="w-full text-left px-3 py-3 rounded-md hover:bg-gray-100 transition-colors text-base"
                        style={{ 
                          fontFamily: font.value,
                          backgroundColor: (theme.fontFamily || 'Inter, system-ui, sans-serif') === font.value ? '#f3f4f6' : 'transparent',
                          color: '#000000'
                        }}
                      >
                        {font.label}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </TabsContent>

          <TabsContent value="heading" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-xs" style={{ color: '#000000' }}>Famiglia Font Intestazioni</Label>
              <Popover open={headingFontOpen} onOpenChange={setHeadingFontOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between h-auto py-3 px-4"
                    style={{ 
                      fontFamily: theme.headingFontFamily || theme.fontFamily || 'Inter, system-ui, sans-serif',
                      backgroundColor: '#ffffff',
                      color: '#000000'
                    }}
                  >
                    <span className="text-base">{getFontLabel(theme.headingFontFamily || theme.fontFamily || 'Inter, system-ui, sans-serif')}</span>
                    <ChevronDown className="w-4 h-4 ml-2 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2" align="start" style={{ backgroundColor: '#ffffff' }}>
                  <div className="space-y-1 max-h-72 overflow-y-auto">
                    {FONT_FAMILIES.map((font) => (
                      <button
                        key={font.value}
                        type="button"
                        onClick={() => {
                          onUpdate({ headingFontFamily: font.value });
                          setHeadingFontOpen(false);
                        }}
                        className="w-full text-left px-3 py-3 rounded-md hover:bg-gray-100 transition-colors text-base"
                        style={{ 
                          fontFamily: font.value,
                          backgroundColor: (theme.headingFontFamily || theme.fontFamily || 'Inter, system-ui, sans-serif') === font.value ? '#f3f4f6' : 'transparent',
                          color: '#000000'
                        }}
                      >
                        {font.label}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Font Sizes */}
      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#000000' }}>
          <LineChart className="w-4 h-4" style={{ color: '#000000' }} />
          Dimensioni Font
        </h3>

        <div className="space-y-4">
          {/* Question Font Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs" style={{ color: '#000000' }}>Dimensione Domande</Label>
              <span className="text-xs text-gray-500">{theme.questionFontSize || 18}px</span>
            </div>
            <Slider
              value={[theme.questionFontSize || 18]}
              onValueChange={([value]) => onUpdate({ questionFontSize: value })}
              min={12}
              max={32}
              step={1}
            />
          </div>

          {/* Option Font Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs" style={{ color: '#000000' }}>Dimensione Opzioni</Label>
              <span className="text-xs text-gray-500">{theme.optionFontSize || 16}px</span>
            </div>
            <Slider
              value={[theme.optionFontSize || 16]}
              onValueChange={([value]) => onUpdate({ optionFontSize: value })}
              min={10}
              max={24}
              step={1}
            />
          </div>
        </div>
      </div>

      {/* Font Weight */}
      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold" style={{ color: '#000000' }}>Spessore Font</h3>

        <div className="space-y-2">
          <Label className="text-xs" style={{ color: '#000000' }}>Spessore Domande</Label>
          <Select
            value={theme.questionFontWeight || 'semibold'}
            onValueChange={(value: 'normal' | 'medium' | 'semibold' | 'bold') =>
              onUpdate({ questionFontWeight: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_WEIGHTS.map((weight) => (
                <SelectItem key={weight.value} value={weight.value}>
                  {weight.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced Typography */}
      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#000000' }}>
          <AlignLeft className="w-4 h-4" style={{ color: '#000000' }} />
          Avanzate
        </h3>

        {/* Line Height */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs" style={{ color: '#000000' }}>Altezza Riga</Label>
            <span className="text-xs text-gray-500">{theme.lineHeight?.toFixed(1) || '1.5'}</span>
          </div>
          <Slider
            value={[theme.lineHeight || 1.5]}
            onValueChange={([value]) => onUpdate({ lineHeight: value })}
            min={1.0}
            max={3.0}
            step={0.1}
          />
        </div>

        {/* Letter Spacing */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs" style={{ color: '#000000' }}>Spaziatura Lettere</Label>
            <span className="text-xs text-gray-500">{theme.letterSpacing || 0}px</span>
          </div>
          <Slider
            value={[theme.letterSpacing || 0]}
            onValueChange={([value]) => onUpdate({ letterSpacing: value })}
            min={-2}
            max={4}
            step={0.25}
          />
        </div>
      </div>
    </div>
  );
}
