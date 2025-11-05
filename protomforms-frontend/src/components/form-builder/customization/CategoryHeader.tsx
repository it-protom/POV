/**
 * CategoryHeader Component
 * Header orizzontale con tab categorie, quick actions e animazioni delicate
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Palette,
  Image as ImageIcon,
  Type,
  Square,
  Layers,
  Undo2,
  Redo2,
  RotateCcw,
  Save,
  Circle,
} from 'lucide-react';
import { Button } from '../../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip';

export type CategoryId = 'presets' | 'colors' | 'background' | 'typography' | 'layout' | 'effects';

export interface Category {
  id: CategoryId;
  title: string;
  icon: React.ReactNode;
  description: string;
}

interface CategoryHeaderProps {
  activeCategory: CategoryId;
  onCategoryChange: (categoryId: CategoryId) => void;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onSavePreset?: () => void;
}

const categories: Category[] = [
  {
    id: 'presets',
    title: 'Presets',
    icon: <Sparkles className="w-4 h-4" />,
    description: 'Template predefiniti',
  },
  {
    id: 'colors',
    title: 'Colori',
    icon: <Palette className="w-4 h-4" />,
    description: 'Palette e sistema colori',
  },
  {
    id: 'background',
    title: 'Sfondo',
    icon: <ImageIcon className="w-4 h-4" />,
    description: 'Immagini, gradienti e pattern',
  },
  {
    id: 'typography',
    title: 'Tipografia',
    icon: <Type className="w-4 h-4" />,
    description: 'Font e stili testo',
  },
  {
    id: 'layout',
    title: 'Layout',
    icon: <Square className="w-4 h-4" />,
    description: 'Spaziature e dimensioni',
  },
  {
    id: 'effects',
    title: 'Effetti',
    icon: <Layers className="w-4 h-4" />,
    description: 'Animazioni e hover',
  },
];

export function CategoryHeader({
  activeCategory,
  onCategoryChange,
  canUndo,
  canRedo,
  isDirty,
  onUndo,
  onRedo,
  onReset,
  onSavePreset,
}: CategoryHeaderProps) {
  return (
    <header className="h-16 bg-gray-50/95 backdrop-blur-xl border border-gray-200/50 rounded-lg" style={{ backgroundColor: 'rgba(249, 250, 251, 0.95)' }}>
      <div className="h-full flex items-center justify-between px-6">
        {/* Categorie Tab */}
        <nav className="flex items-center gap-1">
          {categories.map((category) => {
            const isActive = category.id === activeCategory;
            
            return (
              <TooltipProvider key={category.id}>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={() => onCategoryChange(category.id)}
                      className={`
                        relative px-4 py-2 rounded-lg text-sm font-medium
                        transition-colors duration-200
                        flex items-center gap-2
                        ${
                          isActive
                            ? 'text-gray-900'
                            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                    >
                      <span className="relative z-10">{category.icon}</span>
                      <span className="relative z-10">{category.title}</span>
                      
                      {/* Indicatore attivo animato - background arrotondato più piccolo */}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-1 right-1 top-1 bottom-1 bg-[#FFCD00] rounded-md -z-0"
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{category.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Badge modifiche non salvate */}
          {isDirty && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFCD00]/10 border border-[#FFCD00]/30"
            >
              <Circle className="w-2 h-2 fill-[#FFCD00] text-[#FFCD00]" />
              <span className="text-xs font-medium text-gray-700">
                Non salvato
              </span>
            </motion.div>
          )}

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200" />

          {/* Undo/Redo/Reset */}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="h-8 w-8 p-0"
                  >
                    <Undo2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Annulla (Ctrl+Z)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="h-8 w-8 p-0"
                  >
                    <Redo2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Ripristina (Ctrl+Y)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="h-8 w-8 p-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Ripristina predefinito</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Divider */}
          {onSavePreset && (
            <>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

              {/* Save Preset */}
              <TooltipProvider>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={onSavePreset}
                      className="h-8 gap-1.5 bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-gray-900 font-medium"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span className="text-xs">Salva Preset</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Salva come preset personalizzato</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export { categories };

