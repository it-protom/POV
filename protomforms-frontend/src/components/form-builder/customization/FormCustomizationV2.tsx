/**
 * FormCustomizationV2 - Main Container Component (Redesigned)
 * Layout moderno con Header categorie, Sidebar laterale e Preview centrale
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CategoryHeader, CategoryId } from './CategoryHeader';
import { CustomizationSidebar } from './CustomizationSidebar';
import { PreviewCanvas } from './PreviewCanvas';
import { useThemeCustomization } from './hooks/useThemeCustomization';
import { usePresets } from './hooks/usePresets';
import { ThemeV2, DeviceFrame } from '../../../types/theme';
import { QuestionFormData, QuestionType } from '@/types/question';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Star, Upload, GripVertical, Calendar } from 'lucide-react';

interface FormCustomizationV2Props {
  initialTheme?: Partial<ThemeV2>;
  onThemeChange?: (theme: Partial<ThemeV2>) => void;
  formTitle?: string;
  formDescription?: string;
  questions?: QuestionFormData[];
  onSave?: (theme: Partial<ThemeV2>) => void;
}

export function FormCustomizationV2({
  initialTheme,
  onThemeChange,
  formTitle = 'Titolo del Form',
  formDescription = 'Descrizione del form che verrà visualizzato',
  questions = [],
  onSave,
}: FormCustomizationV2Props) {
  // State
  const [activeCategory, setActiveCategory] = useState<CategoryId>('presets');
  const [deviceFrame, setDeviceFrame] = useState<DeviceFrame>('desktop');
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Theme customization hook
  const {
    theme,
    updateTheme,
    setTheme,
    resetTheme,
    undo,
    redo,
    canUndo,
    canRedo,
    isDirty,
  } = useThemeCustomization({
    initialTheme,
    onThemeChange: (newTheme) => {
      // Aggiornamento immediato senza loading overlay
      onThemeChange?.(newTheme);
    },
  });

  // Presets hook
  const { presets, customPresets, applyPreset, saveCustomPreset, deleteCustomPreset } = usePresets();

  // Handle preset application
  const handleApplyPreset = useCallback(
    (presetId: string) => {
      const presetTheme = applyPreset(presetId);
      if (presetTheme) {
        // Pulisci le proprietà di background non presenti nel preset
        const cleanedTheme = { ...presetTheme };
        
        // Se il preset ha un backgroundType specifico, rimuovi le proprietà degli altri tipi
        if (cleanedTheme.backgroundType === 'color') {
          // Rimuovi immagine, gradient e pattern
          cleanedTheme.backgroundImage = undefined;
          cleanedTheme.backgroundGradient = undefined;
          cleanedTheme.backgroundPattern = undefined;
        } else if (cleanedTheme.backgroundType === 'image') {
          // Rimuovi gradient e pattern, ma mantieni l'immagine se presente
          cleanedTheme.backgroundGradient = undefined;
          cleanedTheme.backgroundPattern = undefined;
        } else if (cleanedTheme.backgroundType === 'gradient') {
          // Rimuovi immagine e pattern
          cleanedTheme.backgroundImage = undefined;
          cleanedTheme.backgroundPattern = undefined;
        } else if (cleanedTheme.backgroundType === 'pattern') {
          // Rimuovi immagine e gradient
          cleanedTheme.backgroundImage = undefined;
          cleanedTheme.backgroundGradient = undefined;
        } else {
          // Se non c'è backgroundType nel preset, usa quello del preset o 'color' di default
          cleanedTheme.backgroundType = cleanedTheme.backgroundType || 'color';
          // Rimuovi tutte le proprietà di background non color
          cleanedTheme.backgroundImage = undefined;
          cleanedTheme.backgroundGradient = undefined;
          cleanedTheme.backgroundPattern = undefined;
        }
        
        setTheme(cleanedTheme);
        toast.success('Preset applicato con successo!');
      }
    },
    [applyPreset, setTheme]
  );

  // Handle save preset dialog
  const handleSavePresetClick = useCallback(() => {
    setShowSavePresetDialog(true);
  }, []);

  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) {
      toast.error('Inserisci un nome per il preset');
      return;
    }

    saveCustomPreset(presetName.trim(), presetDescription.trim(), theme);
    setShowSavePresetDialog(false);
    setPresetName('');
    setPresetDescription('');
    toast.success('Preset salvato con successo!');
  }, [presetName, presetDescription, theme, saveCustomPreset]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Render form preview content
  const previewContent = useMemo(() => (
    <FormPreview
      theme={theme}
      title={formTitle}
      description={formDescription}
      questions={questions}
    />
  ), [theme, formTitle, formDescription, questions]);

  return (
    <>
      <div className="flex flex-col bg-white rounded-lg overflow-hidden" style={{ backgroundColor: '#ffffff', maxHeight: '92vh' }}>
        {/* Header con categorie e quick actions */}
        <div className="mt-2 mb-2 px-4 flex-shrink-0">
          <CategoryHeader
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            canUndo={canUndo}
            canRedo={canRedo}
            isDirty={isDirty}
            onUndo={undo}
            onRedo={redo}
            onReset={resetTheme}
            onSavePreset={handleSavePresetClick}
          />
        </div>

        {/* Main Content: Sidebar + Preview - con altezza e larghezza responsive */}
        <div className="flex overflow-hidden customization-layout-container">
          {/* Sidebar laterale con controlli */}
          <div className="customization-sidebar">
            <CustomizationSidebar
              activeCategory={activeCategory}
              theme={theme}
              onThemeUpdate={updateTheme}
              presets={presets}
              customPresets={customPresets}
              onApplyPreset={handleApplyPreset}
              onDeletePreset={deleteCustomPreset}
            />
          </div>

          {/* Preview Canvas centrale */}
          <div className="customization-preview">
            <PreviewCanvas
              theme={theme}
              deviceFrame={deviceFrame}
              onDeviceFrameChange={setDeviceFrame}
              isLoading={isPreviewLoading}
            >
              {previewContent}
            </PreviewCanvas>
          </div>
        </div>
      </div>

      {/* Dialog per salvare preset personalizzato */}
      <Dialog open={showSavePresetDialog} onOpenChange={setShowSavePresetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salva Preset Personalizzato</DialogTitle>
            <DialogDescription>
              Salva la configurazione attuale come preset riutilizzabile
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Nome Preset</Label>
              <Input
                id="preset-name"
                placeholder="Es. Brand Aziendale"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preset-description">Descrizione (opzionale)</Label>
              <Textarea
                id="preset-description"
                placeholder="Breve descrizione del preset..."
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSavePresetDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleSavePreset}>
              Salva Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * FormPreview Component
 * Mostra uno slideshow con esempi di ogni tipo di domanda per vedere le personalizzazioni del tema
 */
