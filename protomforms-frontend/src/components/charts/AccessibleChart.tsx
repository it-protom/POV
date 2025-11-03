import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Eye, 
  EyeOff, 
  Download, 
  Maximize2, 
  Minimize2, 
  BarChart3, 
  Table
} from 'lucide-react';
import { CustomLegend, InteractiveLegend } from './CustomLegend';
import { CustomTooltip } from './CustomTooltip';

interface AccessibleChartProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  data?: any[];
  ariaLabel?: string;
  showPatterns?: boolean;
  showTable?: boolean;
  showLegend?: boolean;
  showControls?: boolean;
  onExport?: () => void;
  className?: string;
  legendProps?: any;
  colorBlindFriendly?: boolean;
}

// Pattern definitions for accessibility
const patterns = {
  dots: (color: string) => (
    <pattern id={`dots-${color.replace('#', '')}`} patternUnits="userSpaceOnUse" width="4" height="4">
      <rect width="4" height="4" fill={color} opacity="0.3" />
      <circle cx="2" cy="2" r="1" fill={color} />
    </pattern>
  ),
  lines: (color: string) => (
    <pattern id={`lines-${color.replace('#', '')}`} patternUnits="userSpaceOnUse" width="4" height="4">
      <rect width="4" height="4" fill={color} opacity="0.3" />
      <path d="M 0,4 L 4,0 M -1,1 L 1,-1 M 3,5 L 5,3" stroke={color} strokeWidth="1" />
    </pattern>
  ),
  diagonal: (color: string) => (
    <pattern id={`diagonal-${color.replace('#', '')}`} patternUnits="userSpaceOnUse" width="4" height="4">
      <rect width="4" height="4" fill={color} opacity="0.3" />
      <path d="M 0,0 L 4,4 M -1,3 L 1,5 M 3,-1 L 5,1" stroke={color} strokeWidth="1" />
    </pattern>
  ),
  cross: (color: string) => (
    <pattern id={`cross-${color.replace('#', '')}`} patternUnits="userSpaceOnUse" width="4" height="4">
      <rect width="4" height="4" fill={color} opacity="0.3" />
      <path d="M 0,2 L 4,2 M 2,0 L 2,4" stroke={color} strokeWidth="1" />
    </pattern>
  ),
};

