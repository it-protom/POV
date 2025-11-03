import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  labelFormatter?: (value: any) => string;
  valueFormatter?: (value: any, name: string) => string;
  showTotal?: boolean;
  showPercentage?: boolean;
  customContent?: (data: any) => React.ReactNode;
  theme?: 'light' | 'dark';
}

export function CustomTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
  showTotal = false,
  showPercentage = false,
  customContent,
  theme = 'light'
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const formatLabel = (value: any) => {
    if (labelFormatter) {
      return labelFormatter(value);
    }
    
    // Verifica se il valore esiste
    if (!value) return '';
    
    // Auto-detect date format
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      // Verifica se la data è valida
      if (!isNaN(date.getTime())) {
        try {
          return format(date, 'dd MMM yyyy', { locale: it });
        } catch (error) {
          // Fallback se il formato fallisce
          return value.toString();
        }
      }
    }
    
    return value.toString();
  };

  const formatValue = (value: any, name: string) => {
    if (valueFormatter) {
      return valueFormatter(value, name);
    }
    
    // Verifica se il valore esiste
    if (value === null || value === undefined) return '';
    
    // Auto-format numbers
    if (typeof value === 'number' && !isNaN(value)) {
      if (name.toLowerCase().includes('percentuale') || name.toLowerCase().includes('tasso')) {
        return `${value.toFixed(1)}%`;
      }
      return value.toLocaleString('it-IT');
    }
    
    return value.toString();
  };

  const total = showTotal ? payload.reduce((sum, item) => sum + (item.value || 0), 0) : 0;

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 text-white border-gray-700' 
    : 'bg-white text-gray-900 border-gray-200';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={`
          ${themeClasses}
          border rounded-xl shadow-lg backdrop-blur-sm
          p-4 max-w-xs z-50
        `}
        style={{
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Custom content override */}
        {customContent && customContent({ payload, label })}
        
        {/* Default content */}
        {!customContent && (
          <div className="space-y-3">
            {/* Label/Date */}
            {label && (
              <div className="text-sm font-semibold text-gray-600 border-b border-gray-100 pb-2">
                {formatLabel(label)}
              </div>
            )}
            
            {/* Data items */}
            <div className="space-y-2">
              {payload.map((item, index) => (
                <div key={index} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {item.name || item.dataKey}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">
                      {formatValue(item.value, item.name || item.dataKey)}
                    </span>
                    {showPercentage && total > 0 && (
                      <div className="text-xs text-gray-500">
                        {((item.value / total) * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Total */}
            {showTotal && total > 0 && (
              <>
                <Separator className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">
                    Totale
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {total.toLocaleString('it-IT')}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Tooltip specializzato per grafici temporali
export function TemporalTooltip(props: any) {
  return (
    <CustomTooltip
      {...props}
      labelFormatter={(value) => {
        if (!value) return '';
        
        const date = new Date(value);
        // Verifica se la data è valida
        if (isNaN(date.getTime())) {
          // Se non è una data valida, restituisce il valore originale
          return value.toString();
        }
        
        try {
          return format(date, 'dd MMM yyyy', { locale: it });
        } catch (error) {
          // Fallback se il formato fallisce
          return value.toString();
        }
      }}
      valueFormatter={(value, name) => {
        if (name === 'responses') return `${value} risposte`;
        if (name === 'completions') return `${value} completamenti`;
        if (name === 'avgScore') return `${value}/5 ⭐`;
        return value.toLocaleString('it-IT');
      }}
    />
  );
}

// Tooltip specializzato per grafici di performance
export function PerformanceTooltip(props: any) {
  return (
    <CustomTooltip
      {...props}
      valueFormatter={(value, name) => {
        if (value === null || value === undefined || isNaN(value)) return '';
        
        if (name.toLowerCase().includes('tasso') || name.toLowerCase().includes('percentuale')) {
          return `${value.toFixed(1)}%`;
        }
        return value.toLocaleString('it-IT');
      }}
      showPercentage={true}
    />
  );
}

// Tooltip specializzato per distribuzione dispositivi
export function DeviceTooltip(props: any) {
  const deviceIcons = {
    desktop: '🖥️',
    mobile: '📱',
    tablet: '📱',
  };

  return (
    <CustomTooltip
      {...props}
      customContent={({ payload, label }) => (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-600 border-b border-gray-100 pb-2">
            Distribuzione Dispositivi
          </div>
          {payload?.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {deviceIcons[item.name as keyof typeof deviceIcons] || '📊'}
                </span>
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {item.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-900">
                  {item.value && !isNaN(item.value) ? item.value.toLocaleString('it-IT') : '0'}
                </span>
                <div className="text-xs text-gray-500">
                  {item.percentage && !isNaN(item.percentage) ? `${item.percentage.toFixed(1)}%` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    />
  );
}

// Tooltip specializzato per analisi completamento
export function CompletionTooltip(props: any) {
  const statusIcons = {
    completed: '✅',
    partial: '⚠️',
    abandoned: '❌',
  };

  return (
    <CustomTooltip
      {...props}
      customContent={({ payload, label }) => (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-600 border-b border-gray-100 pb-2">
            Stato Completamento
          </div>
          {payload?.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {statusIcons[item.name as keyof typeof statusIcons] || '📊'}
                </span>
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {item.name === 'completed' ? 'Completate' : 
                   item.name === 'partial' ? 'Parziali' : 'Abbandonate'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-900">
                  {item.value && !isNaN(item.value) ? item.value.toLocaleString('it-IT') : '0'}
                </span>
                <div className="text-xs text-gray-500">
                  {item.percentage && !isNaN(item.percentage) ? `${item.percentage.toFixed(1)}%` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    />
  );
} 