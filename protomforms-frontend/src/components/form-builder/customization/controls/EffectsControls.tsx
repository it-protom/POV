/**
 * EffectsControls Component
 * Controlli per hover effects, animazioni, shadows e glow
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ThemeV2 } from '../../../../types/theme';
import { Label } from '../../../ui/label';
import { Slider } from '../../../ui/slider';
import { Switch } from '../../../ui/switch';
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
import { Info, Sparkles } from 'lucide-react';
import { Input } from '../../../ui/input';

interface EffectsControlsProps {
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

export function EffectsControls({ theme, onUpdate }: EffectsControlsProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Hover Scale */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="hoverScale" className="text-sm font-medium">
              Effetto Hover Scale
            </Label>
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Ingrandimento elementi al passaggio del mouse</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {theme.hoverScale || 1.02}x
          </span>
        </div>
        <Slider
          id="hoverScale"
          min={1.0}
          max={1.1}
          step={0.01}
          value={[theme.hoverScale || 1.02]}
          onValueChange={([value]) => onUpdate({ hoverScale: value })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>Nessuno</span>
          <span>Pronunciato</span>
        </div>
      </motion.div>

      {/* Animation Speed */}
      <motion.div variants={itemVariants} className="space-y-3">
        <Label htmlFor="animationSpeed" className="text-sm font-medium">
          Velocità Animazioni
        </Label>
        <Select
          value={theme.animationSpeed || 'normal'}
          onValueChange={(value: 'slow' | 'normal' | 'fast') =>
            onUpdate({ animationSpeed: value })
          }
        >
          <SelectTrigger id="animationSpeed">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="slow">Lenta (500ms)</SelectItem>
            <SelectItem value="normal">Normale (300ms)</SelectItem>
            <SelectItem value="fast">Veloce (150ms)</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Enable Transitions */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="enableTransitions" className="text-sm font-medium">
              Abilita Transizioni
            </Label>
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Animazioni fluide tra stati</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch
            id="enableTransitions"
            checked={theme.enableTransitions ?? true}
            onCheckedChange={(checked) => onUpdate({ enableTransitions: checked })}
          />
        </div>
      </motion.div>

      {/* Shadow Intensity */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="shadowIntensity" className="text-sm font-medium">
              Intensità Ombra
            </Label>
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Profondità ombra degli elementi</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {theme.shadowIntensity || 2}
          </span>
        </div>
        <Slider
          id="shadowIntensity"
          min={0}
          max={5}
          step={1}
          value={[theme.shadowIntensity || 2]}
          onValueChange={([value]) => onUpdate({ shadowIntensity: value })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>Nessuna</span>
          <span>Forte</span>
        </div>
      </motion.div>

      {/* Glow Effect */}
      <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FFCD00]" />
              <Label className="text-sm font-medium">Effetto Glow</Label>
            </div>
          <Switch
            checked={theme.glowEffect?.enabled ?? false}
            onCheckedChange={(checked) =>
              onUpdate({
                glowEffect: {
                  enabled: checked,
                  color: theme.glowEffect?.color || theme.primaryColor || '#3b82f6',
                  intensity: theme.glowEffect?.intensity || 50,
                },
              })
            }
          />
        </div>

        {theme.glowEffect?.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 pl-6 border-l-2 border-[#FFCD00]/30 dark:border-[#FFCD00]/50"
            >
            {/* Glow Color */}
            <div className="space-y-2">
              <Label htmlFor="glowColor" className="text-xs text-gray-600 dark:text-gray-400">
                Colore Glow
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="glowColor"
                  type="color"
                  value={theme.glowEffect?.color || theme.primaryColor || '#3b82f6'}
                  onChange={(e) =>
                    onUpdate({
                      glowEffect: {
                        ...theme.glowEffect!,
                        color: e.target.value,
                      },
                    })
                  }
                  className="h-9 w-16 cursor-pointer"
                />
                <Input
                  type="text"
                  value={theme.glowEffect?.color || theme.primaryColor || '#3b82f6'}
                  onChange={(e) =>
                    onUpdate({
                      glowEffect: {
                        ...theme.glowEffect!,
                        color: e.target.value,
                      },
                    })
                  }
                  className="flex-1 h-9 text-xs font-mono"
                />
              </div>
            </div>

            {/* Glow Intensity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="glowIntensity" className="text-xs text-gray-600 dark:text-gray-400">
                  Intensità
                </Label>
                <span className="text-xs text-gray-500 font-mono">
                  {theme.glowEffect?.intensity || 50}%
                </span>
              </div>
              <Slider
                id="glowIntensity"
                min={0}
                max={100}
                step={5}
                value={[theme.glowEffect?.intensity || 50]}
                onValueChange={([value]) =>
                  onUpdate({
                    glowEffect: {
                      ...theme.glowEffect!,
                      intensity: value,
                    },
                  })
                }
                className="w-full"
              />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Hover Effect Toggle */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="hoverEffect" className="text-sm font-medium">
              Abilita Effetti Hover
            </Label>
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Effetti visivi al passaggio del mouse</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch
            id="hoverEffect"
            checked={theme.hoverEffect ?? true}
            onCheckedChange={(checked) => onUpdate({ hoverEffect: checked })}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