export function AccessibleChart({
  children,
  title,
  description,
  data = [],
  ariaLabel,
  showPatterns = false,
  showTable = true,
  showLegend = true,
  showControls = true,
  onExport,
  className = '',
  legendProps = {},
  colorBlindFriendly = false
}: AccessibleChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeView, setActiveView] = useState<'chart' | 'table'>('chart');
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);

  // Screen reader announcements
  const announce = (message: string) => {
    setAnnouncements(prev => [...prev, message]);
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1));
    }, 3000);
  };

  // Toggle series visibility
  const toggleSeries = (dataKey: string) => {
    setHiddenSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey);
        announce(`Serie ${dataKey} mostrata`);
      } else {
        newSet.add(dataKey);
        announce(`Serie ${dataKey} nascosta`);
      }
      return newSet;
    });
  };

  // Toggle all series
  const toggleAllSeries = (hideAll: boolean) => {
    if (hideAll) {
      const allKeys = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'name') : [];
      setHiddenSeries(new Set(allKeys));
      announce('Tutte le serie nascoste');
    } else {
      setHiddenSeries(new Set());
      announce('Tutte le serie mostrate');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!chartRef.current?.contains(document.activeElement)) return;
      
      switch (e.key) {
        case 'Tab':
          if (e.shiftKey) {
            setActiveView(prev => prev === 'chart' ? 'table' : 'chart');
          } else {
            setActiveView(prev => prev === 'chart' ? 'table' : 'chart');
          }
          e.preventDefault();
          break;
        case 'Enter':
        case ' ':
          setIsExpanded(prev => !prev);
          e.preventDefault();
          break;
        case 'Escape':
          setIsExpanded(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mappatura colonne inglese -> italiano per admin
  const translateColumnHeader = (header: string): string => {
    const translations: Record<string, string> = {
      'name': 'Periodo',
      'responses': 'Risposte',
      'forms': 'Form',
      'device': 'Dispositivo',
      'percentage': 'Percentuale',
      'value': 'Valore',
      'count': 'Conteggio',
      'date': 'Data',
      'hour': 'Ora',
      'day': 'Giorno',
      'completions': 'Completamenti',
      'avgScore': 'Punteggio Medio',
      'questionId': 'ID Domanda',
      'questionText': 'Testo Domanda',
      'questionType': 'Tipo Domanda',
      'completed': 'Completate',
      'partial': 'Parziali',
      'abandoned': 'Abbandonate',
      'total': 'Totale',
      'mean': 'Media',
      'median': 'Mediana',
      'mode': 'Moda',
      'min': 'Minimo',
      'max': 'Massimo',
    };
    
    // Prima controlla traduzione esatta
    if (translations[header.toLowerCase()]) {
      return translations[header.toLowerCase()];
    }
    
    // Se contiene parole chiave, traduci parti
    let translated = header;
    Object.entries(translations).forEach(([en, it]) => {
      if (translated.toLowerCase().includes(en)) {
        translated = translated.replace(new RegExp(en, 'gi'), it);
      }
    });
    
    // Se è un mese o nome già in italiano, lascialo così
    const italianMonths = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 
                           'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
                           'gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
    if (italianMonths.some(month => translated.toLowerCase().includes(month))) {
      return translated;
    }
    
    // Capitalizza prima lettera se tutto minuscolo
    if (translated === translated.toLowerCase() && translated.length > 0) {
      return translated.charAt(0).toUpperCase() + translated.slice(1);
    }
    
    return translated;
  };

  // Generate table from data
  const generateTable = () => {
    if (!data || data.length === 0) return null;
    
    // Filtra le colonne - escludi 'color' che non è utile nella tabella
    const headers = Object.keys(data[0]).filter(header => header.toLowerCase() !== 'color');
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              {headers.map(header => (
                <th key={header} className="border border-gray-300 px-4 py-2 text-left font-semibold">
                  {translateColumnHeader(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {headers.map(header => {
                  let cellValue = row[header];
                  
                  // Formatta valori numerici
                  if (typeof cellValue === 'number') {
                    // Se è una percentuale, aggiungi il simbolo %
                    if (header.toLowerCase().includes('percentage') || header.toLowerCase().includes('percentuale')) {
                      cellValue = `${cellValue.toLocaleString('it-IT')}%`;
                    } else {
                      cellValue = cellValue.toLocaleString('it-IT');
                    }
                  }
                  
                  // Traduci valori speciali
                  if (typeof cellValue === 'string') {
                    const lowerValue = cellValue.toLowerCase();
                    if (lowerValue === 'desktop') cellValue = 'Desktop';
                    else if (lowerValue === 'mobile') cellValue = 'Mobile';
                    else if (lowerValue === 'tablet') cellValue = 'Tablet';
                    else if (lowerValue === 'completed' || lowerValue === 'completate') cellValue = 'Completate';
                    else if (lowerValue === 'partial' || lowerValue === 'parziali') cellValue = 'Parziali';
                    else if (lowerValue === 'abandoned' || lowerValue === 'abbandonate') cellValue = 'Abbandonate';
                  }
                  
                  return (
                    <td key={header} className="border border-gray-300 px-4 py-2">
                      {cellValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <motion.div
      ref={chartRef}
      className={`${className} relative`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcements.map((announcement, index) => (
          <div key={index}>{announcement}</div>
        ))}
      </div>

      <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          
          {showControls && (
            <div className="flex items-center gap-2">
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                  title="Esporta dati"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Riduci grafico' : 'Espandi grafico'}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
            <TabsList className={`grid w-full ${showTable ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <TabsTrigger value="chart" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Grafico
              </TabsTrigger>
              {showTable && (
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  Tabella
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="chart" className="mt-4">
              <div 
                className={`transition-all duration-300 ${isExpanded ? 'h-96' : 'h-64 sm:h-80'}`}
                role="img"
                aria-label={ariaLabel || `Grafico: ${title}`}
                tabIndex={0}
              >
                {/* Pattern definitions for accessibility */}
                {showPatterns && (
                  <svg width="0" height="0">
                    <defs>
                      {Object.entries(patterns).map(([patternName, patternFn]) => (
                        <g key={patternName}>
                          {patternFn('#FFCD00')}
                          {patternFn('#2563EB')}
                          {patternFn('#059669')}
                          {patternFn('#DC2626')}
                        </g>
                      ))}
                    </defs>
                  </svg>
                )}
                
                {children}
              </div>
              
              {showLegend && (
                <InteractiveLegend
                  {...legendProps}
                  onToggle={toggleSeries}
                  onToggleAll={toggleAllSeries}
                  hiddenSeries={hiddenSeries}
                  showSelectAll={true}
                />
              )}
            </TabsContent>

            {showTable && (
              <TabsContent value="table" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Dati in formato tabella</h3>
                    <Badge variant="secondary">
                      {data.length} righe
                    </Badge>
                  </div>
                  {generateTable()}
                </div>
              </TabsContent>
            )}


          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
} 