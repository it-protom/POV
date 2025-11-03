import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
  GripVertical
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

  const handleImageUpload = async (field: 'headerImage' | 'logo' | 'backgroundImage', file: File) => {
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
      {/* Header con tabs */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                Personalizzazione Form
              </CardTitle>
              <CardDescription className="mt-2">
                Crea un design unico e accattivante per il tuo form
              </CardDescription>
            </div>
          </div>
          
          {/* Tabs Navigation */}
          <div className="flex gap-2 mt-6 border-b">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-[1px]",
                    activeTab === tab.id
                      ? "text-primary border-primary"
                      : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <div className="space-y-6 animate-in fade-in-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-semibold">
                    <Droplet className="h-4 w-4 text-primary" />
                    Colore Principale
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      type="color"
                      value={theme.primaryColor}
                      onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                      className="w-20 h-12 cursor-pointer rounded-lg border-2"
                    />
                    <Input
                      type="text"
                      value={theme.primaryColor}
                      onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                      className="flex-1 font-mono"
                      placeholder="#000000"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Usato per bottoni e elementi principali</p>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-semibold">
                    <Droplet className="h-4 w-4 text-purple-500" />
                    Colore Accento
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      type="color"
                      value={theme.accentColor}
                      onChange={(e) => updateTheme({ accentColor: e.target.value })}
                      className="w-20 h-12 cursor-pointer rounded-lg border-2"
                    />
                    <Input
                      type="text"
                      value={theme.accentColor}
                      onChange={(e) => updateTheme({ accentColor: e.target.value })}
                      className="flex-1 font-mono"
                      placeholder="#000000"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Usato per evidenziare elementi</p>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-semibold">
                    <Droplet className="h-4 w-4 text-blue-500" />
                    Colore Sfondo
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      type="color"
                      value={theme.backgroundColor}
                      onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                      className="w-20 h-12 cursor-pointer rounded-lg border-2"
                    />
                    <Input
                      type="text"
                      value={theme.backgroundColor}
                      onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                      className="flex-1 font-mono"
                      placeholder="#ffffff"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Colore di sfondo del form</p>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-semibold">
                    <Droplet className="h-4 w-4 text-gray-700" />
                    Colore Testo
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      type="color"
                      value={theme.textColor}
                      onChange={(e) => updateTheme({ textColor: e.target.value })}
                      className="w-20 h-12 cursor-pointer rounded-lg border-2"
                    />
                    <Input
                      type="text"
                      value={theme.textColor}
                      onChange={(e) => updateTheme({ textColor: e.target.value })}
                      className="flex-1 font-mono"
                      placeholder="#000000"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Colore del testo principale</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-semibold">
                  <Layout className="h-4 w-4" />
                  Stile Bottoni
                </Label>
                <Select
                  value={theme.buttonStyle}
                  onValueChange={(value: 'filled' | 'outlined') => updateTheme({ buttonStyle: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="filled">Riempito</SelectItem>
                    <SelectItem value="outlined">Solo Bordo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Typography Tab */}
          {activeTab === 'typography' && (
            <div className="space-y-6 animate-in fade-in-50">
              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-semibold">
                  <Type className="h-4 w-4" />
                  Font Family
                </Label>
                <Select value={theme.fontFamily} onValueChange={(value) => updateTheme({ fontFamily: value })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {availableFonts.map((font) => (
                      <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="flex items-center gap-2 font-semibold">
                  <Layout className="h-4 w-4" />
                  Raggio Bordi
                </Label>
                <div className="space-y-3">
                  <Slider
                    value={[theme.borderRadius]}
                    onValueChange={([value]) => updateTheme({ borderRadius: value })}
                    min={0}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Quadrato (0px)</span>
                    <span className="font-semibold text-primary">{theme.borderRadius}px</span>
                    <span>Molto arrotondato (30px)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="space-y-6 animate-in fade-in-50">
              <DraggableImageUpload
                image={theme.backgroundImage}
                onRemove={() => removeImage('backgroundImage')}
                onDrop={(file) => handleImageUpload('backgroundImage', file)}
                label="Immagine di Background"
                description="Immagine di sfondo che apparirà dietro tutto il form. Perfetta per creare un ambiente immersivo."
                previewClass="w-full h-64"
                aspectRatio="aspect-[16/9]"
              />

              <Separator />

              <DraggableImageUpload
                image={theme.headerImage}
                onRemove={() => removeImage('headerImage')}
                onDrop={(file) => handleImageUpload('headerImage', file)}
                label="Immagine Header"
                description="Immagine che apparirà in cima al form, sopra il titolo"
                previewClass="w-full h-48"
                aspectRatio="aspect-video"
              />

              <Separator />

              <DraggableImageUpload
                image={theme.logo}
                onRemove={() => removeImage('logo')}
                onDrop={(file) => handleImageUpload('logo', file)}
                label="Logo"
                description="Logo aziendale o personalizzato che apparirà nel form"
                previewClass="h-32 w-auto"
                aspectRatio="aspect-auto"
              />

              {theme.backgroundImage && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="font-semibold">Opzioni Background</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Posizione</Label>
                        <Select
                          value={theme.backgroundPosition || 'center'}
                          onValueChange={(value: any) => updateTheme({ backgroundPosition: value })}
                        >
                          <SelectTrigger>
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
                        <Label className="text-sm">Dimensione</Label>
                        <Select
                          value={theme.backgroundSize || 'cover'}
                          onValueChange={(value: any) => updateTheme({ backgroundSize: value })}
                        >
                          <SelectTrigger>
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
                      <Label className="text-sm">Opacità: {((theme.backgroundOpacity || 100) / 100).toFixed(1)}</Label>
                      <Slider
                        value={[theme.backgroundOpacity || 100]}
                        onValueChange={([value]) => updateTheme({ backgroundOpacity: value })}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Layout Tab */}
          {activeTab === 'layout' && (
            <div className="space-y-6 animate-in fade-in-50">
              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-semibold">
                  <Layout className="h-4 w-4" />
                  Raggio Bordi
                </Label>
                <div className="space-y-3">
                  <Slider
                    value={[theme.borderRadius]}
                    onValueChange={([value]) => updateTheme({ borderRadius: value })}
                    min={0}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Quadrato (0px)</span>
                    <span className="font-semibold text-primary">{theme.borderRadius}px</span>
                    <span>Molto arrotondato (30px)</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-semibold">
                  <Layout className="h-4 w-4" />
                  Stile Bottoni
                </Label>
                <Select
                  value={theme.buttonStyle}
                  onValueChange={(value: 'filled' | 'outlined') => updateTheme({ buttonStyle: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="filled">Riempito</SelectItem>
                    <SelectItem value="outlined">Solo Bordo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Anteprima Live
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Nascondi' : 'Mostra'}
            </Button>
          </div>
          <CardDescription>
            Ecco come apparirà il tuo form agli utenti
          </CardDescription>
        </CardHeader>
        {showPreview && (
          <CardContent>
            <div
              className="relative border rounded-lg p-6 space-y-4 min-h-[400px] overflow-hidden"
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
              }}
            >
              {/* Overlay per opacità background */}
              {theme.backgroundImage && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundColor: `rgba(255, 255, 255, ${1 - (theme.backgroundOpacity || 100) / 100})`,
                  }}
                />
              )}
              
              <div className="relative z-10">
                {theme.headerImage && (
                  <img
                    src={theme.headerImage}
                    alt="Header"
                    className="w-full h-48 object-cover rounded-md mb-4"
                    style={{ borderRadius: `${theme.borderRadius}px` }}
                  />
                )}
                
                {theme.logo && (
                  <div className="mb-4">
                    <img
                      src={theme.logo}
                      alt="Logo"
                      className="h-16 w-auto object-contain"
                    />
                  </div>
                )}

                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: theme.primaryColor }}
                >
                  {formTitle}
                </h2>
                
                <p className="text-gray-600 mb-6">{formDescription}</p>

                <div
                  className="p-4 rounded-md border mb-4"
                  style={{
                    backgroundColor: `${theme.backgroundColor}dd`,
                    borderColor: theme.accentColor,
                    borderRadius: `${theme.borderRadius}px`,
                  }}
                >
                  <p className="font-medium mb-2">Domanda di esempio</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="preview"
                        className="accent-current"
                        style={{ accentColor: theme.primaryColor }}
                      />
                      <span>Opzione 1</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="preview"
                        className="accent-current"
                        style={{ accentColor: theme.primaryColor }}
                      />
                      <span>Opzione 2</span>
                    </label>
                  </div>
                </div>

                <Button
                  className="float-right"
                  style={{
                    backgroundColor: theme.buttonStyle === 'filled' ? theme.primaryColor : 'transparent',
                    color: theme.buttonStyle === 'filled' ? '#fff' : theme.primaryColor,
                    border: theme.buttonStyle === 'outlined' ? `2px solid ${theme.primaryColor}` : 'none',
                    borderRadius: `${theme.borderRadius}px`,
                  }}
                >
                  Invia
                </Button>
                <div className="clear-both" />
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