interface FormPreviewProps {
  theme: Partial<ThemeV2>;
  title: string;
  description: string;
  questions: QuestionFormData[];
}

function FormPreview({ theme, title, description, questions }: FormPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const dragStartRef = React.useRef(0);
  const prevSlideRef = React.useRef(0);

  // Helper per ottenere lo stile del pattern
  const getPatternStyle = (pattern: string): string => {
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
  };

  // Helper per ottenere il background gradient
  const getGradientBackground = (gradient: ThemeV2['backgroundGradient']): string => {
    if (!gradient || !gradient.colors || gradient.colors.length === 0) return '';
    
    if (gradient.type === 'linear') {
      const angle = gradient.angle || 135;
      return `linear-gradient(${angle}deg, ${gradient.colors.join(', ')})`;
    } else {
      return `radial-gradient(circle, ${gradient.colors.join(', ')})`;
    }
  };

  // Determina il tipo di background
  const backgroundType = theme.backgroundType || (theme.backgroundImage ? 'image' : theme.backgroundGradient ? 'gradient' : theme.backgroundPattern && theme.backgroundPattern !== 'none' ? 'pattern' : 'color');

  // Domande di esempio per TUTTI i tipi configurabili
  const sampleQuestions: QuestionFormData[] = useMemo(() => [
    {
      id: 'sample-text',
      text: 'Hai suggerimenti o commenti aggiuntivi?',
      type: QuestionType.TEXT,
      required: false,
      order: 0,
    },
    {
      id: 'sample-multiple',
      text: 'Come valuteresti la tua esperienza?',
      type: QuestionType.MULTIPLE_CHOICE,
      required: true,
      options: ['Eccellente', 'Buona', 'Discreta', 'Scarsa'],
      order: 1,
    },
    {
      id: 'sample-rating',
      text: 'Quanto sei soddisfatto del servizio?',
      type: QuestionType.RATING,
      required: true,
      order: 2,
    },
    {
      id: 'sample-likert',
      text: 'Il prodotto rispetta le tue aspettative?',
      type: QuestionType.LIKERT,
      required: true,
      order: 3,
    },
    {
      id: 'sample-date',
      text: 'Quando preferisci essere contattato?',
      type: QuestionType.DATE,
      required: false,
      order: 4,
    },
    {
      id: 'sample-ranking',
      text: 'Ordina per importanza le seguenti caratteristiche:',
      type: QuestionType.RANKING,
      required: true,
      options: ['Qualità', 'Prezzo', 'Servizio', 'Design'],
      order: 5,
    },
    {
      id: 'sample-file',
      text: 'Carica un documento di supporto (opzionale)',
      type: QuestionType.FILE_UPLOAD,
      required: false,
      order: 6,
    },
    {
      id: 'sample-nps',
      text: 'Quanto probabilmente consiglieresti questo prodotto?',
      type: QuestionType.NPS,
      required: true,
      order: 7,
    },
    {
      id: 'sample-branching',
      text: 'Questa domanda appare solo se hai risposto positivamente alla precedente',
      type: QuestionType.BRANCHING,
      required: false,
      order: 8,
    },
  ], []);

  const totalSlides = sampleQuestions.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => {
      prevSlideRef.current = prev;
      setSlideDirection('right');
      return (prev + 1) % totalSlides;
    });
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => {
      prevSlideRef.current = prev;
      setSlideDirection('left');
      return (prev - 1 + totalSlides) % totalSlides;
    });
  }, [totalSlides]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide((prev) => {
      prevSlideRef.current = prev;
      const direction = index > prev ? 'right' : 'left';
      setSlideDirection(direction);
      return index;
    });
  }, []);

  // Gestione drag/swipe migliorata con listener globali
  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const offset = e.clientX - dragStartRef.current;
      setDragOffset(offset);
    };

    const handleGlobalMouseUp = () => {
      if (!isDragging) return;
      
      const threshold = 50; // Soglia minima per cambiare slide
      if (Math.abs(dragOffset) > threshold) {
        if (dragOffset > 0) {
          prevSlide();
        } else {
          nextSlide();
        }
      }
      
      setIsDragging(false);
      setDragOffset(0);
      setDragStart(0);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset, prevSlide, nextSlide]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = e.clientX;
    setDragStart(e.clientX);
    setDragOffset(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartRef.current = e.touches[0].clientX;
    setDragStart(e.touches[0].clientX);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const offset = e.touches[0].clientX - dragStartRef.current;
    setDragOffset(offset);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const threshold = 50;
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
    
    setIsDragging(false);
    setDragOffset(0);
    setDragStart(0);
  };

  return (
    <div
      className="w-full h-full flex flex-col min-h-0 p-4 relative overflow-hidden"
      style={{
        fontFamily: theme.fontFamily || 'Inter, system-ui, sans-serif',
        backgroundColor: backgroundType === 'color' ? theme.backgroundColor : undefined,
        backgroundImage: backgroundType === 'gradient' ? getGradientBackground(theme.backgroundGradient) : 
                        backgroundType === 'pattern' ? getPatternStyle(theme.backgroundPattern || 'none') : undefined,
        backgroundSize: backgroundType === 'pattern' ? '20px 20px' : undefined,
        backgroundPosition: backgroundType === 'pattern' ? '0 0' : undefined,
      }}
    >
      {/* Background image con blur */}
      {backgroundType === 'image' && theme.backgroundImage && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `url(${theme.backgroundImage})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            filter: theme.backgroundBlur && theme.backgroundBlur > 0 ? `blur(${theme.backgroundBlur}px)` : undefined,
          }}
        />
      )}

      {/* Background gradient con blur */}
      {backgroundType === 'gradient' && theme.backgroundGradient && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: getGradientBackground(theme.backgroundGradient),
            filter: theme.backgroundBlur && theme.backgroundBlur > 0 ? `blur(${theme.backgroundBlur}px)` : undefined,
          }}
        />
      )}

      {/* Background pattern con blur */}
      {backgroundType === 'pattern' && theme.backgroundPattern && theme.backgroundPattern !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: getPatternStyle(theme.backgroundPattern),
            backgroundSize: '20px 20px',
            opacity: 0.1,
            filter: theme.backgroundBlur && theme.backgroundBlur > 0 ? `blur(${theme.backgroundBlur}px)` : undefined,
          }}
        />
      )}

      {/* Overlay opacità backgroundImage */}
      {backgroundType === 'image' && theme.backgroundImage && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundColor: `rgba(255, 255, 255, ${1 - ((theme.backgroundOpacity || 100) / 100)})`,
          }}
        />
      )}

      {/* Overlay colorato personalizzato */}
      {theme.backgroundOverlay && theme.backgroundOverlay.opacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundColor: theme.backgroundOverlay.color,
            opacity: theme.backgroundOverlay.opacity,
          }}
        />
      )}
      
      <div className="relative z-10 w-full h-full flex flex-col min-h-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-2xl mx-auto flex-1 flex flex-col min-h-0"
        style={{
          maxWidth: theme.containerMaxWidth ? `${theme.containerMaxWidth}px` : '800px',
        }}
      >
        {/* Form Header */}
        {(title || description) && (
          <div
            className="mb-6 pb-6 border-b"
            style={{
              borderColor: theme.questionBorderColor || '#e5e7eb',
              marginBottom: theme.sectionSpacing ? `${theme.sectionSpacing}px` : '24px',
            }}
          >
            {title && (
              <motion.h1
                className="text-4xl font-bold mb-4"
                style={{
                  color: theme.primaryColor || '#3b82f6',
                  fontFamily: theme.headingFontFamily || theme.fontFamily,
                  fontSize: theme.questionFontSize ? `${theme.questionFontSize * 1.8}px` : '36px',
                  lineHeight: theme.lineHeight || 1.5,
                  letterSpacing: theme.letterSpacing ? `${theme.letterSpacing}px` : '0',
                }}
              >
                {title}
              </motion.h1>
            )}
            {description && (
              <p
                className="text-lg"
                style={{
                  color: theme.textColor || '#1f2937',
                  fontSize: theme.optionFontSize ? `${theme.optionFontSize * 1.1}px` : '17px',
                  lineHeight: theme.lineHeight || 1.5,
                }}
              >
                {description}
              </p>
            )}
          </div>
        )}

        {/* Slideshow Container */}
        <div className="relative flex-1 flex flex-col min-h-0">
          {/* Fixed Display Area for Cards */}
          <div
            className="relative overflow-hidden flex items-center justify-center select-none flex-1 min-h-0"
            style={{ 
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait" custom={slideDirection}>
              <motion.div
                key={currentSlide}
                custom={slideDirection}
                initial={{ 
                  opacity: 0,
                  x: slideDirection === 'right' ? '100%' : '-100%'
                }}
                animate={{ 
                  opacity: 1,
                  x: dragOffset || 0,
                }}
                exit={{ 
                  opacity: 0,
                  x: slideDirection === 'right' ? '-100%' : '100%'
                }}
                transition={{ 
                  duration: isDragging ? 0 : 0.45, 
                  ease: [0.4, 0, 0.2, 1],
                  opacity: { duration: 0.35 }
                }}
                className="absolute inset-0 flex items-center justify-center p-2 sm:p-4 overflow-hidden"
              >
                <div className="w-full h-full flex items-center justify-center overflow-auto">
                  <QuestionPreview
                    question={sampleQuestions[currentSlide]}
                    index={currentSlide}
                    theme={theme}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Navigation - Always in same position */}
          <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t" style={{ borderColor: theme.questionBorderColor || '#e5e7eb' }}>
            {/* Left Arrow */}
            <button
              type="button"
              onClick={prevSlide}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{
                backgroundColor: theme.primaryColor || '#3b82f6',
                color: '#ffffff',
              }}
              aria-label="Slide precedente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Slide Indicators and Counter */}
            <div className="flex flex-col items-center gap-2">
              {/* Slide Indicators */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {sampleQuestions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className="transition-all duration-200 hover:scale-125"
                    style={{
                      backgroundColor: index === currentSlide 
                        ? theme.primaryColor || '#3b82f6' 
                        : '#d1d5db',
                      width: index === currentSlide ? '32px' : '10px',
                      height: '10px',
                      borderRadius: index === currentSlide ? '5px' : '50%',
                    }}
                    aria-label={`Vai alla slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Slide Counter */}
              <div 
                className="flex items-center gap-2 text-sm font-medium" 
                style={{ 
                  color: theme.textColor || '#6b7280',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                }}
              >
                <span>{currentSlide + 1}</span>
                <span>/</span>
                <span>{totalSlides}</span>
              </div>
            </div>

            {/* Right Arrow */}
            <button
              type="button"
              onClick={nextSlide}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{
                backgroundColor: theme.primaryColor || '#3b82f6',
                color: '#ffffff',
              }}
              aria-label="Slide successiva"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  );
}

