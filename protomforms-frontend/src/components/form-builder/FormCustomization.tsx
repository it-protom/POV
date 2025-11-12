import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Palette, 
  Type, 
  Image as ImageIcon, 
  Upload, 
  X, 
  Eye, 
  Droplet,
  Layout,
  Sparkles,
  Move,
  GripVertical,
  Pen,
  EyeOff,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Plus,
  FileText,
  CheckCircle,
  MousePointer2,
  Maximize2,
  Wand2,
  Settings,
  Star
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface Theme {
  // Colori base
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  
  // Tipografia
  fontFamily: string;
  questionFontSize?: number; // Dimensione font domanda (default 20)
  optionFontSize?: number; // Dimensione font opzioni (default 16)
  questionFontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  counterFontSize?: number; // Dimensione font contatore (default 14)
  
  // Stile domanda
  questionNumberBgColor?: string; // Colore sfondo numero domanda
  questionNumberTextColor?: string; // Colore testo numero domanda  
  questionTextColor?: string; // Colore testo domanda
  questionBorderColor?: string; // Colore bordo card domanda
  questionBackgroundColor?: string; // Colore sfondo card domanda
  
  // Stile opzioni
  optionTextColor?: string; // Colore testo opzioni
  optionHoverColor?: string; // Colore hover opzioni
  optionSelectedColor?: string; // Colore opzione selezionata
  optionBorderColor?: string; // Colore bordo opzioni
  radioCheckColor?: string; // Colore radio/checkbox
  
  // Bottoni
  buttonStyle: 'filled' | 'outlined';
  buttonTextColor?: string; // Colore testo bottone principale
  buttonHoverColor?: string; // Colore hover bottone principale
  navigationButtonBgColor?: string; // Colore sfondo bottoni navigazione
  navigationButtonTextColor?: string; // Colore testo bottoni navigazione
  navigationButtonBorderColor?: string; // Colore bordo bottoni navigazione
  disabledButtonColor?: string; // Colore bottone disabilitato
  
  // Bordi e spacing
  borderRadius: number;
  cardPadding?: number; // Padding card domanda (default 24)
  optionSpacing?: number; // Spazio tra opzioni (default 12)
  borderWidth?: number; // Spessore bordi (default 1)
  
  // Immagini e layout
  headerImage: string;
  logo: string;
  backgroundImage: string;
  backgroundPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top left' | 'top right' | 'bottom left' | 'bottom right';
  backgroundSize?: 'cover' | 'contain' | 'auto' | 'repeat';
  backgroundAttachment?: 'fixed' | 'scroll';
  backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
  backgroundOpacity?: number;
  headerImageHeight?: number;
  logoSize?: number;
  logoPosition?: 'left' | 'center' | 'right' | 'above-title' | 'below-title';
  layoutOrder?: string[];
  
  // Contatore domande
  counterTextColor?: string; // Colore contatore "Domanda X di Y"
  counterBgColor?: string; // Colore sfondo contatore
  
  // Effetti
  shadowIntensity?: number; // Intensità ombra card (0-10, default 2)
  hoverEffect?: boolean; // Abilita effetto hover su opzioni
  backgroundBlur?: number; // Effetto sfocatura (0-50px)
  backgroundOverlay?: {
    color: string; // Colore sovrapposizione
    opacity: number; // Opacità (0-1)
  };
}

interface Question {
  id: string;
  text: string;
  type: string;
  required: boolean;
  options?: any;
}

interface FormCustomizationProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  formTitle?: string;
  formDescription?: string;
  questions?: Question[]; // Domande reali del form
}

const availableFonts = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Raleway',
  'Nunito',
  'Playfair Display',
  'Merriweather',
  'Source Sans Pro',
  'Ubuntu',
  'Crimson Text',
  'Dancing Script',
  'Oswald',
  'Lora'
];

interface DraggableImageProps {
  image: string;
  onRemove: () => void;
  onDrop: (file: File) => void;
  label: string;
  description: string;
  previewClass?: string;
  aspectRatio?: string;
}

