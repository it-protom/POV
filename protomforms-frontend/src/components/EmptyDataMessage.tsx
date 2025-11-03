import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { BarChart3, Database, AlertTriangle } from 'lucide-react';

interface EmptyDataMessageProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
  className?: string;
}

export function EmptyDataMessage({
  title = "Nessun dato disponibile",
  message = "Non ci sono ancora dati da visualizzare. Inizia creando i tuoi primi form per vedere le statistiche.",
  icon,
  showCreateButton = true,
  onCreateClick,
  className = ""
}: EmptyDataMessageProps) {
  const defaultIcon = <Database className="h-12 w-12 text-gray-400" />;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="border-dashed border-2 border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="mb-4">
            {icon || defaultIcon}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          
          <p className="text-gray-600 max-w-md mb-6">
            {message}
          </p>
          
          {showCreateButton && (
            <button
              onClick={onCreateClick}
              className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Crea il tuo primo form
            </button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function NoDataChart({ 
  title, 
  description, 
  height = 300 
}: { 
  title: string; 
  description?: string; 
  height?: number; 
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
        
        <div 
          className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50"
          style={{ height }}
        >
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Nessun dato da visualizzare
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 