/**
 * QuestionPreview Component
 * Anteprima di una singola domanda
 */
interface QuestionPreviewProps {
  question: QuestionFormData;
  index: number;
  theme: Partial<ThemeV2>;
}

function QuestionPreview({ question, index, theme }: QuestionPreviewProps) {
  return (
    <div
      className="rounded-xl border w-full max-w-full"
      style={{
        gap: theme.questionSpacing ? `${theme.questionSpacing}px` : undefined,
        padding: `${theme.cardPadding || 24}px`,
        backgroundColor: theme.questionBackgroundColor || '#f9fafb',
        borderColor: theme.questionBorderColor || '#e5e7eb',
        borderRadius: theme.borderRadius ? `${theme.borderRadius}px` : '8px',
        borderWidth: theme.borderWidth ? `${theme.borderWidth}px` : '1px',
        borderStyle: theme.borderStyle || 'solid',
        boxShadow: theme.glowEffect?.enabled 
          ? `0 0 ${(theme.glowEffect.intensity || 50) / 5}px ${theme.glowEffect.color || theme.primaryColor}, 0 ${theme.shadowIntensity || 2}px ${(theme.shadowIntensity || 2) * 4}px rgba(0,0,0,0.1)`
          : `0 ${theme.shadowIntensity || 2}px ${(theme.shadowIntensity || 2) * 4}px rgba(0,0,0,0.1)`,
        transition: theme.enableTransitions !== false ? 'all 300ms' : undefined,
      }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
          style={{
            backgroundColor: theme.primaryColor || '#3b82f6',
            color: theme.questionNumberTextColor || '#ffffff',
          }}
        >
          {index + 1}
        </div>
        <div className="flex-1">
          <h3
            style={{
              fontFamily: theme.headingFontFamily || theme.fontFamily || 'Inter, system-ui, sans-serif',
              color: theme.questionTextColor || theme.textColor || '#1f2937',
              fontSize: theme.questionFontSize ? `${theme.questionFontSize}px` : '18px',
              fontWeight: theme.questionFontWeight === 'normal' ? 400 : theme.questionFontWeight === 'medium' ? 500 : theme.questionFontWeight === 'bold' ? 700 : 600,
              lineHeight: theme.lineHeight || 1.5,
              letterSpacing: theme.letterSpacing ? `${theme.letterSpacing}px` : '0',
            }}
          >
            {question.text}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </h3>
        </div>
      </div>

      {/* Render diversi tipi di input in base al tipo di domanda */}
      {renderQuestionInput(question, theme)}
    </div>
  );
}

/**
 * Render input appropriato in base al tipo di domanda
 */
function renderQuestionInput(question: QuestionFormData, theme: Partial<ThemeV2>) {
  const optionStyle = {
    fontFamily: theme.fontFamily || 'Inter, system-ui, sans-serif',
    borderColor: theme.optionBorderColor || '#d1d5db',
    borderRadius: theme.borderRadius ? `${theme.borderRadius}px` : '8px',
    fontSize: theme.optionFontSize ? `${theme.optionFontSize}px` : '16px',
    color: theme.optionTextColor || theme.textColor,
  };

  switch (question.type) {
    case QuestionType.MULTIPLE_CHOICE:
      return (
        <div className="space-y-2" style={{ gap: theme.optionSpacing ? `${theme.optionSpacing}px` : '12px' }}>
          {question.options?.map((option, idx) => (
            <motion.label
              key={idx}
              whileHover={{ scale: theme.hoverEffect ? (theme.hoverScale || 1.02) : 1 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all"
              style={{
                ...optionStyle,
                backgroundColor: idx === 0 ? theme.optionSelectedColor || '#dbeafe' : 'transparent',
              }}
            >
              <input
                type="radio"
                checked={idx === 0}
                readOnly
                className="w-4 h-4"
                style={{ accentColor: theme.primaryColor || '#3b82f6' }}
              />
              <span>{option}</span>
            </motion.label>
          ))}
        </div>
      );

    case QuestionType.RATING:
      return (
        <div className="flex space-x-2" style={{ gap: theme.optionSpacing ? `${theme.optionSpacing}px` : '12px' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.div
              key={star}
              whileHover={{ scale: theme.hoverEffect ? (theme.hoverScale || 1.05) : 1 }}
              transition={{ duration: 0.2 }}
            >
              <Star
                className="w-8 h-8 cursor-pointer"
                style={{
                  fill: star <= 3 ? theme.primaryColor || '#3b82f6' : 'none',
                  color: star <= 3 ? theme.primaryColor || '#3b82f6' : '#d1d5db',
                }}
              />
            </motion.div>
          ))}
        </div>
      );

    case QuestionType.LIKERT:
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: theme.textColor || '#6b7280' }}>
              Per niente d'accordo
            </span>
            <span className="text-sm" style={{ color: theme.textColor || '#6b7280' }}>
              Completamente d'accordo
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <motion.button
                key={value}
                type="button"
                whileHover={{ scale: theme.hoverEffect ? (theme.hoverScale || 1.05) : 1 }}
                transition={{ duration: 0.2 }}
                className="h-12 flex flex-col items-center justify-center border rounded-lg transition-all"
                style={{
                  backgroundColor: value === 3 ? theme.optionSelectedColor || '#dbeafe' : 'transparent',
                  borderColor: theme.optionBorderColor || '#d1d5db',
                  borderRadius: theme.borderRadius ? `${theme.borderRadius}px` : '8px',
                  color: theme.optionTextColor || theme.textColor || '#1f2937',
                }}
              >
                <span className="text-sm font-medium">{value}</span>
              </motion.button>
            ))}
          </div>
        </div>
      );

    case QuestionType.TEXT:
      return (
        <textarea
          placeholder="Scrivi la tua risposta..."
          rows={4}
          className="w-full p-4 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
          style={{
            ...optionStyle,
            fontFamily: theme.fontFamily,
            backgroundColor: 'white',
            '--tw-ring-color': theme.primaryColor || '#3b82f6',
          } as React.CSSProperties & { '--tw-ring-color'?: string }}
        />
      );

    case QuestionType.DATE:
      return (
        <div className="relative">
          <Input
            type="date"
            className="w-full p-4 rounded-lg border focus:outline-none focus:ring-2 transition-all"
            style={{
              ...optionStyle,
              fontFamily: theme.fontFamily,
              backgroundColor: 'white',
            }}
          />
          <Calendar
            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
            style={{ color: theme.textColor || '#6b7280' }}
          />
        </div>
      );

    case QuestionType.RANKING:
      return (
        <div className="space-y-2" style={{ gap: theme.optionSpacing ? `${theme.optionSpacing}px` : '12px' }}>
          {question.options?.map((option, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: theme.hoverEffect ? (theme.hoverScale || 1.02) : 1 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 p-4 rounded-xl border"
              style={{
                ...optionStyle,
                backgroundColor: 'transparent',
              }}
            >
              <GripVertical className="w-5 h-5" style={{ color: theme.textColor || '#6b7280' }} />
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
                style={{
                  backgroundColor: theme.primaryColor || '#3b82f6',
                  color: theme.questionNumberTextColor || '#ffffff',
                }}
              >
                {idx + 1}
              </div>
              <span>{option}</span>
            </motion.div>
          ))}
        </div>
      );

    case QuestionType.FILE_UPLOAD:
      return (
        <motion.div
          whileHover={{ scale: theme.hoverEffect ? (theme.hoverScale || 1.01) : 1 }}
          transition={{ duration: 0.2 }}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all"
          style={{
            borderColor: theme.optionBorderColor || '#d1d5db',
            borderRadius: theme.borderRadius ? `${theme.borderRadius}px` : '8px',
            backgroundColor: 'transparent',
          }}
        >
          <Upload
            className="mx-auto h-12 w-12 mb-4"
            style={{ color: theme.primaryColor || '#3b82f6' }}
          />
          <p className="text-sm mb-2" style={{ color: theme.textColor || '#1f2937' }}>
            Trascina un file qui o clicca per selezionarlo
          </p>
          <p className="text-xs" style={{ color: theme.textColor || '#6b7280' }}>
            Supporto per un singolo file
          </p>
        </motion.div>
      );

    case QuestionType.NPS:
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: theme.textColor || '#6b7280' }}>
              Per niente probabile
            </span>
            <span className="text-sm" style={{ color: theme.textColor || '#6b7280' }}>
              Estremamente probabile
            </span>
          </div>
          <div className="flex justify-between items-center gap-1">
            {Array.from({ length: 11 }, (_, i) => (
              <motion.button
                key={i}
                type="button"
                whileHover={{ scale: theme.hoverEffect ? (theme.hoverScale || 1.1) : 1 }}
                transition={{ duration: 0.2 }}
                className="w-10 h-10 rounded-full border flex items-center justify-center text-sm font-medium transition-all"
                style={{
                  backgroundColor: i === 7 ? theme.optionSelectedColor || '#dbeafe' : 'transparent',
                  borderColor: theme.optionBorderColor || '#d1d5db',
                  borderRadius: theme.borderRadius ? `${theme.borderRadius}px` : '50%',
                  color: theme.optionTextColor || theme.textColor || '#1f2937',
                }}
              >
                {i}
              </motion.button>
            ))}
          </div>
        </div>
      );

    case QuestionType.BRANCHING:
      return (
        <div className="p-6 rounded-lg border-2 border-dashed text-center" style={{
          borderColor: theme.primaryColor || '#3b82f6',
          borderRadius: theme.borderRadius ? `${theme.borderRadius}px` : '8px',
          backgroundColor: theme.questionBackgroundColor || '#f9fafb',
        }}>
          <p className="text-sm mb-2" style={{ color: theme.textColor || '#1f2937' }}>
            Domanda condizionale
          </p>
          <p className="text-xs" style={{ color: theme.textColor || '#6b7280' }}>
            Questa domanda appare solo se hai risposto positivamente alla precedente
          </p>
        </div>
      );

    default:
      return (
        <input
          type="text"
          placeholder="Risposta..."
          className="w-full p-4 rounded-lg border focus:outline-none focus:ring-2 transition-all"
          style={{
            ...optionStyle,
            fontFamily: theme.fontFamily,
            backgroundColor: 'white',
          }}
        />
      );
  }
}


// Export per uso in form builder
export default FormCustomizationV2;
