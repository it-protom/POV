import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: LucideIcon;
  color: string;
  index?: number;
}

const cardHoverVariants = {
  hover: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
};

export function MetricCard({ title, value, change, changeType, icon: Icon, color, index = 0 }: MetricCardProps) {
  return (
    <motion.div
      variants={cardHoverVariants}
      whileHover="hover"
      className="relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-gray-50 opacity-90"></div>
        <CardContent className="relative p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-xl bg-gradient-to-br from-${color}-100 to-${color}-200 shadow-sm`}>
                <Icon className={`h-5 w-5 sm:h-6 sm:w-6 text-${color}-600`} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className={`inline-flex items-center text-sm font-medium ${
              changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {changeType === 'positive' ? (
                <ArrowUpRight className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 mr-1" />
              )}
              {change}
            </span>
            <span className="text-xs sm:text-sm text-gray-500 ml-2">vs mese scorso</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 