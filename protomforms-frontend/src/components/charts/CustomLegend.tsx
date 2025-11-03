import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface LegendItem {
  value: string;
  color: string;
  payload?: any;
  inactive?: boolean;
}

interface CustomLegendProps {
  payload?: LegendItem[];
  onToggle?: (dataKey: string) => void;
  hiddenSeries?: Set<string>;
  layout?: 'horizontal' | 'vertical';
  showValues?: boolean;
  showToggle?: boolean;
  className?: string;
  iconType?: 'circle' | 'square' | 'line' | 'rect';
  size?: 'sm' | 'md' | 'lg';
}

export function CustomLegend({
  payload = [],
  onToggle,
  hiddenSeries = new Set(),
  layout = 'horizontal',
  showValues = false,
  showToggle = false,
  className = '',
  iconType = 'circle',
  size = 'md'
}: CustomLegendProps) {
  const sizeClasses = {
    sm: 'text-xs gap-2',
    md: 'text-sm gap-3',
    lg: 'text-base gap-4'
  };

  const iconSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const renderIcon = (color: string, isHidden: boolean) => {
    const baseClasses = `${iconSizes[size]} flex-shrink-0 transition-opacity duration-200`;
    const opacity = isHidden ? 'opacity-30' : 'opacity-100';
    
    switch (iconType) {
      case 'circle':
        return (
          <div
            className={`${baseClasses} ${opacity} rounded-full`}
            style={{ backgroundColor: color }}
          />
        );
      case 'square':
        return (
          <div
            className={`${baseClasses} ${opacity} rounded-sm`}
            style={{ backgroundColor: color }}
          />
        );
      case 'line':
        return (
          <div
            className={`${baseClasses} ${opacity} h-0.5 rounded-full`}
            style={{ backgroundColor: color }}
          />
        );
      case 'rect':
        return (
          <div
            className={`${baseClasses} ${opacity} rounded`}
            style={{ backgroundColor: color }}
          />
        );
      default:
        return (
          <div
            className={`${baseClasses} ${opacity} rounded-full`}
            style={{ backgroundColor: color }}
          />
        );
    }
  };

  const containerClasses = layout === 'horizontal' 
    ? 'flex flex-wrap items-center justify-center'
    : 'flex flex-col items-start';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${containerClasses} ${sizeClasses[size]} ${className}`}
    >
      {payload.map((item, index) => {
        const isHidden = hiddenSeries.has(item.value);
        const dataKey = item.payload?.dataKey || item.value;
        
        return (
          <motion.div
            key={`legend-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg
              transition-all duration-200 cursor-pointer
              hover:bg-gray-50 hover:shadow-sm
              ${isHidden ? 'opacity-60' : 'opacity-100'}
            `}
            onClick={() => onToggle?.(dataKey)}
          >
            {renderIcon(item.color, isHidden)}
            
            <span 
              className={`
                font-medium transition-opacity duration-200
                ${isHidden ? 'opacity-60 line-through' : 'opacity-100'}
              `}
            >
              {item.value}
            </span>
            
            {showValues && item.payload?.value && (
              <Badge 
                variant="secondary" 
                className="ml-1 text-xs"
              >
                {typeof item.payload.value === 'number' 
                  ? item.payload.value.toLocaleString('it-IT')
                  : item.payload.value
                }
              </Badge>
            )}
            
            {showToggle && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 p-1 h-auto opacity-60 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle?.(dataKey);
                }}
              >
                {isHidden ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </Button>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// Legend specializzato per grafici temporali
export function TemporalLegend(props: any) {
  return (
    <CustomLegend
      {...props}
      iconType="line"
      showToggle={true}
      className="mt-4 pt-4 border-t border-gray-100"
    />
  );
}

// Legend specializzato per grafici a torta
export function PieLegend(props: any) {
  return (
    <CustomLegend
      {...props}
      layout="vertical"
      iconType="circle"
      showValues={true}
      className="ml-6"
    />
  );
}

// Legend specializzato per grafici a barre
export function BarLegend(props: any) {
  return (
    <CustomLegend
      {...props}
      iconType="rect"
      showToggle={true}
      className="mt-4 pt-4 border-t border-gray-100"
    />
  );
}

// Legend compatto per spazi ridotti
export function CompactLegend(props: any) {
  return (
    <CustomLegend
      {...props}
      size="sm"
      iconType="circle"
      className="mt-2"
    />
  );
}

// Legend con controlli avanzati
export function InteractiveLegend({
  payload = [],
  onToggle,
  hiddenSeries = new Set(),
  onToggleAll,
  showSelectAll = true,
  ...props
}: CustomLegendProps & {
  onToggleAll?: (hideAll: boolean) => void;
  showSelectAll?: boolean;
}) {
  const allHidden = payload.every(item => 
    hiddenSeries.has(item.payload?.dataKey || item.value)
  );
  
  const someHidden = payload.some(item => 
    hiddenSeries.has(item.payload?.dataKey || item.value)
  );

  return (
    <div className="space-y-3">
      {showSelectAll && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            Serie di dati
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleAll?.(false)}
              disabled={!someHidden}
            >
              Mostra tutto
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleAll?.(true)}
              disabled={allHidden}
            >
              Nascondi tutto
            </Button>
          </div>
        </div>
      )}
      
      <CustomLegend
        {...props}
        payload={payload}
        onToggle={onToggle}
        hiddenSeries={hiddenSeries}
        showToggle={true}
        iconType="circle"
        layout="horizontal"
      />
    </div>
  );
} 