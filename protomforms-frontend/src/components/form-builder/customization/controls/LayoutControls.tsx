/**
 * LayoutControls Component
 * Controlli per spacing, padding, border radius, e dimensioni container
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ThemeV2 } from '../../../../types/theme';
import { Label } from '../../../ui/label';
import { Slider } from '../../../ui/slider';
import { Input } from '../../../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../ui/tooltip';
import { Info } from 'lucide-react';

interface LayoutControlsProps {
  theme: Partial<ThemeV2>;
  onUpdate: (updates: Partial<ThemeV2>) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export function LayoutControls({ theme, onUpdate }: LayoutControlsProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Border Radius */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="borderRadius" className="text-sm font-medium">
              Arrotondamento Bordi
            </Label>
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Arrotondamento degli angoli degli elementi</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {theme.borderRadius || 8}px
          </span>
        </div>
        <Slider
          id="borderRadius"
          min={0}
          max={24}
          step={1}
          value={[theme.borderRadius || 8]}
          onValueChange={([value]) => onUpdate({ borderRadius: value })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>Quadrato</span>
          <span>Arrotondato</span>
        </div>
      </motion.div>

      {/* Border Width */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="borderWidth" className="text-sm font-medium">
              Spessore Bordi
            </Label>
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Spessore dei bordi degli elementi</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {theme.borderWidth || 1}px
          </span>
        </div>
        <Slider
          id="borderWidth"
          min={0}
          max={8}
          step={1}
          value={[theme.borderWidth || 1]}
          onValueChange={([value]) => onUpdate({ borderWidth: value })}
          className="w-full"
        />
      </motion.div>

      {/* Border Style */}
      <motion.div variants={itemVariants} className="space-y-3">
        <Label htmlFor="borderStyle" className="text-sm font-medium">
          Stile Bordi
        </Label>
        <Select
          value={theme.borderStyle || 'solid'}
          onValueChange={(value: 'solid' | 'dashed' | 'dotted' | 'double') =>
            onUpdate({ borderStyle: value })
          }
        >
          <SelectTrigger id="borderStyle">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Solido</SelectItem>
            <SelectItem value="dashed">Tratteggiato</SelectItem>
            <SelectItem value="dotted">Punteggiato</SelectItem>
            <SelectItem value="double">Doppio</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Card Padding */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="cardPadding" className="text-sm font-medium">
              Padding Card
            </Label>
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Spazio interno delle card domande</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {theme.cardPadding || 24}px
          </span>
        </div>
        <Slider
          id="cardPadding"
          min={12}
          max={48}
          step={4}
          value={[theme.cardPadding || 24]}
          onValueChange={([value]) => onUpdate({ cardPadding: value })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>Compatto</span>
          <span>Spazioso</span>
        </div>
      </motion.div>

      {/* Question Spacing */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="questionSpacing" className="text-sm font-medium">
              Spazio tra Domande
            </Label>
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Distanza verticale tra le domande</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {theme.questionSpacing || 32}px
          </span>
        </div>
        <Slider
          id="questionSpacing"
          min={16}
          max={64}
          step={4}
          value={[theme.questionSpacing || 32]}
          onValueChange={([value]) => onUpdate({ questionSpacing: value })}
          className="w-full"
        />
      </motion.div>

      {/* Option Spacing */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="optionSpacing" className="text-sm font-medium">
              Spazio tra Opzioni
            </Label>
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Distanza tra le opzioni di risposta</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {theme.optionSpacing || 12}px
          </span>
        </div>
        <Slider
          id="optionSpacing"
          min={4}
          max={24}
          step={2}
          value={[theme.optionSpacing || 12]}
          onValueChange={([value]) => onUpdate({ optionSpacing: value })}
          className="w-full"
        />
      </motion.div>

      {/* Section Spacing */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="sectionSpacing" className="text-sm font-medium">
              Spazio tra Sezioni
            </Label>
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Distanza tra le sezioni del form</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {theme.sectionSpacing || 48}px
          </span>
        </div>
        <Slider
          id="sectionSpacing"
          min={24}
          max={96}
          step={8}
          value={[theme.sectionSpacing || 48]}
          onValueChange={([value]) => onUpdate({ sectionSpacing: value })}
          className="w-full"
        />
      </motion.div>

      {/* Container Max Width */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="containerMaxWidth" className="text-sm font-medium">
              Larghezza Massima Container
            </Label>
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Larghezza massima del contenuto principale</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {theme.containerMaxWidth || 800}px
          </span>
        </div>
        <Slider
          id="containerMaxWidth"
          min={600}
          max={1200}
          step={50}
          value={[theme.containerMaxWidth || 800]}
          onValueChange={([value]) => onUpdate({ containerMaxWidth: value })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>Stretto</span>
          <span>Largo</span>
        </div>
      </motion.div>

      {/* Visual Preview */}
      <motion.div
        variants={itemVariants}
        className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Anteprima Layout
        </p>
        <div className="space-y-3">
          {/* Container preview */}
          <div
            className="mx-auto bg-white dark:bg-gray-900 p-2 rounded shadow-sm"
            style={{
              maxWidth: `${Math.min(300, (theme.containerMaxWidth || 800) / 3)}px`,
            }}
          >
            {/* Question card preview */}
            <div
              className="bg-gray-100 dark:bg-gray-800 border"
              style={{
                borderRadius: `${(theme.borderRadius || 8) / 2}px`,
                borderWidth: `${Math.max(1, (theme.borderWidth || 1) / 2)}px`,
                borderStyle: theme.borderStyle || 'solid',
                borderColor: '#d1d5db',
                padding: `${(theme.cardPadding || 24) / 4}px`,
                marginBottom: `${(theme.questionSpacing || 32) / 6}px`,
              }}
            >
              <div className="h-2 w-3/4 bg-gray-300 dark:bg-gray-600 rounded mb-2" />
              <div
                className="space-y-1"
                style={{ gap: `${(theme.optionSpacing || 12) / 6}px` }}
              >
                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
            {/* Another question card */}
            <div
              className="bg-gray-100 dark:bg-gray-800 border"
              style={{
                borderRadius: `${(theme.borderRadius || 8) / 2}px`,
                borderWidth: `${Math.max(1, (theme.borderWidth || 1) / 2)}px`,
                borderStyle: theme.borderStyle || 'solid',
                borderColor: '#d1d5db',
                padding: `${(theme.cardPadding || 24) / 4}px`,
              }}
            >
              <div className="h-2 w-2/3 bg-gray-300 dark:bg-gray-600 rounded mb-2" />
              <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