const DraggableImageUpload: React.FC<DraggableImageProps> = ({
  image,
  onRemove,
  onDrop,
  label,
  description,
  previewClass = "w-full h-48",
  aspectRatio = "aspect-video"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onDrop(file);
    } else {
      toast.error('Seleziona un file immagine valido');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onDrop(file);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {image ? (
        <div className="relative group">
          <div className={cn("relative rounded-lg overflow-hidden border-2 border-gray-200", previewClass, aspectRatio)}>
            <img
              src={image}
              alt={label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/90 hover:bg-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Sostituisci
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onRemove}
                  className="bg-red-500/90 hover:bg-red-500"
                >
                  <X className="h-4 w-4 mr-2" />
                  Rimuovi
                </Button>
              </div>
            </div>
            <div className="absolute top-2 right-2">
              <div className="bg-black/60 rounded-full p-1.5">
                <GripVertical className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
            isDragging 
              ? "border-[#FFCD00] bg-[#FFCD00]/5 scale-105" 
              : "border-gray-300 hover:border-gray-400 bg-gray-50/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-3">
            {isDragging ? (
              <>
                <Move className="h-12 w-12 text-[#FFCD00] animate-bounce" />
                <p className="text-sm font-medium text-[#FFCD00]">Rilascia l'immagine qui</p>
              </>
            ) : (
              <>
                <div className="relative">
                  <Upload className="h-12 w-12 text-gray-400" />
                  <Sparkles className="h-6 w-6 text-[#FFCD00] absolute -top-1 -right-1" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Trascina un'immagine qui o <span className="text-[#FFCD00]">clicca per caricare</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Max 5MB, formato JPG/PNG/SVG</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
};

export function FormCustomization({ 
  theme, 
  onThemeChange, 
  formTitle = 'Titolo Form', 
  formDescription = 'Descrizione del form',
  questions = [] 
}: FormCustomizationProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'images' | 'layout' | 'questions' | 'options' | 'buttons' | 'spacing'>('colors');
  const [editingElement, setEditingElement] = useState<'title' | 'font' | 'primaryColor' | 'backgroundColor' | 'textColor' | 'button' | null>(null);
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPreviewStep, setCurrentPreviewStep] = useState(0);
  
  // NUOVO: Sistema Click-to-Edit
  const [clickToEditMode, setClickToEditMode] = useState(true); // Attivo di default
  const [selectedElement, setSelectedElement] = useState<{
    type: 'background' | 'question' | 'option' | 'button' | 'questionText' | 'optionStyle' | null;
  }>({ type: null });
  
  // Gestione click su elemento
  const handleElementClick = (e: React.MouseEvent, elementType: typeof selectedElement.type) => {
    e.stopPropagation();
    if (!clickToEditMode && !isEditMode) return;
    setSelectedElement({ type: selectedElement.type === elementType ? null : elementType });
  };
  
  // Chiudi popup quando clicchi fuori
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-editable]') && !target.closest('[data-edit-popup]')) {
        setSelectedElement({ type: null });
      }
    };
    
    if ((clickToEditMode || isEditMode) && selectedElement.type) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [clickToEditMode, isEditMode, selectedElement.type]);
  
  // Componente Popup Custom
  const EditPopup = ({ type, onClose }: { type: string; onClose: () => void }) => (
    <div 
      data-edit-popup 
      className="fixed top-20 right-4 z-50 bg-white rounded-lg shadow-2xl border-2 border-[#FFCD00] p-4 max-w-sm w-full max-h-[70vh] overflow-y-auto animate-in slide-in-from-right duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-[#FFCD00]" />
          {type === 'background' && 'Modifica Sfondo'}
          {type === 'question' && 'Modifica Domanda'}
          {type === 'questionText' && 'Stile Testo Domanda'}
          {type === 'option' && 'Modifica Opzioni'}
          {type === 'optionStyle' && 'Stile Opzioni'}
          {type === 'button' && 'Modifica Bottone'}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        {/* SFONDO */}
        {type === 'background' && (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Colore Sfondo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.backgroundColor}
                  onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={theme.backgroundColor}
                  onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Colore Testo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.textColor}
                  onChange={(e) => updateTheme({ textColor: e.target.value })}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={theme.textColor}
                  onChange={(e) => updateTheme({ textColor: e.target.value })}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
          </>
        )}
        
        {/* DOMANDA CARD */}
        {type === 'question' && (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Colore Sfondo Domanda</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.questionBackgroundColor || '#ffffff'}
                  onChange={(e) => updateTheme({ questionBackgroundColor: e.target.value })}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={theme.questionBackgroundColor || '#ffffff'}
                  onChange={(e) => updateTheme({ questionBackgroundColor: e.target.value })}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Colore Bordo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.questionBorderColor || '#e5e7eb'}
                  onChange={(e) => updateTheme({ questionBorderColor: e.target.value })}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={theme.questionBorderColor || '#e5e7eb'}
                  onChange={(e) => updateTheme({ questionBorderColor: e.target.value })}
                  placeholder="#e5e7eb"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Arrotondamento Angoli: {theme.borderRadius}px</Label>
              <Slider
                value={[theme.borderRadius]}
                onValueChange={([value]) => updateTheme({ borderRadius: value })}
                min={0}
                max={32}
                step={2}
                className="w-full"
              />
            </div>
          </>
        )}
        
        {/* TESTO DOMANDA */}
        {type === 'questionText' && (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Colore Testo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.questionTextColor || theme.textColor}
                  onChange={(e) => updateTheme({ questionTextColor: e.target.value })}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={theme.questionTextColor || theme.textColor}
                  onChange={(e) => updateTheme({ questionTextColor: e.target.value })}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Dimensione Testo: {theme.questionFontSize || 20}px</Label>
              <Slider
                value={[theme.questionFontSize || 20]}
                onValueChange={([value]) => updateTheme({ questionFontSize: value })}
                min={14}
                max={32}
                step={2}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Peso Font</Label>
              <Select
                value={theme.questionFontWeight || 'semibold'}
                onValueChange={(value: any) => updateTheme({ questionFontWeight: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normale</SelectItem>
                  <SelectItem value="medium">Medio</SelectItem>
                  <SelectItem value="semibold">Semi-grassetto</SelectItem>
                  <SelectItem value="bold">Grassetto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        
        {/* OPZIONI */}
        {type === 'optionStyle' && (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Colore Testo Opzioni</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.optionTextColor || theme.textColor}
                  onChange={(e) => updateTheme({ optionTextColor: e.target.value })}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={theme.optionTextColor || theme.textColor}
                  onChange={(e) => updateTheme({ optionTextColor: e.target.value })}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Colore Selezione</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.optionSelectedColor || theme.primaryColor}
                  onChange={(e) => updateTheme({ optionSelectedColor: e.target.value })}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={theme.optionSelectedColor || theme.primaryColor}
                  onChange={(e) => updateTheme({ optionSelectedColor: e.target.value })}
                  placeholder={theme.primaryColor}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Dimensione Font: {theme.optionFontSize || 16}px</Label>
              <Slider
                value={[theme.optionFontSize || 16]}
                onValueChange={([value]) => updateTheme({ optionFontSize: value })}
                min={12}
                max={24}
                step={1}
                className="w-full"
              />
            </div>
          </>
        )}
        
        {/* BOTTONE */}
        {type === 'button' && (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Stile Bottone</Label>
              <Select
                value={theme.buttonStyle}
                onValueChange={(value: 'filled' | 'outlined') => updateTheme({ buttonStyle: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filled">Pieno</SelectItem>
                  <SelectItem value="outlined">Contorno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Colore Principale</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.primaryColor}
                  onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={theme.primaryColor}
                  onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                  placeholder="#FFCD00"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Colore Testo Bottone</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.buttonTextColor || '#ffffff'}
                  onChange={(e) => updateTheme({ buttonTextColor: e.target.value })}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={theme.buttonTextColor || '#ffffff'}
                  onChange={(e) => updateTheme({ buttonTextColor: e.target.value })}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Arrotondamento: {theme.borderRadius}px</Label>
              <Slider
                value={[theme.borderRadius]}
                onValueChange={([value]) => updateTheme({ borderRadius: value })}
                min={0}
                max={32}
                step={2}
                className="w-full"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Filtra domande valide
  const validQuestions = questions?.filter(q => q.text && q.text.trim() !== '') || [];
  const currentQuestion = validQuestions[currentPreviewStep];

  // Debug: log delle domande ricevute
  useEffect(() => {
    console.log('📋 FormCustomization - Domande ricevute:', {
      count: questions?.length || 0,
      questions: questions?.map(q => ({ id: q.id, text: q.text?.substring(0, 30), type: q.type }))
    });
  }, [questions]);

  // Sensori per drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Gestione drag end per riordinare elementi
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const order = getLayoutOrder();
    const oldIndex = order.indexOf(active.id as string);
    const newIndex = order.indexOf(over.id as string);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(order, oldIndex, newIndex);
      updateTheme({ layoutOrder: newOrder });
    }
  };

  // Carica i font Google Fonts dinamicamente
  useEffect(() => {
    const fontFamilies = availableFonts.join('&family=').replace(/ /g, '+');
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}:wght@300;400;500;600;700&display=swap`;
    link.rel = 'stylesheet';
    link.setAttribute('data-font-loader', 'all-fonts');
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (theme.fontFamily) {
      const fontId = `font-${theme.fontFamily}`;
      const existingLink = document.querySelector(`link[data-font-loader="${fontId}"]`);
      
      if (!existingLink) {
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${theme.fontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`;
        link.rel = 'stylesheet';
        link.setAttribute('data-font-loader', fontId);
        document.head.appendChild(link);
      }
    }
  }, [theme.fontFamily]);

  const updateTheme = (updates: Partial<Theme>) => {
    onThemeChange({ ...theme, ...updates });
  };

  // Ottieni l'ordine degli elementi (default se non specificato)
  const getLayoutOrder = (): string[] => {
    const order = theme.layoutOrder || ['logo', 'title', 'description'];
    // Rimuovi 'header' se presente (non più supportato)
    return order.filter(element => element !== 'header');
  };

  // Sposta un elemento nell'ordine
  const moveElement = (element: string, direction: 'up' | 'down') => {
    const order = getLayoutOrder();
    const index = order.indexOf(element);
    if (index === -1) return;

    const newOrder = [...order];
    if (direction === 'up' && index > 0) {
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    updateTheme({ layoutOrder: newOrder });
  };

  // Componente Sortable per gli elementi del layout
  const SortableLayoutElement = ({ id, children }: { id: string; children: React.ReactNode }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id, disabled: !isEditMode });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    if (!isEditMode) {
      return <>{children}</>;
    }

    return (
      <div ref={setNodeRef} style={style} className="relative group">
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-8 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-40 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-5 w-5 text-gray-400 hover:text-[#FFCD00]" />
        </div>
        {children}
      </div>
    );
  };

  // Helper per renderizzare il contenuto del popover del logo
  const renderLogoPopoverContent = () => (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">Logo</Label>
      {theme.logo ? (
        <>
          <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 p-4 bg-gray-50 flex items-center justify-center">
            <img
              src={theme.logo}
              alt="Logo preview"
              className="w-auto object-contain"
              style={{ 
                height: theme.logoSize ? `${(theme.logoSize / 100) * 96}px` : '96px',
                maxHeight: '96px'
              }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Dimensione Logo: {theme.logoSize || 100}%</Label>
            <Slider
              value={[theme.logoSize || 100]}
              onValueChange={([value]) => updateTheme({ logoSize: value })}
              min={50}
              max={200}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>50%</span>
              <span>200%</span>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs font-medium">Posizione Logo</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={theme.logoPosition === 'left' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => updateTheme({ logoPosition: 'left' })}
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Sinistra
              </Button>
              <Button
                type="button"
                variant={theme.logoPosition === 'center' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => updateTheme({ logoPosition: 'center' })}
              >
                Centro
              </Button>
              <Button
                type="button"
                variant={theme.logoPosition === 'right' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => updateTheme({ logoPosition: 'right' })}
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Destra
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                type="button"
                variant={theme.logoPosition === 'above-title' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => updateTheme({ logoPosition: 'above-title' })}
              >
                <ArrowUp className="h-3 w-3 mr-1" />
                Sopra Titolo
              </Button>
              <Button
                type="button"
                variant={theme.logoPosition === 'below-title' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => updateTheme({ logoPosition: 'below-title' })}
              >
                <ArrowDown className="h-3 w-3 mr-1" />
                Sotto Titolo
              </Button>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs font-medium">Ordine Elementi</Label>
            <div className="flex flex-col gap-1">
              {getLayoutOrder().map((element, index) => (
                <div key={element} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <span className="flex-1 text-xs capitalize">{element === 'logo' ? 'Logo' : element === 'title' ? 'Titolo' : 'Descrizione'}</span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => moveElement(element, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => moveElement(element, 'down')}
                      disabled={index === getLayoutOrder().length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Separator />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleImageUpload('logo', file);
                };
                input.click();
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Sostituisci
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removeImage('logo')}
            >
              <X className="h-4 w-4 mr-2" />
              Rimuovi
            </Button>
          </div>
        </>
      ) : (
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-[#FFCD00]/50 transition-colors"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleImageUpload('logo', file);
            };
            input.click();
          }}
        >
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Clicca per caricare logo</p>
          <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG/SVG</p>
        </div>
      )}
    </div>
  );
  
  const togglePopover = (key: string) => {
    setOpenPopovers(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Chiudi tutti i popover quando si disattiva la modalità modifica
  useEffect(() => {
    if (!isEditMode) {
      setOpenPopovers({});
      setEditingElement(null);
    }
  }, [isEditMode]);
  
  // Resetta editingElement quando si cambia tab
  useEffect(() => {
    setEditingElement(null);
  }, [activeTab]);

  const handleImageUpload = (field: 'headerImage' | 'logo' | 'backgroundImage', file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Seleziona un file immagine valido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'immagine non deve superare 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateTheme({ [field]: base64String });
      toast.success('Immagine caricata con successo! ✨');
    };
    reader.onerror = () => {
      toast.error('Errore durante il caricamento dell\'immagine');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (field: 'headerImage' | 'logo' | 'backgroundImage') => {
    updateTheme({ [field]: '' });
    toast.success('Immagine rimossa');
  };

  const tabs = [
    { id: 'colors', label: 'Colori Base', icon: Palette },
    { id: 'questions', label: 'Domande', icon: FileText },
    { id: 'options', label: 'Opzioni', icon: CheckCircle },
    { id: 'buttons', label: 'Bottoni', icon: MousePointer2 },
    { id: 'typography', label: 'Tipografia', icon: Type },
    { id: 'spacing', label: 'Spaziatura', icon: Maximize2 },
    { id: 'images', label: 'Immagini', icon: ImageIcon },
    { id: 'layout', label: 'Layout', icon: Layout },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Popup Custom per Click-to-Edit */}
      {(clickToEditMode || isEditMode) && selectedElement.type && (
        <EditPopup 
          type={selectedElement.type} 
          onClose={() => setSelectedElement({ type: null })} 
        />
      )}
      
      {/* Preview */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-[#FFCD00]" />
                Anteprima Live
              </CardTitle>
              {(clickToEditMode || isEditMode) && (
                <span className="text-xs bg-[#FFCD00]/20 text-[#FFCD00] px-2 py-1 rounded-full font-medium flex items-center gap-1">
                  <Wand2 className="h-3 w-3" />
                  Clicca per modificare
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isEditMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
                className={isEditMode ? "bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black" : ""}
              >
                {isEditMode ? (
                  <>
                    <Pen className="h-4 w-4 mr-2" />
                    Modalità Modifica
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Solo Visualizzazione
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Nascondi' : 'Mostra'}
              </Button>
            </div>
          </div>
          <CardDescription>
            {isEditMode 
              ? "Modalità modifica attiva: clicca direttamente sugli elementi per modificarli!"
              : "Visualizzazione anteprima: attiva la modalità modifica per personalizzare gli elementi"
            }
          </CardDescription>
        </CardHeader>
        {showPreview && (
          <CardContent>
            <Popover open={isEditMode && openPopovers.background} onOpenChange={(open) => isEditMode && setOpenPopovers(prev => ({ ...prev, background: open }))}>
              <PopoverTrigger asChild>
                <div
                  data-editable="background"
                  className={`relative border-2 rounded-lg p-6 space-y-4 min-h-[400px] overflow-hidden group transition-all duration-300 ${
                    (clickToEditMode || isEditMode) ? 'cursor-pointer' : 'cursor-default'
                  } ${
                    selectedElement.type === 'background'
                      ? 'border-[#FFCD00] ring-4 ring-[#FFCD00]/20 shadow-[0_0_20px_rgba(255,205,0,0.3)]' 
                      : isEditMode && openPopovers.background 
                      ? 'border-[#FFCD00] ring-4 ring-[#FFCD00]/20 shadow-[0_0_20px_rgba(255,205,0,0.3)]' 
                      : 'border-gray-200'
                  }`}
                  style={{
                    fontFamily: `"${theme.fontFamily}", sans-serif`,
                    backgroundColor: theme.backgroundColor,
                    color: theme.textColor,
                    backgroundImage: theme.backgroundImage 
                      ? `url(${theme.backgroundImage})` 
                      : undefined,
                    backgroundPosition: theme.backgroundPosition || 'center',
                    backgroundSize: theme.backgroundSize || 'cover',
                    backgroundRepeat: theme.backgroundRepeat || 'no-repeat',
                    backgroundAttachment: theme.backgroundAttachment || 'fixed',
                  }}
                  onClick={(e) => {
                    if (!(clickToEditMode || isEditMode)) return;
                    
                    const target = e.target as HTMLElement;
                    const currentTarget = e.currentTarget as HTMLElement;
                    
                    // Se clicchi su un elemento editable, non aprire lo sfondo
                    const clickableElements = target.closest('[data-editable]');
                    
                    // Solo apri popup sfondo se clicchi direttamente sul container
                    if (!clickableElements || clickableElements === currentTarget) {
                      handleElementClick(e, 'background');
                    }
                  }}
                >
              {/* Overlay per indicare che lo sfondo è cliccabile */}
              {(clickToEditMode || isEditMode) && (
                <div 
                  className={`absolute inset-0 pointer-events-none transition-all duration-200 ${
                    selectedElement.type === 'background' 
                      ? 'bg-[#FFCD00]/10' 
                      : 'bg-transparent group-hover:bg-[#FFCD00]/5'
                  }`}
                />
              )}
              
              {/* Badge per indicare sfondo cliccabile */}
              {(clickToEditMode || isEditMode) && selectedElement.type !== 'background' && (
                <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  <span className="text-xs bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-full font-medium shadow-sm flex items-center gap-1">
                    <Palette className="h-3 w-3" />
                    Clicca per modificare lo sfondo
                  </span>
                </div>
              )}
              
              {/* Indicatore cliccabile per font globale */}
              {isEditMode && (
                <Popover open={openPopovers.font} onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, font: open }))}>
                  <PopoverTrigger asChild>
                    <div 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePopover('font');
                      }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white text-xs px-2 py-1"
                      >
                        <Type className="h-3 w-3 mr-1" />
                        Font
                      </Button>
                    </div>
                  </PopoverTrigger>
                <PopoverContent className="w-80" align="end" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Font Family</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                      {availableFonts.map((font) => (
                        <button
                          key={font}
                          onClick={() => updateTheme({ fontFamily: font })}
                          className={cn(
                            "p-2 rounded-lg border-2 transition-all text-left hover:scale-105",
                            theme.fontFamily === font
                              ? "border-[#FFCD00] bg-[#FFCD00]/10 ring-2 ring-[#FFCD00]/20"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                          style={{ fontFamily: font }}
                        >
                          <div className="font-medium text-xs">{font}</div>
                          <div className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: font }}>
                            Aa
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              )}
              {/* Overlay per opacità background */}
              {theme.backgroundImage && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundColor: `rgba(255, 255, 255, ${1 - (theme.backgroundOpacity || 100) / 100})`,
                  }}
                />
              )}
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={getLayoutOrder()} strategy={verticalListSortingStrategy}>
                  <div className="relative z-10 space-y-4">
                    {/* Renderizza gli elementi in base all'ordine del layout */}
                    {getLayoutOrder().map((element) => {
                  // Non mostrare mai titolo e descrizione nelle card di anteprima
                  if (element === 'title' || element === 'description') {
                    return null;
                  }
                  
                  // Render Logo e Titolo insieme se sono nella stessa posizione
                  if (element === 'logo' || element === 'title') {
                    const logoPosition = theme.logoPosition || 'left';
                    const showLogo = theme.logo || isEditMode;
                    const showTitle = true;
                    const logoBeforeTitle = getLayoutOrder().indexOf('logo') < getLayoutOrder().indexOf('title');
                    
                    // Se logo è sopra o sotto il titolo, renderizzali separatamente
                    if (logoPosition === 'above-title' && showLogo && logoBeforeTitle) {
                      return (
                        <React.Fragment key="logo-above">
                          {(theme.logo || isEditMode) && (
                            <Popover open={isEditMode && openPopovers.logo} onOpenChange={(open) => isEditMode && setOpenPopovers(prev => ({ ...prev, logo: open }))}>
                              <PopoverTrigger asChild>
                                <div className={`mb-4 relative group ${theme.logo ? 'inline-block' : isEditMode ? 'inline-block' : 'hidden'} ${isEditMode ? 'cursor-pointer' : 'cursor-default'} w-full text-center`}>
                                  {theme.logo ? (
                                    <div
                                      data-editable="logo"
                                      className={`rounded transition-all p-2 -m-2 inline-block ${
                                        isEditMode ? 'hover:ring-2 hover:ring-[#FFCD00]/50' : ''
                                      }`}
                                      onClick={(e) => {
                                        if (!isEditMode) return;
                                        e.stopPropagation();
                                        togglePopover('logo');
                                      }}
                                    >
                                      <img
                                        src={theme.logo}
                                        alt="Logo"
                                        className="w-auto object-contain"
                                        data-editable="logo"
                                        style={{ 
                                          height: theme.logoSize ? `${(theme.logoSize / 100) * 64}px` : '64px'
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      className={`h-16 w-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50/50 transition-all inline-block ${
                                        isEditMode ? 'hover:border-[#FFCD00]/50 cursor-pointer' : 'cursor-default'
                                      }`}
                                      onClick={(e) => {
                                        if (!isEditMode) return;
                                        e.stopPropagation();
                                        // Apri direttamente il file picker quando si clicca sul placeholder
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.onchange = (e) => {
                                          const file = (e.target as HTMLInputElement).files?.[0];
                                          if (file) handleImageUpload('logo', file);
                                        };
                                        input.click();
                                      }}
                                    >
                                      <div className="text-center">
                                        <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                        {isEditMode && <p className="text-xs text-gray-500">Logo</p>}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" align="start" onClick={(e) => e.stopPropagation()}>
                                {renderLogoPopoverContent()}
                              </PopoverContent>
                            </Popover>
                          )}
                        </React.Fragment>
                      );
                    }

                    // Render Logo e Titolo sulla stessa riga
                    if (element === 'title' && showLogo && logoPosition !== 'above-title' && logoPosition !== 'below-title') {
                      return (
                        <div key="logo-title-row" className={`mb-4 flex items-center gap-4 ${
                          logoPosition === 'center' ? 'justify-center' : 
                          logoPosition === 'right' ? 'justify-end' : 
                          'justify-start'
                        }`}>
                          {logoBeforeTitle && showLogo && (
                            <Popover open={isEditMode && openPopovers.logo} onOpenChange={(open) => isEditMode && setOpenPopovers(prev => ({ ...prev, logo: open }))}>
                              <PopoverTrigger asChild>
                                <div className={`relative group ${theme.logo ? 'inline-block' : isEditMode ? 'inline-block' : 'hidden'} ${isEditMode ? 'cursor-pointer' : 'cursor-default'}`}>
                                  {theme.logo ? (
                                    <div
                                      data-editable="logo"
                                      className={`rounded transition-all p-2 -m-2 ${
                                        isEditMode ? 'hover:ring-2 hover:ring-[#FFCD00]/50' : ''
                                      }`}
                                      onClick={(e) => {
                                        if (!isEditMode) return;
                                        e.stopPropagation();
                                        togglePopover('logo');
                                      }}
                                    >
                                      <img
                                        src={theme.logo}
                                        alt="Logo"
                                        className="w-auto object-contain"
                                        data-editable="logo"
                                        style={{ 
                                          height: theme.logoSize ? `${(theme.logoSize / 100) * 64}px` : '64px'
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      className={`h-16 w-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50/50 transition-all ${
                                        isEditMode ? 'hover:border-[#FFCD00]/50 cursor-pointer' : 'cursor-default'
                                      }`}
                                      onClick={(e) => {
                                        if (!isEditMode) return;
                                        e.stopPropagation();
                                        // Apri direttamente il file picker quando si clicca sul placeholder
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.onchange = (e) => {
                                          const file = (e.target as HTMLInputElement).files?.[0];
                                          if (file) handleImageUpload('logo', file);
                                        };
                                        input.click();
                                      }}
                                    >
                                      <div className="text-center">
                                        <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                        {isEditMode && <p className="text-xs text-gray-500">Logo</p>}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" align="start" onClick={(e) => e.stopPropagation()}>
                                {renderLogoPopoverContent()}
                              </PopoverContent>
                            </Popover>
                          )}
                          
                          <Popover open={isEditMode && openPopovers.title} onOpenChange={(open) => isEditMode && setOpenPopovers(prev => ({ ...prev, title: open }))}>
                            <PopoverTrigger asChild>
                              <h2
                                data-editable="title"
                                className={`text-2xl font-bold relative group transition-all flex-1 ${
                                  isEditMode ? 'cursor-pointer hover:ring-2 hover:ring-[#FFCD00]/50 rounded px-2 py-1 -mx-2 -my-1 inline-block' : 'cursor-default'
                                }`}
                                style={{ color: theme.primaryColor }}
                                onClick={(e) => {
                                  if (!isEditMode) return;
                                  e.stopPropagation();
                                  togglePopover('title');
                                }}
                              >
                                {formTitle}
                              </h2>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="start" onClick={(e) => e.stopPropagation()}>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold">Colore Titolo</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="color"
                                      value={theme.primaryColor}
                                      onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                                      className="w-16 h-10 cursor-pointer rounded-lg border-2"
                                    />
                                    <Input
                                      type="text"
                                      value={theme.primaryColor}
                                      onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                                      className="flex-1 font-mono text-sm"
                                      placeholder="#000000"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold">Font</Label>
                                  <Select value={theme.fontFamily} onValueChange={(value) => updateTheme({ fontFamily: value })}>
                                    <SelectTrigger className="w-full text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                      {availableFonts.map((font) => (
                                        <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                          {font}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>

                          {!logoBeforeTitle && showLogo && (
                            <Popover open={isEditMode && openPopovers.logo} onOpenChange={(open) => isEditMode && setOpenPopovers(prev => ({ ...prev, logo: open }))}>
                              <PopoverTrigger asChild>
                                <div className={`relative group ${theme.logo ? 'inline-block' : isEditMode ? 'inline-block' : 'hidden'} ${isEditMode ? 'cursor-pointer' : 'cursor-default'}`}>
                                  {theme.logo ? (
                                    <div
                                      data-editable="logo"
                                      className={`rounded transition-all p-2 -m-2 ${
                                        isEditMode ? 'hover:ring-2 hover:ring-[#FFCD00]/50' : ''
                                      }`}
                                      onClick={(e) => {
                                        if (!isEditMode) return;
                                        e.stopPropagation();
                                        togglePopover('logo');
                                      }}
                                    >
                                      <img
                                        src={theme.logo}
                                        alt="Logo"
                                        className="w-auto object-contain"
                                        data-editable="logo"
                                        style={{ 
                                          height: theme.logoSize ? `${(theme.logoSize / 100) * 64}px` : '64px'
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      className={`h-16 w-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50/50 transition-all ${
                                        isEditMode ? 'hover:border-[#FFCD00]/50 cursor-pointer' : 'cursor-default'
                                      }`}
                                      onClick={(e) => {
                                        if (!isEditMode) return;
                                        e.stopPropagation();
                                        // Apri direttamente il file picker quando si clicca sul placeholder
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.onchange = (e) => {
                                          const file = (e.target as HTMLInputElement).files?.[0];
                                          if (file) handleImageUpload('logo', file);
                                        };
                                        input.click();
                                      }}
                                    >
                                      <div className="text-center">
                                        <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                        {isEditMode && <p className="text-xs text-gray-500">Logo</p>}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" align="start" onClick={(e) => e.stopPropagation()}>
                                {renderLogoPopoverContent()}
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      );
                    }

                    // Render solo Titolo se logo non è presente o è in posizione diversa
                    if (element === 'title') {
                      return (
                        <Popover key="title" open={isEditMode && openPopovers.title} onOpenChange={(open) => isEditMode && setOpenPopovers(prev => ({ ...prev, title: open }))}>
                          <PopoverTrigger asChild>
                            <h2
                              data-editable="title"
                              className={`text-2xl font-bold relative group transition-all w-full mb-2 ${
                                isEditMode ? 'cursor-pointer hover:ring-2 hover:ring-[#FFCD00]/50 rounded px-2 py-1 -mx-2 -my-1 inline-block' : 'cursor-default block'
                              }`}
                              style={{ color: theme.primaryColor }}
                              onClick={(e) => {
                                if (!isEditMode) return;
                                e.stopPropagation();
                                togglePopover('title');
                              }}
                            >
                              {formTitle}
                            </h2>
                          </PopoverTrigger>
                          <PopoverContent className="w-80" align="start" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold">Colore Titolo</Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="color"
                                    value={theme.primaryColor}
                                    onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                                    className="w-16 h-10 cursor-pointer rounded-lg border-2"
                                  />
                                  <Input
                                    type="text"
                                    value={theme.primaryColor}
                                    onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                                    className="flex-1 font-mono text-sm"
                                    placeholder="#000000"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold">Font</Label>
                                <Select value={theme.fontFamily} onValueChange={(value) => updateTheme({ fontFamily: value })}>
                                  <SelectTrigger className="w-full text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-[200px]">
                                    {availableFonts.map((font) => (
                                      <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                        {font}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    }

                    // Render solo Logo se non è nella stessa riga del titolo
                    if (element === 'logo' && (logoPosition === 'above-title' || logoPosition === 'below-title')) {
                      const shouldShow = logoPosition === 'above-title' ? logoBeforeTitle : !logoBeforeTitle;
                      if (!shouldShow) return null;
                      
                      return (
                        <Popover key="logo" open={isEditMode && openPopovers.logo} onOpenChange={(open) => isEditMode && setOpenPopovers(prev => ({ ...prev, logo: open }))}>
                          <PopoverTrigger asChild>
                            <div className={`mb-4 relative group ${theme.logo ? 'inline-block' : isEditMode ? 'inline-block' : 'hidden'} ${isEditMode ? 'cursor-pointer' : 'cursor-default'} w-full text-center`}>
                              {theme.logo ? (
                                <div
                                  data-editable="logo"
                                  className={`rounded transition-all p-2 -m-2 inline-block ${
                                    isEditMode ? 'hover:ring-2 hover:ring-primary/50' : ''
                                  }`}
                                  onClick={(e) => {
                                    if (!isEditMode) return;
                                    e.stopPropagation();
                                    togglePopover('logo');
                                  }}
                                >
                                  <img
                                    src={theme.logo}
                                    alt="Logo"
                                    className="w-auto object-contain"
                                    data-editable="logo"
                                    style={{ 
                                      height: theme.logoSize ? `${(theme.logoSize / 100) * 64}px` : '64px'
                                    }}
                                  />
                                </div>
                              ) : (
                                <div
                                  className={`h-16 w-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50/50 transition-all inline-block ${
                                    isEditMode ? 'hover:border-[#FFCD00]/50 cursor-pointer' : 'cursor-default'
                                  }`}
                                  onClick={(e) => {
                                    if (!isEditMode) return;
                                    e.stopPropagation();
                                    // Apri direttamente il file picker quando si clicca sul placeholder
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e) => {
                                      const file = (e.target as HTMLInputElement).files?.[0];
                                      if (file) handleImageUpload('logo', file);
                                    };
                                    input.click();
                                  }}
                                >
                                  <div className="text-center">
                                    <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                    {isEditMode && <p className="text-xs text-gray-500">Logo</p>}
                                  </div>
                                </div>
                              )}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-80" align="start" onClick={(e) => e.stopPropagation()}>
                            {renderLogoPopoverContent()}
                          </PopoverContent>
                        </Popover>
                      );
                    }
                    
                    return null;
                  }

                  // Render Description
                  if (element === 'description') {
                    return (
                      <Popover key="description" open={isEditMode && openPopovers.description} onOpenChange={(open) => isEditMode && setOpenPopovers(prev => ({ ...prev, description: open }))}>
                        <PopoverTrigger asChild>
                          <div className="relative group">
                            <p 
                              data-editable="description"
                              className={`text-gray-600 mb-6 inline-block transition-all ${
                                isEditMode ? 'cursor-pointer hover:ring-2 hover:ring-[#FFCD00]/50 rounded px-2 py-1 -mx-2 -my-1 hover:bg-[#FFCD00]/10' : 'cursor-default'
                              }`}
                              style={{ color: theme.textColor }}
                              onClick={(e) => {
                                if (!isEditMode) return;
                                e.stopPropagation();
                                togglePopover('description');
                              }}
                            >
                              {formDescription}
                            </p>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">Colore Testo</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="color"
                                  value={theme.textColor}
                                  onChange={(e) => updateTheme({ textColor: e.target.value })}
                                  className="w-16 h-10 cursor-pointer rounded-lg border-2"
                                />
                                <Input
                                  type="text"
                                  value={theme.textColor}
                                  onChange={(e) => updateTheme({ textColor: e.target.value })}
                                  className="flex-1 font-mono text-sm"
                                  placeholder="#000000"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">Font</Label>
                              <Select value={theme.fontFamily} onValueChange={(value) => updateTheme({ fontFamily: value })}>
                                <SelectTrigger className="w-full text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                  {availableFonts.map((font) => (
                                    <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                      {font}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    );
                  }
                  
                  return null;
                })}
                  </div>
                </SortableContext>
              </DndContext>
               
               {/* Questions - domanda corrente con navigazione */}
               {validQuestions.length > 0 && currentQuestion ? (
                 <div 
                   data-editable="question"
                   className={`space-y-6 min-h-[400px] flex flex-col ${(clickToEditMode || isEditMode) ? 'cursor-pointer hover:shadow-lg' : ''} ${selectedElement.type === 'question' ? 'ring-4 ring-[#FFCD00] ring-offset-4' : ''} transition-all`}
                   style={{ 
                     padding: `${theme.cardPadding || 24}px`,
                     backgroundColor: theme.questionBackgroundColor || 'transparent',
                     borderRadius: `${theme.borderRadius}px`,
                     border: theme.questionBorderColor ? `${theme.borderWidth || 1}px solid ${theme.questionBorderColor}` : 'none',
                     boxShadow: `0 ${theme.shadowIntensity || 2}px ${(theme.shadowIntensity || 2) * 4}px rgba(0,0,0,0.1)`
                   }}
                   onClick={(e) => {
                     // Se non clicchi su elementi più specifici (questionText, button), apri question
                     const target = e.target as HTMLElement;
                     if (!target.closest('[data-editable="questionText"]') && !target.closest('[data-editable="button"]')) {
                       handleElementClick(e, 'question');
                     }
                   }}
                 >
                   {/* Domanda corrente */}
                   <div className="flex-1">
                     <div className="flex items-center mb-6">
                       <span 
                         className="w-10 h-10 flex items-center justify-center rounded-full mr-4 font-semibold" 
                         style={{ 
                           backgroundColor: theme.questionNumberBgColor || theme.primaryColor,
                           color: theme.questionNumberTextColor || '#ffffff',
                           fontSize: `${theme.questionFontSize || 20}px`,
                           fontWeight: theme.questionFontWeight || 'semibold'
                         }}
                       >
                         {currentPreviewStep + 1}
                       </span>
                       <Label 
                         data-editable="questionText"
                         className={`font-semibold flex-1 ${(clickToEditMode || isEditMode) ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${selectedElement.type === 'questionText' ? 'ring-2 ring-[#FFCD00] ring-offset-2 rounded' : ''}`}
                         style={{ 
                           color: theme.questionTextColor || theme.textColor,
                           fontSize: `${theme.questionFontSize || 20}px`,
                           fontWeight: theme.questionFontWeight || 'semibold'
                         }}
                        onClick={(e) => handleElementClick(e, 'questionText')}
                      >
                        {currentQuestion.text}
                        {(clickToEditMode || isEditMode) && (
                           <span className="ml-2 text-xs bg-[#FFCD00] text-black px-2 py-1 rounded">✏️ Clicca per modificare</span>
                         )}
                       </Label>
                     </div>

                     <div className="pl-14" style={{ 
                       fontSize: `${theme.optionFontSize || 16}px`,
                       color: theme.optionTextColor || theme.textColor
                     }}>
                       {/* TEXT */}
                       {currentQuestion.type === 'TEXT' && (
                         <Input placeholder="Inserisci la tua risposta..." className="w-full" readOnly />
                       )}

                       {/* MULTIPLE_CHOICE */}
                       {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                         <div 
                           data-editable="optionStyle"
                           className={`${(clickToEditMode || isEditMode) ? 'cursor-pointer' : ''} ${selectedElement.type === 'optionStyle' ? 'ring-2 ring-[#FFCD00] ring-offset-2 rounded-lg' : ''}`}
                           style={{ marginTop: `${theme.optionSpacing || 12}px` }}
                           onClick={(e) => handleElementClick(e, 'optionStyle')}
                         >
                           {(() => {
                             const choices = Array.isArray(currentQuestion.options) ? currentQuestion.options : currentQuestion.options?.choices || [];
                             return choices.map((option: string, index: number) => (
                               <div 
                                 key={index} 
                                 className="flex items-center space-x-2 p-3 rounded transition-colors" 
                                 style={{ 
                                   marginBottom: `${theme.optionSpacing || 12}px`,
                                   border: `${theme.borderWidth || 1}px solid ${theme.optionBorderColor || theme.accentColor}`,
                                   borderRadius: `${theme.borderRadius}px`,
                                   cursor: 'pointer',
                                   ...(theme.hoverEffect && {
                                     ':hover': { backgroundColor: theme.optionHoverColor || `${theme.primaryColor}10` }
                                   })
                                 }}
                               >
                                 <input 
                                   type="radio" 
                                   name={`preview-${currentQuestion.id}`} 
                                   className="w-5 h-5" 
                                   style={{ accentColor: theme.radioCheckColor || theme.primaryColor }} 
                                   readOnly 
                                 />
                                 <Label style={{ color: theme.optionTextColor || theme.textColor, fontSize: `${theme.optionFontSize || 16}px` }}>{option}</Label>
                               </div>
                             ));
                           })()}
                         </div>
                       )}

                       {/* CHECKBOX */}
                       {currentQuestion.type === 'CHECKBOX' && (
                         <div style={{ marginTop: `${theme.optionSpacing || 12}px` }}>
                           {(() => {
                             const choices = Array.isArray(currentQuestion.options) ? currentQuestion.options : currentQuestion.options?.choices || [];
                             return choices.map((option: string, index: number) => (
                               <div 
                                 key={index} 
                                 className="flex items-center space-x-2 p-3 rounded transition-colors"
                                 style={{ 
                                   marginBottom: `${theme.optionSpacing || 12}px`,
                                   border: `${theme.borderWidth || 1}px solid ${theme.optionBorderColor || theme.accentColor}`,
                                   borderRadius: `${theme.borderRadius}px`,
                                   cursor: 'pointer'
                                 }}
                               >
                                 <Checkbox disabled style={{ accentColor: theme.radioCheckColor || theme.primaryColor } as any} />
                                 <Label style={{ color: theme.optionTextColor || theme.textColor, fontSize: `${theme.optionFontSize || 16}px` }}>{option}</Label>
                               </div>
                             ));
                           })()}
                         </div>
                       )}

                       {/* RATING */}
                       {currentQuestion.type === 'RATING' && (
                         <div 
                           data-editable="optionStyle"
                           className={`flex items-center space-x-2 ${(clickToEditMode || isEditMode) ? 'cursor-pointer' : ''} ${selectedElement.type === 'optionStyle' ? 'ring-2 ring-[#FFCD00] ring-offset-2 rounded-lg p-2' : ''}`}
                           onClick={(e) => handleElementClick(e, 'optionStyle')}
                         >
                           {[1, 2, 3, 4, 5].map((rating) => (
                             <Button key={rating} type="button" variant="ghost" className="w-12 h-12 p-0 hover:scale-110 transition-all">
                               <Star
                                 className="w-8 h-8"
                                 style={{
                                   fill: rating <= 3 ? theme.primaryColor || '#FFCD00' : 'none',
                                   color: rating <= 3 ? theme.primaryColor || '#FFCD00' : '#d1d5db',
                                 }}
                               />
                             </Button>
                           ))}
                           {(clickToEditMode || isEditMode) && (
                             <span className="ml-2 text-xs bg-[#FFCD00] text-black px-2 py-1 rounded">✏️</span>
                           )}
                         </div>
                       )}

                       {/* LIKERT */}
                       {currentQuestion.type === 'LIKERT' && (() => {
                         const scale = currentQuestion.options?.scale || 5;
                         const labels = currentQuestion.options?.labels || [];
                         return (
                           <div 
                             data-editable="optionStyle"
                             className={`space-y-4 ${(clickToEditMode || isEditMode) ? 'cursor-pointer' : ''} ${selectedElement.type === 'optionStyle' ? 'ring-2 ring-[#FFCD00] ring-offset-2 rounded-lg p-2' : ''}`}
                             onClick={(e) => handleElementClick(e, 'optionStyle')}
                           >
                             <div className="flex items-center justify-between mb-2">
                               <span className="text-sm text-gray-500">{labels[0] || "Per niente d'accordo"}</span>
                               <span className="text-sm text-gray-500">{labels[scale - 1] || "Completamente d'accordo"}</span>
                               {(clickToEditMode || isEditMode) && (
                                 <span className="text-xs bg-[#FFCD00] text-black px-2 py-1 rounded">✏️ Clicca per stile</span>
                               )}
                             </div>
                             <div className="grid grid-cols-5 gap-2">
                               {Array.from({ length: scale }, (_, index) => (
                                 <Button key={index} type="button" variant="outline" className="h-12" style={{ borderRadius: `${theme.borderRadius}px` }}>
                                   <span className="text-sm">{index + 1}</span>
                                 </Button>
                               ))}
                             </div>
                           </div>
                         );
                       })()}

                       {/* NPS */}
                       {currentQuestion.type === 'NPS' && (
                         <div>
                           <div className="flex items-center justify-between mb-2">
                             <span className="text-sm text-gray-500">0 - Non lo consiglierei</span>
                             <span className="text-sm text-gray-500">10 - Lo consiglierei sicuramente</span>
                           </div>
                           <div className="flex items-center space-x-2">
                             {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                               <Button key={rating} type="button" variant="outline" className="w-10 h-10" style={{ borderRadius: `${theme.borderRadius}px` }}>
                                 {rating}
                               </Button>
                             ))}
                           </div>
                         </div>
                       )}

                       {/* DATE */}
                       {currentQuestion.type === 'DATE' && (
                         <Input type="text" placeholder="Seleziona una data..." className="w-full" readOnly />
                       )}

                       {/* RANKING */}
                       {currentQuestion.type === 'RANKING' && (
                         <div className="space-y-2">
                           {(currentQuestion.options as string[] || []).map((option, index) => (
                             <div key={index} className="flex items-center space-x-3 p-3 bg-white border rounded-md" style={{ borderRadius: `${theme.borderRadius}px` }}>
                               <GripVertical className="h-4 w-4 text-gray-400" />
                               <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-sm">{index + 1}</span>
                               <span>{option}</span>
                             </div>
                           ))}
                         </div>
                       )}

                       {/* FILE_UPLOAD */}
                       {currentQuestion.type === 'FILE_UPLOAD' && (
                         <div className="border-2 border-dashed rounded-md p-6 text-center" style={{ borderRadius: `${theme.borderRadius}px` }}>
                           <Upload className="mx-auto h-12 w-12 text-gray-400" />
                           <p className="mt-2 text-sm text-gray-500">Trascina un file qui</p>
                           <Button type="button" variant="outline" className="mt-4" style={{ borderRadius: `${theme.borderRadius}px` }}>Seleziona file</Button>
                         </div>
                       )}

                       {/* BRANCHING */}
                       {currentQuestion.type === 'BRANCHING' && (
                         <p className="text-sm text-gray-500">Domanda condizionale basata sulle risposte precedenti</p>
                       )}
                     </div>
                   </div>

                   {/* Bottoni navigazione */}
                   <div className="flex justify-between items-center pt-6 border-t mt-auto">
                     <Button
                       type="button"
                       variant="outline"
                       onClick={() => setCurrentPreviewStep(Math.max(0, currentPreviewStep - 1))}
                       disabled={currentPreviewStep === 0}
                       className="px-6 py-2 transition-all"
                       style={{
                         backgroundColor: currentPreviewStep === 0 
                           ? (theme.disabledButtonColor || '#e5e7eb')
                           : (theme.navigationButtonBgColor || 'transparent'),
                         color: currentPreviewStep === 0
                           ? '#9ca3af'
                           : (theme.navigationButtonTextColor || theme.textColor),
                         border: `${theme.borderWidth || 1}px solid ${theme.navigationButtonBorderColor || theme.primaryColor}`,
                         borderRadius: `${theme.borderRadius}px`,
                         cursor: currentPreviewStep === 0 ? 'not-allowed' : 'pointer'
                       }}
                     >
                       Precedente
                     </Button>
                     <div 
                       className="px-4 py-2 rounded"
                       style={{
                         color: theme.counterTextColor || theme.textColor,
                         fontSize: `${theme.counterFontSize || 14}px`,
                         backgroundColor: theme.counterBgColor || 'transparent',
                         fontWeight: 'medium'
                       }}
                     >
                       Domanda {currentPreviewStep + 1} di {validQuestions.length}
                     </div>
                     {currentPreviewStep === validQuestions.length - 1 ? (
                       <Button 
                         type="button" 
                         className="px-6 py-2 transition-all" 
                         style={{ 
                           backgroundColor: theme.buttonStyle === 'filled' ? theme.primaryColor : 'transparent',
                           color: theme.buttonTextColor || (theme.buttonStyle === 'filled' ? '#fff' : theme.primaryColor),
                           border: theme.buttonStyle === 'outlined' ? `${theme.borderWidth || 2}px solid ${theme.primaryColor}` : 'none',
                           borderRadius: `${theme.borderRadius}px`,
                           fontWeight: '600'
                         }}
                       >
                         Invia Risposte
                       </Button>
                     ) : (
                       <div 
                         data-editable="button"
                         className={`inline-block ${(clickToEditMode || isEditMode) ? 'cursor-pointer' : ''} ${selectedElement.type === 'button' ? 'ring-4 ring-[#FFCD00] ring-offset-4 rounded-lg' : ''}`}
                         onClick={(e) => handleElementClick(e, 'button')}
                       >
                         <Button
                           type="button"
                           onClick={(e) => {
                             if (!(clickToEditMode || isEditMode)) {
                               setCurrentPreviewStep(Math.min(validQuestions.length - 1, currentPreviewStep + 1));
                             }
                           }}
                           className="px-6 py-2 transition-all relative"
                           style={{ 
                             backgroundColor: theme.buttonStyle === 'filled' ? theme.primaryColor : 'transparent',
                             color: theme.buttonTextColor || (theme.buttonStyle === 'filled' ? '#fff' : theme.primaryColor),
                             border: theme.buttonStyle === 'outlined' ? `${theme.borderWidth || 2}px solid ${theme.primaryColor}` : 'none',
                             borderRadius: `${theme.borderRadius}px`,
                             fontWeight: '600'
                           }}
                         >
                           Successiva
                           {(clickToEditMode || isEditMode) && (
                             <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded">✏️</span>
                           )}
                         </Button>
                       </div>
                     )}
                   </div>
                 </div>
               ) : questions && questions.length > 0 ? (
                 /* Mostra messaggio se le domande esistono ma non hanno testo */
                 <div className="p-6 rounded-md border-2 border-dashed border-amber-300 bg-amber-50 text-center">
                   <FileText className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                   <p className="text-sm text-amber-700 font-medium">
                     {questions.length} {questions.length === 1 ? 'domanda creata' : 'domande create'}
                   </p>
                   <p className="text-xs text-amber-600 mt-1">Compila il testo delle domande per vederle qui nell'anteprima</p>
                 </div>
               ) : (
                 /* Mostra placeholder se non ci sono domande */
                 <div className="p-6 rounded-md border-2 border-dashed border-gray-300 text-center">
                   <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                   <p className="text-sm text-gray-500 font-medium">Nessuna domanda creata</p>
                   <p className="text-xs text-gray-400 mt-1">Aggiungi domande per vedere l'anteprima qui</p>
                 </div>
               )}

                <Popover open={isEditMode && openPopovers.button} onOpenChange={(open) => isEditMode && setOpenPopovers(prev => ({ ...prev, button: open }))}>
                  <PopoverTrigger asChild>
                    <Button
                      data-editable="button"
                      className={`float-right relative group transition-all ${
                        isEditMode ? 'cursor-pointer hover:ring-2 hover:ring-primary/50' : 'cursor-default'
                      }`}
                      style={{
                        backgroundColor: theme.buttonStyle === 'filled' ? theme.primaryColor : 'transparent',
                        color: theme.buttonStyle === 'filled' ? '#fff' : theme.primaryColor,
                        border: theme.buttonStyle === 'outlined' ? `2px solid ${theme.primaryColor}` : 'none',
                        borderRadius: `${theme.borderRadius}px`,
                      }}
                      onClick={(e) => {
                        if (!isEditMode) return;
                        e.stopPropagation();
                        togglePopover('button');
                      }}
                    >
                      Invia
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Colore Bottone</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={theme.primaryColor}
                            onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                            className="w-16 h-10 cursor-pointer rounded-lg border-2"
                          />
                          <Input
                            type="text"
                            value={theme.primaryColor}
                            onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                            className="flex-1 font-mono text-sm"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Stile Bottone</Label>
                        <Select
                          value={theme.buttonStyle}
                          onValueChange={(value: 'filled' | 'outlined') => updateTheme({ buttonStyle: value })}
                        >
                          <SelectTrigger className="w-full text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="filled">Riempito</SelectItem>
                            <SelectItem value="outlined">Solo Bordo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Raggio Bordi: {theme.borderRadius}px</Label>
                        <Slider
                          value={[theme.borderRadius]}
                          onValueChange={([value]) => updateTheme({ borderRadius: value })}
                          min={0}
                          max={30}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="clear-both" />
                </div>
              </PopoverTrigger>
              <PopoverContent 
                className="w-96 max-h-[80vh] overflow-y-auto z-[200] shadow-2xl border-2" 
                align="start" 
                side="top"
                sideOffset={10}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Droplet className="h-4 w-4" />
                      Tipo Sfondo
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={!theme.backgroundImage ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateTheme({ backgroundImage: '' })}
                        className={`text-xs transition-all ${
                          !theme.backgroundImage 
                            ? "bg-[#FFCD00] hover:bg-[#FFD733] text-black border-2 border-[#FFCD00] shadow-lg ring-2 ring-[#FFCD00]/30" 
                            : "hover:border-[#FFCD00] hover:text-[#FFCD00]"
                        }`}
                      >
                        Colore Solido
                      </Button>
                      <Button
                        type="button"
                        variant={theme.backgroundImage ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleImageUpload('backgroundImage', file);
                          };
                          input.click();
                        }}
                        className={`text-xs transition-all ${
                          theme.backgroundImage 
                            ? "bg-[#FFCD00] hover:bg-[#FFD733] text-black border-2 border-[#FFCD00] shadow-lg ring-2 ring-[#FFCD00]/30" 
                            : "hover:border-[#FFCD00] hover:text-[#FFCD00]"
                        }`}
                      >
                        <ImageIcon className="h-3 w-3 mr-1" />
                        Immagine
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {theme.backgroundImage ? (
                    <>
                      {/* Gestione Immagine Background */}
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Immagine di Sfondo</Label>
                        <div className="relative group">
                          <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 aspect-video">
                            <img
                              src={theme.backgroundImage}
                              alt="Background"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) handleImageUpload('backgroundImage', file);
                                  };
                                  input.click();
                                }}
                                className="bg-white/90 hover:bg-white"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Sostituisci
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => updateTheme({ backgroundImage: '' })}
                                className="bg-red-500/90 hover:bg-red-500"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Rimuovi
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Posizione</Label>
                            <Select
                              value={theme.backgroundPosition || 'center'}
                              onValueChange={(value: any) => updateTheme({ backgroundPosition: value })}
                            >
                              <SelectTrigger className="w-full text-xs h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="center">Centro</SelectItem>
                                <SelectItem value="top">Alto Centro</SelectItem>
                                <SelectItem value="bottom">Basso Centro</SelectItem>
                                <SelectItem value="left">Sinistra Centro</SelectItem>
                                <SelectItem value="right">Destra Centro</SelectItem>
                                <SelectItem value="top left">Alto Sinistra</SelectItem>
                                <SelectItem value="top right">Alto Destra</SelectItem>
                                <SelectItem value="bottom left">Basso Sinistra</SelectItem>
                                <SelectItem value="bottom right">Basso Destra</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Dimensione</Label>
                            <Select
                              value={theme.backgroundSize || 'cover'}
                              onValueChange={(value: any) => updateTheme({ backgroundSize: value })}
                            >
                              <SelectTrigger className="w-full text-xs h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cover">Copri tutto</SelectItem>
                                <SelectItem value="contain">Contieni</SelectItem>
                                <SelectItem value="auto">Dimensione originale</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Comportamento Scroll</Label>
                            <Select
                              value={theme.backgroundAttachment || 'fixed'}
                              onValueChange={(value: any) => updateTheme({ backgroundAttachment: value })}
                            >
                              <SelectTrigger className="w-full text-xs h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed">Fisso (non scorre)</SelectItem>
                                <SelectItem value="scroll">Scorre con pagina</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Ripetizione</Label>
                            <Select
                              value={theme.backgroundRepeat || 'no-repeat'}
                              onValueChange={(value: any) => updateTheme({ backgroundRepeat: value })}
                            >
                              <SelectTrigger className="w-full text-xs h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="no-repeat">Nessuna</SelectItem>
                                <SelectItem value="repeat">Ripeti tutto</SelectItem>
                                <SelectItem value="repeat-x">Ripeti orizzontale</SelectItem>
                                <SelectItem value="repeat-y">Ripeti verticale</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Opacità</Label>
                            <span className="text-xs text-gray-500">{((theme.backgroundOpacity || 100) / 100).toFixed(1)}</span>
                          </div>
                          <Slider
                            value={[theme.backgroundOpacity || 100]}
                            onValueChange={([value]) => updateTheme({ backgroundOpacity: value })}
                            min={0}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Colore Sfondo (Sotto Immagine)</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={theme.backgroundColor}
                              onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                              className="w-12 h-8 cursor-pointer rounded-lg border-2"
                            />
                            <Input
                              type="text"
                              value={theme.backgroundColor}
                              onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                              className="flex-1 font-mono text-xs h-8"
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Gestione Colore Solido */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Colore Sfondo</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={theme.backgroundColor}
                            onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                            className="w-16 h-10 cursor-pointer rounded-lg border-2"
                          />
                          <Input
                            type="text"
                            value={theme.backgroundColor}
                            onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                            className="flex-1 font-mono text-sm"
                            placeholder="#ffffff"
                          />
                        </div>
                        <p className="text-xs text-gray-500">Scegli un colore solido per lo sfondo</p>
                      </div>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </CardContent>
        )}
      </Card>

      {/* Pannello Personalizzazione Completa */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#FFCD00]" />
                {clickToEditMode ? 'Personalizzazione Facile' : 'Personalizzazione Avanzata'}
              </CardTitle>
              <CardDescription className="mt-1">
                {clickToEditMode 
                  ? '👆 Clicca direttamente sugli elementi sopra per modificarli' 
                  : 'Modifica ogni elemento del form usando le schede qui sotto'}
              </CardDescription>
            </div>
            <Button
              variant={clickToEditMode ? "default" : "outline"}
              size="sm"
              onClick={() => setClickToEditMode(!clickToEditMode)}
              className={clickToEditMode ? "bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black" : ""}
            >
              {clickToEditMode ? (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Modalità Facile
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Modalità Avanzata
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {clickToEditMode ? (
            /* NUOVO: Modalità Click-to-Edit Semplice */
            <div className="py-8 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFCD00]/10 mb-4">
                <MousePointer2 className="h-8 w-8 text-[#FFCD00]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Come funziona?</h3>
              <div className="max-w-md mx-auto space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3 text-left">
                  <div className="w-6 h-6 rounded-full bg-[#FFCD00] text-black flex items-center justify-center flex-shrink-0 font-semibold text-xs">
                    1
                  </div>
                  <p><strong>Clicca sull'elemento</strong> che vuoi modificare nell'anteprima sopra (sfondo, domanda, bottone, etc.)</p>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <div className="w-6 h-6 rounded-full bg-[#FFCD00] text-black flex items-center justify-center flex-shrink-0 font-semibold text-xs">
                    2
                  </div>
                  <p><strong>Scegli i colori e stili</strong> che preferisci dal popup che appare</p>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <div className="w-6 h-6 rounded-full bg-[#FFCD00] text-black flex items-center justify-center flex-shrink-0 font-semibold text-xs">
                    3
                  </div>
                  <p><strong>Vedi il risultato in tempo reale!</strong> Le modifiche si applicano immediatamente</p>
                </div>
              </div>
              <div className="pt-4">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  💡 Suggerimento: Passa alla "Modalità Avanzata" per opzioni più dettagliate
                </Badge>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Navigation - Solo in modalità avanzata */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={activeTab === tab.id ? 'bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black' : ''}
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </Button>
                ))}
              </div>
            </>
          )}

          {/* Tab Content - Solo in modalità avanzata */}
          {!clickToEditMode && (
            <div className="space-y-6">
              {/* TAB: Colori Base */}
              {activeTab === 'colors' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Colore Principale</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.primaryColor}
                        onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={theme.primaryColor}
                        onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Colore Sfondo</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.backgroundColor}
                        onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={theme.backgroundColor}
                        onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Colore Testo</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.textColor}
                        onChange={(e) => updateTheme({ textColor: e.target.value })}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={theme.textColor}
                        onChange={(e) => updateTheme({ textColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Colore Accento</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.accentColor}
                        onChange={(e) => updateTheme({ accentColor: e.target.value })}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={theme.accentColor}
                        onChange={(e) => updateTheme({ accentColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Domande */}
            {activeTab === 'questions' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Colore Sfondo Numero</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.questionNumberBgColor || theme.primaryColor}
                        onChange={(e) => updateTheme({ questionNumberBgColor: e.target.value })}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={theme.questionNumberBgColor || theme.primaryColor}
                        onChange={(e) => updateTheme({ questionNumberBgColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Colore Testo Numero</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.questionNumberTextColor || '#ffffff'}
                        onChange={(e) => updateTheme({ questionNumberTextColor: e.target.value })}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={theme.questionNumberTextColor || '#ffffff'}
                        onChange={(e) => updateTheme({ questionNumberTextColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Colore Testo Domanda</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.questionTextColor || theme.textColor}
                        onChange={(e) => updateTheme({ questionTextColor: e.target.value })}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={theme.questionTextColor || theme.textColor}
                        onChange={(e) => updateTheme({ questionTextColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Colore Bordo Domanda</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.questionBorderColor || theme.accentColor}
                        onChange={(e) => updateTheme({ questionBorderColor: e.target.value })}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={theme.questionBorderColor || theme.accentColor}
                        onChange={(e) => updateTheme({ questionBorderColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Colore Sfondo Domanda</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.questionBackgroundColor || 'transparent'}
                        onChange={(e) => updateTheme({ questionBackgroundColor: e.target.value })}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={theme.questionBackgroundColor || 'transparent'}
                        onChange={(e) => updateTheme({ questionBackgroundColor: e.target.value })}
                        className="flex-1"
                        placeholder="transparent"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Dimensione Font Domanda: {theme.questionFontSize || 20}px</Label>
                    <Slider
                      value={[theme.questionFontSize || 20]}
                      onValueChange={([value]) => updateTheme({ questionFontSize: value })}
                      min={14}
                      max={32}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Peso Font Domanda</Label>
                    <Select
                      value={theme.questionFontWeight || 'semibold'}
                      onValueChange={(value: any) => updateTheme({ questionFontWeight: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="semibold">Semibold</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Intensità Ombra: {theme.shadowIntensity || 2}</Label>
                    <Slider
                      value={[theme.shadowIntensity || 2]}
                      onValueChange={([value]) => updateTheme({ shadowIntensity: value })}
                      min={0}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Opzioni */}
            {activeTab === 'options' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Colore Testo Opzioni</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.optionTextColor || theme.textColor}
                        onChange={(e) => updateTheme({ optionTextColor: e.target.value })}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={theme.optionTextColor || theme.textColor}
                        onChange={(e) => updateTheme({ optionTextColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Colore Bordo Opzioni</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.optionBorderColor || theme.accentColor}
                        onChange={(e) => updateTheme({ optionBorderColor: e.target.value })}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={theme.optionBorderColor || theme.accentColor}
                        onChange={(e) => updateTheme({ optionBorderColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Colore Radio/Checkbox</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.radioCheckColor || theme.primaryColor}
                        onChange={(e) => updateTheme({ radioCheckColor: e.target.value })}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={theme.radioCheckColor || theme.primaryColor}
                        onChange={(e) => updateTheme({ radioCheckColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Dimensione Font Opzioni: {theme.optionFontSize || 16}px</Label>
                    <Slider
                      value={[theme.optionFontSize || 16]}
                      onValueChange={([value]) => updateTheme({ optionFontSize: value })}
                      min={12}
                      max={24}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Bottoni */}
            {activeTab === 'buttons' && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold mb-4">Bottone Principale (Invia/Successiva)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label>Stile Bottone</Label>
                    <Select
                      value={theme.buttonStyle}
                      onValueChange={(value: 'filled' | 'outlined') => updateTheme({ buttonStyle: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="filled">Riempito</SelectItem>
                        <SelectItem value="outlined">Solo Bordo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Colore Testo Bottone</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.buttonTextColor || '#ffffff'}
                        onChange={(e) => updateTheme({ buttonTextColor: e.target.value })}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={theme.buttonTextColor || '#ffffff'}
                        onChange={(e) => updateTheme({ buttonTextColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <h3 className="text-sm font-semibold mb-4">Bottoni Navigazione (Precedente)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label>Colore Sfondo Navigazione</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.navigationButtonBgColor || 'transparent'}
                        onChange={(e) => updateTheme({ navigationButtonBgColor: e.target.value })}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={theme.navigationButtonBgColor || 'transparent'}
                        onChange={(e) => updateTheme({ navigationButtonBgColor: e.target.value })}
                        className="flex-1"
                        placeholder="transparent"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Colore Testo Navigazione</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.navigationButtonTextColor || theme.textColor}
                        onChange={(e) => updateTheme({ navigationButtonTextColor: e.target.value })}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={theme.navigationButtonTextColor || theme.textColor}
                        onChange={(e) => updateTheme({ navigationButtonTextColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Colore Bordo Navigazione</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.navigationButtonBorderColor || theme.primaryColor}
                        onChange={(e) => updateTheme({ navigationButtonBorderColor: e.target.value })}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={theme.navigationButtonBorderColor || theme.primaryColor}
                        onChange={(e) => updateTheme({ navigationButtonBorderColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Colore Bottone Disabilitato</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.disabledButtonColor || '#e5e7eb'}
                        onChange={(e) => updateTheme({ disabledButtonColor: e.target.value })}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={theme.disabledButtonColor || '#e5e7eb'}
                        onChange={(e) => updateTheme({ disabledButtonColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <h3 className="text-sm font-semibold mb-4">Contatore "Domanda X di Y"</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Colore Testo Contatore</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.counterTextColor || theme.textColor}
                        onChange={(e) => updateTheme({ counterTextColor: e.target.value })}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={theme.counterTextColor || theme.textColor}
                        onChange={(e) => updateTheme({ counterTextColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Colore Sfondo Contatore</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.counterBgColor || 'transparent'}
                        onChange={(e) => updateTheme({ counterBgColor: e.target.value })}
                        className="w-16 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={theme.counterBgColor || 'transparent'}
                        onChange={(e) => updateTheme({ counterBgColor: e.target.value })}
                        className="flex-1"
                        placeholder="transparent"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Dimensione Font Contatore: {theme.counterFontSize || 14}px</Label>
                    <Slider
                      value={[theme.counterFontSize || 14]}
                      onValueChange={([value]) => updateTheme({ counterFontSize: value })}
                      min={10}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Spaziatura */}
            {activeTab === 'spacing' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Raggio Bordi: {theme.borderRadius}px</Label>
                    <Slider
                      value={[theme.borderRadius]}
                      onValueChange={([value]) => updateTheme({ borderRadius: value })}
                      min={0}
                      max={30}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Spessore Bordi: {theme.borderWidth || 1}px</Label>
                    <Slider
                      value={[theme.borderWidth || 1]}
                      onValueChange={([value]) => updateTheme({ borderWidth: value })}
                      min={0}
                      max={5}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Padding Card: {theme.cardPadding || 24}px</Label>
                    <Slider
                      value={[theme.cardPadding || 24]}
                      onValueChange={([value]) => updateTheme({ cardPadding: value })}
                      min={8}
                      max={48}
                      step={4}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Spazio Opzioni: {theme.optionSpacing || 12}px</Label>
                    <Slider
                      value={[theme.optionSpacing || 12]}
                      onValueChange={([value]) => updateTheme({ optionSpacing: value })}
                      min={4}
                      max={24}
                      step={2}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Tipografia (mantieni quello esistente) */}
            {activeTab === 'typography' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Font Famiglia</Label>
                  <Select
                    value={theme.fontFamily}
                    onValueChange={(value) => updateTheme({ fontFamily: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                      <SelectItem value="Montserrat">Montserrat</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* TAB: Immagini (rimanda al codice esistente nell'anteprima) */}
            {activeTab === 'images' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Per modificare le immagini (logo, header, sfondo), usa i controlli direttamente nell'anteprima sopra cliccando sugli elementi.
                </p>
              </div>
            )}

            {/* TAB: Layout (rimanda al codice esistente) */}
            {activeTab === 'layout' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Per modificare il layout, usa i controlli direttamente nell'anteprima sopra cliccando sugli elementi.
                </p>
              </div>
            )}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
