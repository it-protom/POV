import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Maximize2, Minimize2, Download } from 'lucide-react';
import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  id: string;
  isExpanded?: boolean;
  onToggleExpand?: (id: string) => void;
  showDownload?: boolean;
  className?: string;
  index?: number;
}

export function ChartCard({ 
  title, 
  description, 
  children, 
  id, 
  isExpanded = false, 
  onToggleExpand, 
  showDownload = true,
  className = "",
  index = 0
}: ChartCardProps) {
  return (
    <motion.div 
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm">{description}</CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            {onToggleExpand && (
              <Button variant="outline" size="sm" onClick={() => onToggleExpand(id)}>
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
            {showDownload && (
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className={`transition-all duration-300 ${isExpanded ? 'h-96' : 'h-64 sm:h-80'}`}>
            {children}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 