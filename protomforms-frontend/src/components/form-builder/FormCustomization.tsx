import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface Theme {
  primaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  borderRadius: number;
  buttonStyle: 'filled' | 'outlined';
  textColor: string;
  accentColor: string;
  headerImage: string;
  logo: string;
  backgroundImage: string;
  backgroundPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  backgroundSize?: 'cover' | 'contain' | 'auto' | 'repeat';
  backgroundOpacity?: number;
  headerImageHeight?: number; // Altezza header in px o percentuale
  logoSize?: number; // Dimensione logo in percentuale (100 = normale)
  logoPosition?: 'left' | 'center' | 'right' | 'above-title' | 'below-title'; // Posizione logo
  layoutOrder?: string[]; // Ordine elementi: ['header', 'logo', 'title', 'description']
}

interface FormCustomizationProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  formTitle?: string;
  formDescription?: string;
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
              ? "border-primary bg-primary/5 scale-105" 
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
                <Move className="h-12 w-12 text-primary animate-bounce" />
                <p className="text-sm font-medium text-primary">Rilascia l'immagine qui</p>
              </>
            ) : (
              <>
                <div className="relative">
                  <Upload className="h-12 w-12 text-gray-400" />
                  <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Trascina un'immagine qui o <span className="text-primary">clicca per caricare</span>
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
  formDescription = 'Descrizione del form' 
}: FormCustomizationProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'images' | 'layout'>('colors');
  const [editingElement, setEditingElement] = useState<'title' | 'font' | 'primaryColor' | 'backgroundColor' | 'textColor' | 'button' | null>(null);
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});
  const [isEditMode, setIsEditMode] = useState(false);

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
    return theme.layoutOrder || ['header', 'logo', 'title', 'description'];
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
          <GripVertical className="h-5 w-5 text-gray-400 hover:text-primary" />
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
                  <span className="flex-1 text-xs capitalize">{element === 'header' ? 'Header' : element === 'logo' ? 'Logo' : element === 'title' ? 'Titolo' : 'Descrizione'}</span>
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
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
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
    { id: 'colors', label: 'Colori', icon: Palette },
    { id: 'typography', label: 'Tipografia', icon: Type },
    { id: 'images', label: 'Immagini', icon: ImageIcon },
    { id: 'layout', label: 'Layout', icon: Layout },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Preview */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Anteprima Live
            </CardTitle>
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
                  className={`relative border rounded-lg p-6 space-y-4 min-h-[400px] overflow-hidden group ${
                    isEditMode ? 'cursor-pointer' : 'cursor-default'
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
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed', // Identico alla vista utente
                  }}
                  onClick={(e) => {
                    if (!isEditMode) return;
                    // Se clicchi sullo sfondo (non su elementi figli), apri popover
                    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('group')) {
                      togglePopover('background');
                    }
                  }}
                >
                  {isEditMode && (
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                      <div className="bg-primary text-white shadow-lg px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap">
                        🎨 Sfondo
                      </div>
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
                              ? "border-primary bg-primary/10 ring-2 ring-primary/20"
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
                  // Render Header
                  if (element === 'header' && (theme.headerImage || isEditMode)) {
                    return (
                      <SortableLayoutElement key="header" id="header">
                        <Popover open={isEditMode && openPopovers.headerImage} onOpenChange={(open) => isEditMode && setOpenPopovers(prev => ({ ...prev, headerImage: open }))}>
                          <PopoverTrigger asChild>
                            <div className={`relative group mb-4 ${isEditMode ? 'cursor-pointer' : 'cursor-default'}`}>
                            {theme.headerImage ? (
                              <img
                                src={theme.headerImage}
                                alt="Header"
                                className={`w-full object-cover rounded-md transition-all ${
                                  isEditMode ? 'hover:ring-2 hover:ring-primary/50' : ''
                                }`}
                                style={{ 
                                  borderRadius: `${theme.borderRadius}px`,
                                  height: theme.headerImageHeight ? `${theme.headerImageHeight}px` : '192px'
                                }}
                                onClick={(e) => {
                                  if (!isEditMode) return;
                                  e.stopPropagation();
                                  togglePopover('headerImage');
                                }}
                              />
                            ) : (
                              <div
                                className={`w-full h-48 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50/50 transition-all ${
                                  isEditMode ? 'hover:border-primary/50 cursor-pointer' : 'cursor-default'
                                }`}
                                style={{ borderRadius: `${theme.borderRadius}px` }}
                                onClick={(e) => {
                                  if (!isEditMode) return;
                                  e.stopPropagation();
                                  togglePopover('headerImage');
                                }}
                              >
                                <div className="text-center">
                                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                  {isEditMode && (
                                    <p className="text-xs text-gray-500">Clicca per aggiungere</p>
                                  )}
                                </div>
                              </div>
                            )}
                            {isEditMode && (
                              <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-primary text-white px-2 py-0.5 rounded whitespace-nowrap pointer-events-none z-30">
                                📷 Header
                              </span>
                            )}
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-4">
                            <Label className="text-sm font-semibold">Immagine Header</Label>
                            {theme.headerImage ? (
                              <>
                                <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                                  <img
                                    src={theme.headerImage}
                                    alt="Header preview"
                                    className="w-full h-32 object-cover"
                                    style={{ height: theme.headerImageHeight ? `${theme.headerImageHeight * 0.17}px` : undefined }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs font-medium">Altezza Immagine: {theme.headerImageHeight || 192}px</Label>
                                  <Slider
                                    value={[theme.headerImageHeight || 192]}
                                    onValueChange={([value]) => updateTheme({ headerImageHeight: value })}
                                    min={100}
                                    max={500}
                                    step={10}
                                    className="w-full"
                                  />
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>100px</span>
                                    <span>500px</span>
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
                                        if (file) handleImageUpload('headerImage', file);
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
                                    onClick={() => removeImage('headerImage')}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Rimuovi
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <div
                                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) handleImageUpload('headerImage', file);
                                  };
                                  input.click();
                                }}
                              >
                                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Clicca per caricare immagine</p>
                                <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG/SVG</p>
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                        </Popover>
                      </SortableLayoutElement>
                    );
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
                                        style={{ 
                                          height: theme.logoSize ? `${(theme.logoSize / 100) * 64}px` : '64px'
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      className={`h-16 w-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50/50 transition-all inline-block ${
                                        isEditMode ? 'hover:border-primary/50 cursor-pointer' : 'cursor-default'
                                      }`}
                                      onClick={(e) => {
                                        if (!isEditMode) return;
                                        e.stopPropagation();
                                        togglePopover('logo');
                                      }}
                                    >
                                      <div className="text-center">
                                        <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                        {isEditMode && <p className="text-xs text-gray-500">Logo</p>}
                                      </div>
                                    </div>
                                  )}
                                  {isEditMode && (
                                    <span className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-primary text-white px-2 py-0.5 rounded whitespace-nowrap pointer-events-none z-30">
                                      🏷️ Logo
                                    </span>
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
                                      className={`rounded transition-all p-2 -m-2 ${
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
                                        style={{ 
                                          height: theme.logoSize ? `${(theme.logoSize / 100) * 64}px` : '64px'
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      className={`h-16 w-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50/50 transition-all ${
                                        isEditMode ? 'hover:border-primary/50 cursor-pointer' : 'cursor-default'
                                      }`}
                                      onClick={(e) => {
                                        if (!isEditMode) return;
                                        e.stopPropagation();
                                        togglePopover('logo');
                                      }}
                                    >
                                      <div className="text-center">
                                        <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                        {isEditMode && <p className="text-xs text-gray-500">Logo</p>}
                                      </div>
                                    </div>
                                  )}
                                  {isEditMode && (
                                    <span className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-primary text-white px-2 py-0.5 rounded whitespace-nowrap pointer-events-none z-30">
                                      🏷️ Logo
                                    </span>
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
                                className={`text-2xl font-bold relative group transition-all flex-1 ${
                                  isEditMode ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 rounded px-2 py-1 -mx-2 -my-1 inline-block' : 'cursor-default'
                                }`}
                                style={{ color: theme.primaryColor }}
                                onClick={(e) => {
                                  if (!isEditMode) return;
                                  e.stopPropagation();
                                  togglePopover('title');
                                }}
                              >
                                {formTitle}
                                {isEditMode && (
                                  <span className="absolute -top-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-primary text-white px-2 py-0.5 rounded whitespace-nowrap pointer-events-none z-30">
                                    ✏️ Titolo
                                  </span>
                                )}
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
                                      className={`rounded transition-all p-2 -m-2 ${
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
                                        style={{ 
                                          height: theme.logoSize ? `${(theme.logoSize / 100) * 64}px` : '64px'
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      className={`h-16 w-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50/50 transition-all ${
                                        isEditMode ? 'hover:border-primary/50 cursor-pointer' : 'cursor-default'
                                      }`}
                                      onClick={(e) => {
                                        if (!isEditMode) return;
                                        e.stopPropagation();
                                        togglePopover('logo');
                                      }}
                                    >
                                      <div className="text-center">
                                        <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                        {isEditMode && <p className="text-xs text-gray-500">Logo</p>}
                                      </div>
                                    </div>
                                  )}
                                  {isEditMode && (
                                    <span className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-primary text-white px-2 py-0.5 rounded whitespace-nowrap pointer-events-none z-30">
                                      🏷️ Logo
                                    </span>
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
                              className={`text-2xl font-bold relative group transition-all w-full mb-2 ${
                                isEditMode ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 rounded px-2 py-1 -mx-2 -my-1 inline-block' : 'cursor-default block'
                              }`}
                              style={{ color: theme.primaryColor }}
                              onClick={(e) => {
                                if (!isEditMode) return;
                                e.stopPropagation();
                                togglePopover('title');
                              }}
                            >
                              {formTitle}
                              {isEditMode && (
                                <span className="absolute -top-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-primary text-white px-2 py-0.5 rounded whitespace-nowrap pointer-events-none z-30">
                                  ✏️ Titolo
                                </span>
                              )}
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
                                    style={{ 
                                      height: theme.logoSize ? `${(theme.logoSize / 100) * 64}px` : '64px'
                                    }}
                                  />
                                </div>
                              ) : (
                                <div
                                  className={`h-16 w-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50/50 transition-all inline-block ${
                                    isEditMode ? 'hover:border-primary/50 cursor-pointer' : 'cursor-default'
                                  }`}
                                  onClick={(e) => {
                                    if (!isEditMode) return;
                                    e.stopPropagation();
                                    togglePopover('logo');
                                  }}
                                >
                                  <div className="text-center">
                                    <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                    {isEditMode && <p className="text-xs text-gray-500">Logo</p>}
                                  </div>
                                </div>
                              )}
                              {isEditMode && (
                                <span className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-primary text-white px-2 py-0.5 rounded whitespace-nowrap pointer-events-none z-30">
                                  🏷️ Logo
                                </span>
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
                              className={`text-gray-600 mb-6 inline-block transition-all ${
                                isEditMode ? 'cursor-pointer hover:ring-2 hover:ring-blue-500/50 rounded px-2 py-1 -mx-2 -my-1 hover:bg-blue-50/50' : 'cursor-default'
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
                            {isEditMode && (
                              <div className="absolute -bottom-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none">
                                <div className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-lg whitespace-nowrap">
                                  📝 Modifica Testo Descrizione
                                </div>
                                <div className="absolute -top-1 left-4 w-2 h-2 bg-blue-600 rotate-45"></div>
                              </div>
                            )}
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
               
               {/* Question Box - sempre visualizzato dopo gli elementi del layout */}
               <Popover open={isEditMode && openPopovers.questionBox} onOpenChange={(open) => isEditMode && setOpenPopovers(prev => ({ ...prev, questionBox: open }))}>
                  <PopoverTrigger asChild>
                    <div
                      className={`p-4 rounded-md border mb-4 relative group transition-all ${
                        isEditMode ? 'cursor-pointer hover:ring-2 hover:ring-primary/50' : 'cursor-default'
                      }`}
                      style={{
                        backgroundColor: `${theme.backgroundColor}dd`,
                        borderColor: theme.accentColor,
                        borderRadius: `${theme.borderRadius}px`,
                      }}
                      onClick={(e) => {
                        if (!isEditMode) return;
                        e.stopPropagation();
                        togglePopover('questionBox');
                      }}
                    >
                      {isEditMode && (
                        <span className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-primary text-white px-2 py-0.5 rounded whitespace-nowrap pointer-events-none z-30">
                          📦 Box
                        </span>
                      )}
                      <p className="font-medium mb-2">Domanda di esempio</p>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="preview"
                            className="accent-current"
                            style={{ accentColor: theme.primaryColor }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span>Opzione 1</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="preview"
                            className="accent-current"
                            style={{ accentColor: theme.primaryColor }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span>Opzione 2</span>
                        </label>
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Colore Accento (Bordo)</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={theme.accentColor}
                            onChange={(e) => updateTheme({ accentColor: e.target.value })}
                            className="w-16 h-10 cursor-pointer rounded-lg border-2"
                          />
                          <Input
                            type="text"
                            value={theme.accentColor}
                            onChange={(e) => updateTheme({ accentColor: e.target.value })}
                            className="flex-1 font-mono text-sm"
                            placeholder="#000000"
                          />
                        </div>
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

                <Popover open={isEditMode && openPopovers.button} onOpenChange={(open) => isEditMode && setOpenPopovers(prev => ({ ...prev, button: open }))}>
                  <PopoverTrigger asChild>
                    <Button
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
                      {isEditMode && (
                        <span className="absolute -top-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-primary text-white px-2 py-0.5 rounded whitespace-nowrap pointer-events-none z-30">
                          🔘 Bottone
                        </span>
                      )}
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
              <PopoverContent className="w-96 max-h-[600px] overflow-y-auto" align="start" onClick={(e) => e.stopPropagation()}>
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
                        className="text-xs"
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
                        className="text-xs"
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
                                <SelectItem value="top">Alto</SelectItem>
                                <SelectItem value="bottom">Basso</SelectItem>
                                <SelectItem value="left">Sinistra</SelectItem>
                                <SelectItem value="right">Destra</SelectItem>
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
                                <SelectItem value="auto">Automatico</SelectItem>
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
    </div>
  );
}
