/**
 * PreviewCanvas Component (V2 - Enhanced)
 * Area di preview centrale con device frames e controlli zoom eleganti
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Tablet, Smartphone, Loader2 } from 'lucide-react';
import { ThemeV2, DeviceFrame } from '../../../types/theme';
import { Button } from '../../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip';

interface PreviewCanvasProps {
  theme: Partial<ThemeV2>;
  deviceFrame?: DeviceFrame;
  onDeviceFrameChange?: (frame: DeviceFrame) => void;
  children: React.ReactNode;
  isLoading?: boolean;
}

export function PreviewCanvas({
  theme,
  deviceFrame = 'desktop',
  onDeviceFrameChange,
  children,
  isLoading = false,
}: PreviewCanvasProps) {
  const deviceFrames: { value: DeviceFrame; icon: React.ReactNode; label: string; width: string }[] = [
    { value: 'desktop', icon: <Monitor className="w-4 h-4" />, label: 'Desktop', width: '100%' },
    { value: 'tablet', icon: <Tablet className="w-4 h-4" />, label: 'Tablet', width: '768px' },
    { value: 'mobile', icon: <Smartphone className="w-4 h-4" />, label: 'Mobile', width: '375px' },
  ];

  const getDeviceWidth = () => {
    const device = deviceFrames.find((d) => d.value === deviceFrame);
    return device?.width || '100%';
  };

  const animationDuration = 
    theme.animationSpeed === 'fast' ? 0.15 : 
    theme.animationSpeed === 'slow' ? 0.5 : 
    0.3;

  return (
    <div className="w-full h-full flex flex-col bg-gray-100/60 relative overflow-hidden" style={{ backgroundColor: 'rgba(243, 244, 246, 0.6)' }}>
      {/* Top Toolbar - Minimal & Elegant */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex items-center justify-center px-6 py-3 bg-white/95 border-b border-gray-200/50 backdrop-blur-xl rounded-t-lg flex-shrink-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
      >
        {/* Device Frame Selector - Centrato */}
        <div className="flex items-center gap-1">
          {deviceFrames.map((frame) => (
            <TooltipProvider key={frame.value}>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Button
                    variant={deviceFrame === frame.value ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onDeviceFrameChange?.(frame.value)}
                    className="h-8 px-3 gap-2"
                  >
                    {frame.icon}
                    <span className="hidden md:inline text-xs">{frame.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{frame.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </motion.div>

      {/* Preview Area */}
      <div className="flex-1 overflow-hidden p-6 flex items-center justify-center min-h-0">
        <motion.div
          layout
          transition={{ duration: animationDuration, ease: 'easeInOut' }}
          style={{
            width: getDeviceWidth(),
            maxWidth: getDeviceWidth(),
            height: '100%',
            maxHeight: '100%',
            transformOrigin: 'center center',
          }}
          className="relative flex flex-col"
        >
          {/* Device Frame Border (per tablet/mobile) */}
          {(deviceFrame === 'tablet' || deviceFrame === 'mobile') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute -inset-4 border-8 border-gray-800 dark:border-gray-700 rounded-3xl pointer-events-none shadow-2xl"
            />
          )}

          {/* Loading Overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
              >
                 <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#FFCD00]" />
                  <p className="text-sm text-gray-600">
                    Applicando modifiche...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview Content con applicazione tema */}
          <motion.div
            layout
            className="relative rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0"
            style={{
              backgroundColor: theme.backgroundColor || '#ffffff',
              fontFamily: theme.fontFamily || 'Inter, system-ui, sans-serif',
              color: theme.textColor || '#1f2937',
              backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
              backgroundSize: theme.backgroundSize || 'cover',
              backgroundPosition: theme.backgroundPosition || 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* Background Gradient Overlay */}
            {theme.backgroundType === 'gradient' && theme.backgroundGradient && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    theme.backgroundGradient.type === 'linear'
                      ? `linear-gradient(${theme.backgroundGradient.angle || 0}deg, ${theme.backgroundGradient.colors.join(', ')})`
                      : `radial-gradient(circle at ${theme.backgroundGradient.position?.x || 50}% ${theme.backgroundGradient.position?.y || 50}%, ${theme.backgroundGradient.colors.join(', ')})`,
                  opacity: theme.backgroundOpacity ? theme.backgroundOpacity / 100 : 1,
                }}
              />
            )}

            {/* Background Pattern */}
            {theme.backgroundPattern && theme.backgroundPattern !== 'none' && (
              <div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  backgroundImage: getPatternStyle(theme.backgroundPattern),
                  backgroundSize: '30px 30px',
                }}
              />
            )}

            {/* Background Overlay */}
            {theme.backgroundOverlay && theme.backgroundOverlay.opacity > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundColor: theme.backgroundOverlay.color,
                  opacity: theme.backgroundOverlay.opacity,
                }}
              />
            )}

            {/* Background Blur Effect */}
            {theme.backgroundBlur && theme.backgroundBlur > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backdropFilter: `blur(${theme.backgroundBlur}px)`,
                  WebkitBackdropFilter: `blur(${theme.backgroundBlur}px)`,
                }}
              />
            )}

            {/* Preview Content - Form reale */}
            <div className="relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden">{children}</div>
          </motion.div>
        </motion.div>
      </div>

    </div>
  );
}

/**
 * Get CSS pattern style based on pattern type
 */
function getPatternStyle(pattern: string): string {
  switch (pattern) {
    case 'dots':
      return `radial-gradient(circle, currentColor 1px, transparent 1px)`;
    case 'grid':
      return `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`;
    case 'waves':
      return `repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 20px)`;
    case 'diagonal':
      return `repeating-linear-gradient(45deg, currentColor, currentColor 1px, transparent 1px, transparent 10px)`;
    default:
      return 'none';
  }
}
