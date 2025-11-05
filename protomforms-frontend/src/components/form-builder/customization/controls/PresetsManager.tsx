/**
 * PresetsManager Component
 * Grid view of professional preset templates with categories
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trash2 } from 'lucide-react';
import { PresetTemplate } from '../../../../types/theme';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../ui/alert-dialog';

interface PresetsManagerProps {
  presets: PresetTemplate[];
  customPresets: PresetTemplate[];
  onApplyPreset: (presetId: string) => void;
  onDeletePreset?: (presetId: string) => void;
  currentTheme?: any;
}

const categoryColors = {
  professional: 'bg-[#FFCD00]/10 text-gray-700 border-[#FFCD00]/30',
  creative: 'bg-gray-100 text-gray-700 border-gray-300',
  minimal: 'bg-gray-100 text-gray-700 border-gray-300',
  bold: 'bg-[#FFCD00]/20 text-gray-800 border-[#FFCD00]/40',
};

export function PresetsManager({
  presets,
  customPresets,
  onApplyPreset,
  onDeletePreset,
  currentTheme,
}: PresetsManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<string | null>(null);

  // Filter presets based on category
  const filteredPresets = useMemo(() => {
    return presets.filter((preset) => {
      const matchesCategory = selectedCategory === null || preset.category === selectedCategory;
      return matchesCategory;
    });
  }, [presets, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(presets.map((p) => p.category));
    return Array.from(cats);
  }, [presets]);

  const handleDeleteClick = (presetId: string) => {
    setPresetToDelete(presetId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (presetToDelete && onDeletePreset) {
      onDeletePreset(presetToDelete);
    }
    setDeleteDialogOpen(false);
    setPresetToDelete(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.4, 
        ease: [0.4, 0, 0.2, 1], // Custom easing per animazione più fluida
      },
    },
  };

  return (
    <div className="h-full flex flex-col">
      {/* Category Filter - Expanding Pill */}
      <div className="flex justify-center w-full flex-shrink-0 mb-4">
        <ExpandingCategoryPill
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Presets Grid */}
      <motion.div
        key={selectedCategory || 'all'} // Key basata sulla categoria per forzare re-render completo
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-3 pr-2 pb-2"
      >
        <AnimatePresence initial={false}>
          {filteredPresets.map((preset, index) => (
            <motion.div
              key={preset.id}
              variants={itemVariants}
              layout
              exit={{ 
                opacity: 0, 
                scale: 0.95, 
                y: -15,
                transition: { 
                  duration: 0.2, 
                  ease: 'easeIn' 
                } 
              }}
            >
              <PresetCard
                preset={preset}
                isCustom={customPresets.some((p) => p.id === preset.id)}
                onApply={() => onApplyPreset(preset.id)}
                onDelete={() => handleDeleteClick(preset.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* No Results */}
      {filteredPresets.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm text-gray-500">No presets found</p>
          <p className="text-xs mt-1 text-gray-400">Try adjusting your search or filters</p>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this custom preset? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Individual Preset Card
 */
interface PresetCardProps {
  preset: PresetTemplate;
  isCustom: boolean;
  onApply: () => void;
  onDelete: () => void;
}

function PresetCard({ preset, isCustom, onApply, onDelete }: PresetCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group cursor-pointer rounded-lg border border-gray-200 bg-white overflow-hidden"
      onClick={onApply}
    >
      {/* Color Preview Bar */}
      <div className="h-16 flex">
        <div
          className="flex-1"
          style={{ backgroundColor: preset.theme.primaryColor || '#3b82f6' }}
        />
        <div
          className="flex-1"
          style={{ backgroundColor: preset.theme.backgroundColor || '#ffffff' }}
        />
        <div
          className="flex-1"
          style={{ backgroundColor: preset.theme.accentColor || '#8b5cf6' }}
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 truncate">
              {preset.name}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-2 mt-1">
              {preset.description}
            </p>
          </div>
          {preset.isPremium && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Premium
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <Badge
            variant="outline"
            className={`text-xs capitalize border ${categoryColors[preset.category] || categoryColors.professional}`}
          >
            {preset.category}
          </Badge>

          {isCustom && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete custom preset"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Hover Overlay */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-[#FFCD00]/10 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * ExpandingCategoryPill Component
 * Pillola centrale che si espande al hover mostrando tutte le categorie
 */
interface ExpandingCategoryPillProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

function ExpandingCategoryPill({ categories, selectedCategory, onSelectCategory }: ExpandingCategoryPillProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Tutte le categorie (All + altre)
  const allCategories = [
    { id: null, label: 'All' },
    ...categories.map(cat => ({ id: cat, label: cat }))
  ];

  const currentLabel = selectedCategory 
    ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)
    : 'All';

  // Gestione scroll orizzontale con rotella del mouse
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Se lo scroll è orizzontale, lascia fare il default
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }
      
      // Se lo scroll è verticale, convertilo in orizzontale
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isExpanded]);

  return (
    <motion.div
      onHoverStart={() => setIsExpanded(true)}
      onHoverEnd={() => setIsExpanded(false)}
      className="relative flex items-center justify-center w-full overflow-visible"
      style={{ minHeight: '64px', padding: '8px 0' }} // Padding verticale aumentato per evitare taglio
      initial={false}
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          // Pillola centrale collassata
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="flex items-center justify-center"
          >
            <motion.div
              className="px-5 py-2 text-sm font-medium rounded-full backdrop-blur-xl cursor-pointer text-gray-900"
              style={{
                backgroundColor: 'rgba(255, 205, 0, 0.9)',
              }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <span className="capitalize">{currentLabel}</span>
            </motion.div>
          </motion.div>
        ) : (
          // Container espanso con tutte le pillole - scrollabile
          <motion.div
            key="expanded"
            initial={{ opacity: 0, width: '120px' }}
            animate={{ opacity: 1, width: '100%' }}
            exit={{ opacity: 0, width: '120px' }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex items-center overflow-visible"
            style={{ maxHeight: '64px', padding: '4px 0' }}
          >
            <div
              ref={scrollContainerRef}
              className="flex items-center gap-2 w-full px-2 scrollbar-hide"
              style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                scrollBehavior: 'smooth',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                cursor: 'grab',
              }}
              onMouseDown={(e) => {
                // Non iniziare il drag se si clicca direttamente su un button
                if ((e.target as HTMLElement).tagName === 'BUTTON') {
                  return;
                }

                const container = scrollContainerRef.current;
                if (!container) return;

                const startX = e.pageX - container.offsetLeft;
                const scrollLeft = container.scrollLeft;
                let isDragging = false;
                const dragThreshold = 5; // Pixels di movimento prima di considerarlo un drag

                const handleMouseMove = (e: MouseEvent) => {
                  const x = e.pageX - container.offsetLeft;
                  const walk = x - startX;
                  
                  // Se il movimento supera la soglia, inizia il drag
                  if (Math.abs(walk) > dragThreshold) {
                    isDragging = true;
                    e.preventDefault();
                    container.scrollLeft = scrollLeft - walk * 2; // Velocità di scroll
                  }
                };

                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                  container.style.cursor = 'grab';
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
                container.style.cursor = 'grabbing';
              }}
            >
              {allCategories.map((category, index) => (
                <CategoryPillButton
                  key={category.id || 'all'}
                  category={category}
                  isSelected={selectedCategory === category.id}
                  index={index}
                  onClick={() => onSelectCategory(category.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * CategoryPillButton Component
 * Singola pillola con glow leggero al hover
 */
interface CategoryPillButtonProps {
  category: { id: string | null; label: string };
  isSelected: boolean;
  index: number;
  onClick: () => void;
}

function CategoryPillButton({ category, isSelected, index, onClick }: CategoryPillButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1],
        delay: index * 0.04,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative shrink-0 flex-none overflow-visible" // overflow-visible per glow effect
      style={{ margin: '4px 0' }} // Margin verticale aumentato per spazio glow
    >
      <motion.button
        onClick={onClick}
        className={`
          relative px-4 py-1.5 text-xs font-medium rounded-full
          backdrop-blur-xl whitespace-nowrap
          ${isSelected 
            ? 'text-gray-900' 
            : 'text-gray-700'
          }
        `}
        style={{
          backgroundColor: isSelected 
            ? 'rgba(255, 205, 0, 0.9)' 
            : isHovered 
            ? 'rgba(243, 244, 246, 0.9)'
            : 'rgba(243, 244, 246, 0.8)',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <span className="capitalize relative z-10 block">{category.label}</span>
        
        {/* Glow effect leggero al hover - ridotto */}
        {isHovered && !isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1.05 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 rounded-full bg-[#FFCD00]/8 -z-0 pointer-events-none"
            style={{
              filter: 'blur(8px)',
            }}
          />
        )}
      </motion.button>
    </motion.div>
  );
}
