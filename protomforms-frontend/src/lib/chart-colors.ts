// Sistema di colori per grafici - Ottimizzato per visibilità e accessibilità
export const chartColors = {
  // Colori primari con ottimo contrasto
  primary: {
    gold: '#FFCD00',        // Giallo oro principale
    darkGold: '#E6B800',    // Oro scuro per hover/focus
    lightGold: '#FFF5CC',   // Oro chiaro per background
  },
  
  // Palette secondaria per diversi tipi di dati
  secondary: {
    blue: '#2563EB',        // Blu professionale
    green: '#059669',       // Verde successo
    red: '#DC2626',         // Rosso errore/attenzione
    purple: '#7C3AED',      // Viola per categoria
    orange: '#EA580C',      // Arancione per warning
    teal: '#0D9488',        // Teal per info
    indigo: '#4F46E5',      // Indigo per dati speciali
    pink: '#DB2777',        // Rosa per highlights
  },
  
  // Gradients per aree e background
  gradients: {
    goldArea: {
      start: '#FFCD00',
      end: '#FFF5CC',
      opacity: {
        start: 0.8,
        end: 0.1
      }
    },
    blueArea: {
      start: '#2563EB',
      end: '#DBEAFE',
      opacity: {
        start: 0.8,
        end: 0.1
      }
    },
    greenArea: {
      start: '#059669',
      end: '#D1FAE5',
      opacity: {
        start: 0.8,
        end: 0.1
      }
    }
  },
  
  // Colori per stati e categorie
  status: {
    completed: '#059669',   // Verde per completato
    partial: '#EA580C',     // Arancione per parziale
    abandoned: '#DC2626',   // Rosso per abbandonato
    active: '#2563EB',      // Blu per attivo
    inactive: '#6B7280',    // Grigio per inattivo
  },
  
  // Palette per grafici multi-serie (accessibile)
  multiSeries: [
    '#FFCD00',  // Oro
    '#2563EB',  // Blu
    '#059669',  // Verde
    '#DC2626',  // Rosso
    '#7C3AED',  // Viola
    '#EA580C',  // Arancione
    '#0D9488',  // Teal
    '#4F46E5',  // Indigo
  ],
  
  // Colori per dispositivi
  devices: {
    desktop: '#2563EB',
    mobile: '#059669',
    tablet: '#EA580C',
  },
  
  // Colori per grafici temporali
  temporal: {
    current: '#FFCD00',
    previous: '#94A3B8',
    trend: '#2563EB',
    forecast: '#7C3AED',
  },
  
  // Colori neutri per UI
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  }
};

// Configurazioni per tooltip
export const tooltipConfig = {
  style: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1E293B',
  },
  labelStyle: {
    color: '#475569',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  contentStyle: {
    border: 'none',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(8px)',
  }
};

// Configurazioni per legende
export const legendConfig = {
  style: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#475569',
  },
  iconType: 'circle' as const,
  iconSize: 8,
  wrapperStyle: {
    paddingTop: '20px',
    fontSize: '13px',
  }
};

// Configurazioni per assi
export const axisConfig = {
  style: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#64748B',
  },
  tickStyle: {
    fontSize: '10px',
    color: '#94A3B8',
  },
  gridStyle: {
    stroke: '#E2E8F0',
    strokeDasharray: '3 3',
    opacity: 0.6,
  },
  // Configurazioni per prevenire sovrapposizione testo
  xAxis: {
    height: 60,
    interval: 'preserveStartEnd',
    angle: -45,
    textAnchor: 'end',
    tickMargin: 12,
  },
  yAxis: {
    width: 60,
    tickMargin: 8,
  }
};

// Funzioni helper per generare colori
export const getChartColor = (index: number, type: 'primary' | 'secondary' | 'multiSeries' = 'multiSeries') => {
  switch (type) {
    case 'primary':
      return chartColors.primary.gold;
    case 'secondary':
      const secondaryColors = Object.values(chartColors.secondary);
      return secondaryColors[index % secondaryColors.length];
    case 'multiSeries':
      return chartColors.multiSeries[index % chartColors.multiSeries.length];
    default:
      return chartColors.multiSeries[index % chartColors.multiSeries.length];
  }
};

// Funzione per generare gradient definitions per SVG
export const generateGradientDefs = (id: string, colors: { start: string; end: string; opacity?: { start: number; end: number } }) => {
  const opacity = colors.opacity || { start: 0.8, end: 0.1 };
  return {
    id,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1",
    stops: [
      { offset: "5%", stopColor: colors.start, stopOpacity: opacity.start },
      { offset: "95%", stopColor: colors.end, stopOpacity: opacity.end }
    ]
  };
};

// Preset per tipi di grafici comuni
export const chartPresets = {
  area: {
    strokeWidth: 2,
    fillOpacity: 0.8,
    dot: { r: 4, strokeWidth: 2, fill: '#fff' },
    activeDot: { r: 6, strokeWidth: 2, fill: '#fff' }
  },
  line: {
    strokeWidth: 3,
    dot: { r: 5, strokeWidth: 2, fill: '#fff' },
    activeDot: { r: 7, strokeWidth: 2, fill: '#fff' }
  },
  bar: {
    radius: [4, 4, 0, 0] as [number, number, number, number],
    maxBarSize: 60,
  },
  pie: {
    innerRadius: 60,
    outerRadius: 120,
    paddingAngle: 2,
    cornerRadius: 4,
  }
};

// Funzione per ottenere colori basati su performance
export const getPerformanceColor = (value: number, thresholds: { good: number; warning: number } = { good: 80, warning: 60 }) => {
  if (value >= thresholds.good) return chartColors.status.completed;
  if (value >= thresholds.warning) return chartColors.status.partial;
  return chartColors.status.abandoned;
};

// Configurazione responsive per grafici
export const responsiveConfig = {
  mobile: {
    fontSize: 11,
    padding: 8,
    legendIconSize: 6,
  },
  tablet: {
    fontSize: 12,
    padding: 12,
    legendIconSize: 7,
  },
  desktop: {
    fontSize: 13,
    padding: 16,
    legendIconSize: 8,
  }
}; 