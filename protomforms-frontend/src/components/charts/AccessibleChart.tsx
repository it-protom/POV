import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Eye, 
  EyeOff, 
  Download, 
  Maximize2, 
  Minimize2, 
  BarChart3
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
  showLegend = true,
  showControls = true,
  onExport,
  className = '',
  legendProps = {},
  colorBlindFriendly = false
}: AccessibleChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
          <div className="mt-4">
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 