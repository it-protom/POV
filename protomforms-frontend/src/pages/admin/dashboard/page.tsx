import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ComposedChart
} from 'recharts';
import {
  FileText,
  MessageSquare,
  Users,
  Target,
  Plus,
  TrendingUp,
  RefreshCw,
  Eye,
  Clock,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { MetricCard } from '../../../components/dashboard/MetricCard';
import { ChartCard } from '../../../components/dashboard/ChartCard';
import { SimpleLoader } from '../../../components/SimpleLoader';

// Import new chart system
import { chartColors, tooltipConfig, legendConfig, axisConfig, chartPresets, getChartColor } from '../../../lib/chart-colors';
import { CustomTooltip, TemporalTooltip, PerformanceTooltip, DeviceTooltip } from '../../../components/charts/CustomTooltip';
import { CustomLegend, TemporalLegend, PieLegend, BarLegend } from '../../../components/charts/CustomLegend';
import { AccessibleChart } from '../../../components/charts/AccessibleChart';
import { NoDataChart } from '../../../components/EmptyDataMessage';

// Simplified and consolidated interfaces
import type { LucideIcon } from 'lucide-react';

interface DashboardStats {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: LucideIcon;
  color: string;
}

interface ChartData {
  name: string;
  responses: number;
  forms: number;
  satisfaction: number;
  engagement: number;
  completion: number;
}

interface DashboardData {
  stats: DashboardStats[];
  chartData: ChartData[];
  deviceData: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  completionData: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <SimpleLoader text="Caricamento Dashboard - Stiamo preparando i tuoi dati..." />
        </div>
      </div>
    );
  }

  // Utilizziamo solo dati reali, nessun mock
  const stats = dashboardData?.stats || [];
  const chartData = dashboardData?.chartData || [];
  const deviceData = dashboardData?.deviceData || [];
  const completionData = dashboardData?.completionData || [];

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-white"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <div className="p-4 sm:p-6 lg:p-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 lg:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Dashboard Analytics
              </h1>
            
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Ultimi 7 giorni</SelectItem>
                  <SelectItem value="30d">Ultimi 30 giorni</SelectItem>
                  <SelectItem value="90d">Ultimi 3 mesi</SelectItem>
                  <SelectItem value="12m">Ultimo anno</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <RefreshCw className="h-4 w-4 mr-2" />
                Aggiorna
              </Button>
              
              <Button asChild className="bg-[#FFCD00] hover:bg-[#E6B800] text-black font-medium flex-shrink-0">
                <Link to="/admin/forms/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Form
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
        {stats.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            {stats.map((stat, index) => (
              <MetricCard
                key={stat.title}
                {...stat}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">Nessun dato disponibile</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Charts with Improved Visuals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Primary Chart - Andamento Temporale */}
          {chartData && chartData.length > 0 ? (
            <AccessibleChart
                  title="Andamento Risposte e Forms"
                  description="Trend degli ultimi 6 mesi"
              data={chartData}
              showLegend={true}
              showTable={true}
              showControls={true}
              ariaLabel="Grafico che mostra l'andamento delle risposte e dei form negli ultimi 6 mesi"
              legendProps={{
                payload: [
                  { value: 'Risposte', color: chartColors.primary.gold },
                  { value: 'Forms', color: chartColors.secondary.blue }
                ]
              }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <defs>
                        <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.primary.gold} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={chartColors.primary.lightGold} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                <CartesianGrid {...axisConfig.gridStyle} />
                <XAxis 
                  dataKey="name" 
                  {...axisConfig.style}
                  tick={{ 
                    fontSize: 10, 
                    fill: axisConfig.tickStyle.color
                  }}
                  height={60}
                  interval="preserveStartEnd"
                  tickMargin={12}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis 
                  yAxisId="left" 
                  {...axisConfig.style}
                  tick={{ fontSize: 10, fill: axisConfig.tickStyle.color }}
                  width={50}
                  tickMargin={8}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  {...axisConfig.style}
                  tick={{ fontSize: 10, fill: axisConfig.tickStyle.color }}
                  width={50}
                  tickMargin={8}
                />
                <Tooltip content={<TemporalTooltip />} />
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="responses" 
                  stroke={chartColors.primary.gold}
                        fillOpacity={1} 
                        fill="url(#colorResponses)"
                  strokeWidth={chartPresets.area.strokeWidth}
                  dot={chartPresets.area.dot}
                  activeDot={chartPresets.area.activeDot}
                        name="Risposte"
                      />
                <Line 
                        yAxisId="right"
                  type="monotone" 
                        dataKey="forms" 
                  stroke={chartColors.secondary.blue}
                  strokeWidth={chartPresets.line.strokeWidth}
                  dot={chartPresets.line.dot}
                  activeDot={chartPresets.line.activeDot}
                        name="Forms"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
          </AccessibleChart>
          ) : (
            <NoDataChart 
              title="Andamento Risposte e Forms"
              description="Trend degli ultimi 6 mesi"
              height={350}
            />
          )}

          {/* Completion Analysis */}
          {completionData && completionData.length > 0 ? (
            <AccessibleChart
              title="Distribuzione Completamento"
              description="Stato delle risposte"
              data={completionData}
              showLegend={true}
              showTable={true}
              ariaLabel="Grafico a torta che mostra la distribuzione dello stato di completamento delle risposte"
              legendProps={{
                payload: [
                  { value: 'Completate', color: chartColors.status.completed },
                  { value: 'Parziali', color: chartColors.status.partial },
                  { value: 'Abbandonate', color: chartColors.status.abandoned }
                ]
              }}
            >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={completionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={chartPresets.pie.innerRadius}
                  outerRadius={chartPresets.pie.outerRadius}
                  paddingAngle={chartPresets.pie.paddingAngle}
                  dataKey="value"
                  label={({ name, percentage }) => percentage > 5 ? `${name} ${percentage}%` : ''}
                  labelLine={false}
                  fontSize={10}
                >
                  {completionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.name === 'Completate' ? chartColors.status.completed :
                        entry.name === 'Parziali' ? chartColors.status.partial :
                        chartColors.status.abandoned
                      } 
                    />
                  ))}
                </Pie>
                <Tooltip content={<PerformanceTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </AccessibleChart>
          ) : (
            <NoDataChart 
              title="Distribuzione Completamento"
              description="Stato delle risposte"
              height={350}
            />
          )}
        </div>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Device Distribution */}
          <AccessibleChart
            title="Distribuzione Dispositivi"
            description="Accessi per tipo di dispositivo"
            data={deviceData}
            showLegend={true}
            showTable={true}
            ariaLabel="Grafico a barre che mostra la distribuzione degli accessi per tipo di dispositivo"
            legendProps={{
              payload: [
                { value: 'Desktop', color: chartColors.devices.desktop },
                { value: 'Mobile', color: chartColors.devices.mobile },
                { value: 'Tablet', color: chartColors.devices.tablet }
              ]
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceData}>
                <CartesianGrid {...axisConfig.gridStyle} />
                <XAxis 
                  dataKey="device" 
                  {...axisConfig.style}
                  tick={{ fontSize: 10, fill: axisConfig.tickStyle.color }}
                  height={50}
                  tickMargin={8}
                />
                <YAxis 
                  {...axisConfig.style}
                  tick={{ fontSize: 10, fill: axisConfig.tickStyle.color }}
                  width={50}
                  tickMargin={8}
                />
                <Tooltip content={<DeviceTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill={chartColors.secondary.blue}
                  radius={chartPresets.bar.radius}
                  maxBarSize={chartPresets.bar.maxBarSize}
                />
              </BarChart>
            </ResponsiveContainer>
          </AccessibleChart>

          {/* Performance Metrics */}
          <AccessibleChart
            title="Metriche Performance"
            description="Soddisfazione e engagement"
            data={chartData}
            showLegend={true}
            showTable={true}
            ariaLabel="Grafico lineare che mostra le metriche di performance nel tempo"
            legendProps={{
              payload: [
                { value: 'Soddisfazione', color: chartColors.primary.gold },
                { value: 'Engagement', color: chartColors.secondary.green },
                { value: 'Completamento', color: chartColors.secondary.blue }
              ]
            }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                <CartesianGrid {...axisConfig.gridStyle} />
                <XAxis 
                  dataKey="name" 
                  {...axisConfig.style}
                  tick={{ fontSize: 10, fill: axisConfig.tickStyle.color }}
                  height={50}
                  interval="preserveStartEnd"
                  tickMargin={8}
                />
                <YAxis 
                  {...axisConfig.style}
                  tick={{ fontSize: 10, fill: axisConfig.tickStyle.color }}
                  width={50}
                  tickMargin={8}
                />
                <Tooltip content={<PerformanceTooltip />} />
                        <Line 
                          type="monotone" 
                          dataKey="satisfaction" 
                  stroke={chartColors.primary.gold}
                  strokeWidth={chartPresets.line.strokeWidth}
                  dot={chartPresets.line.dot}
                  activeDot={chartPresets.line.activeDot}
                          name="Soddisfazione"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="engagement" 
                  stroke={chartColors.secondary.green}
                  strokeWidth={chartPresets.line.strokeWidth}
                  dot={chartPresets.line.dot}
                  activeDot={chartPresets.line.activeDot}
                          name="Engagement"
                        />
                <Line 
                  type="monotone" 
                  dataKey="completion" 
                  stroke={chartColors.secondary.blue}
                  strokeWidth={chartPresets.line.strokeWidth}
                  dot={chartPresets.line.dot}
                  activeDot={chartPresets.line.activeDot}
                  name="Completamento"
                        />
                      </LineChart>
                    </ResponsiveContainer>
          </AccessibleChart>
            </div>
      </div>
    </motion.div>
  );
} 