/**
 * CustomizationSidebar Component (V2 - Simplified)
 * Sidebar fissa che mostra solo i controlli della categoria attiva
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeV2 } from '../../../types/theme';
import { PresetsManager } from './controls/PresetsManager';
import { ColorSystemControls } from './controls/ColorSystemControls';
import { BackgroundControls } from './controls/BackgroundControls';
import { TypographyControls } from './controls/TypographyControls';
import { LayoutControls } from './controls/LayoutControls';
import { EffectsControls } from './controls/EffectsControls';
import { CategoryId } from './CategoryHeader';

interface CustomizationSidebarProps {
  activeCategory: CategoryId;
  theme: Partial<ThemeV2>;
  onThemeUpdate: (updates: Partial<ThemeV2>) => void;
  presets: any[];
  customPresets: any[];
  onApplyPreset: (presetId: string) => void;
  onDeletePreset: (presetId: string) => void;
}

const getCategoryTitle = (categoryId: CategoryId): string => {
  const titles: Record<CategoryId, string> = {
    presets: 'Template Predefiniti',
    colors: 'Sistema Colori',
    background: 'Sfondo e Pattern',
    typography: 'Tipografia',
    layout: 'Layout e Spaziature',
    effects: 'Effetti e Animazioni',
  };
  return titles[categoryId];
};

const getCategoryDescription = (categoryId: CategoryId): string => {
  const descriptions: Record<CategoryId, string> = {
    presets: 'Scegli un template predefinito o applica uno dei tuoi preset salvati',
    colors: 'Configura palette colori, contrasti e armonie cromatiche',
    background: 'Personalizza sfondo con immagini, gradienti o pattern',
    typography: 'Imposta font, dimensioni e stili del testo',
    layout: 'Configura spaziature, padding e dimensioni degli elementi',
    effects: 'Aggiungi animazioni, hover effects e ombre',
  };
  return descriptions[categoryId];
};

export function CustomizationSidebar({
  activeCategory,
  theme,
  onThemeUpdate,
  presets,
  customPresets,
  onApplyPreset,
  onDeletePreset,
}: CustomizationSidebarProps) {
  
  // Render contenuto della categoria attiva
  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'presets':
        return (
          <PresetsManager
            presets={presets}
            customPresets={customPresets}
            onApplyPreset={onApplyPreset}
            onDeletePreset={onDeletePreset}
            currentTheme={theme}
          />
        );
      case 'colors':
        return <ColorSystemControls theme={theme} onUpdate={onThemeUpdate} />;
      case 'background':
        return <BackgroundControls theme={theme} onUpdate={onThemeUpdate} />;
      case 'typography':
        return <TypographyControls theme={theme} onUpdate={onThemeUpdate} />;
      case 'layout':
        return <LayoutControls theme={theme} onUpdate={onThemeUpdate} />;
      case 'effects':
        return <EffectsControls theme={theme} onUpdate={onThemeUpdate} />;
      default:
        return null;
    }
  };

  return (
    <aside
      className="w-full bg-white/95 backdrop-blur-xl border-r border-gray-200/50 flex flex-col rounded-l-lg overflow-hidden h-full"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
    >
      {/* Header Sidebar */}
      <div className="p-6 border-b border-gray-200/50 flex-shrink-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {getCategoryTitle(activeCategory)}
            </h2>
            <p className="text-sm text-gray-500">
              {getCategoryDescription(activeCategory)}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content Scrollable */}
      <div 
        className="flex-1 overflow-y-auto min-h-0"
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* IE and Edge */
        }}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
            .flex-1.overflow-y-auto::-webkit-scrollbar {
              display: none; /* Chrome, Safari, Opera */
            }
          `
        }} />
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {renderCategoryContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer con tips (opzionale) */}
      <div className="p-4 border-t border-gray-200/50 bg-gray-50/90 backdrop-blur-sm rounded-b-lg flex-shrink-0" style={{ backgroundColor: 'rgba(249, 250, 251, 0.9)' }}>
        <div className="flex items-start gap-2">
          <div className="w-1 h-1 rounded-full bg-[#FFCD00] mt-1.5 shrink-0" />
          <p className="text-xs text-gray-600 leading-relaxed">
            Le modifiche vengono applicate in tempo reale. Usa{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-gray-200 font-mono text-xs">
              Ctrl+Z
            </kbd>{' '}
            per annullare.
          </p>
        </div>
      </div>
    </aside>
  );
}
