import React from 'react';
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ScatterChart,
  Scatter
} from 'recharts';

// Import new chart system
import { chartColors, tooltipConfig, legendConfig, axisConfig, chartPresets, getChartColor } from "@/lib/chart-colors";
import { CustomTooltip, TemporalTooltip, PerformanceTooltip, DeviceTooltip, CompletionTooltip } from '@/components/charts/CustomTooltip';
import { CustomLegend, TemporalLegend, PieLegend, BarLegend } from '@/components/charts/CustomLegend';
import { AccessibleChart } from '@/components/charts/AccessibleChart';
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import { addDays, format, subDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { authenticatedFetch } from '@/lib/utils';

// Tipi per i dati analytics
interface AnalyticsData {
  overview: {
    totalResponses: number;
    totalForms: number;
    completionRate: number;
    avgResponseTime: number;
    activeUsers: number;
  };
  responsesByQuestion: Array<{
    questionId: string;
    questionText: string;
    questionType: string;
    responses: Array<{
      value: string;
      count: number;
      percentage: number;
    }>;
    statistics: {
      mean?: number;
      median?: number;
      mode?: string;
      min?: number;
      max?: number;
    };
  }>;
  temporalData: Array<{
    date: string;
    responses: number;
    completions: number;
    avgScore: number;
  }>;
  completionAnalysis: {
    completed: number;
    partial: number;
    abandoned: number;
    total: number;
  };
  openResponses: Array<{
    questionId: string;
    questionText: string;
    responses: Array<{
      id: string;
      value: string;
      createdAt: string;
      userId: string;
      userName: string;
    }>;
  }>;
  demographics: {
    deviceTypes: Array<{ device: string; count: number; percentage: number }>;
    timeOfDay: Array<{ hour: string; count: number }>;
    dayOfWeek: Array<{ day: string; count: number }>;
  };
}

interface FilterState {
  dateRange: { from: Date; to: Date };
  formId: string;
  questionType: string;
  completionStatus: string;
  searchTerm: string;
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { from: subDays(new Date(), 30), to: new Date() },
    formId: 'all',
    questionType: 'all',
    completionStatus: 'all',
    searchTerm: ''
  });
  const [availableForms, setAvailableForms] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const params = new URLSearchParams({
          from: filters.dateRange.from.toISOString(),
          to: filters.dateRange.to.toISOString(),
          formId: filters.formId,
          questionType: filters.questionType,
          completionStatus: filters.completionStatus,
          search: filters.searchTerm
        });

        const response = await authenticatedFetch(`/api/analytics?${params}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data);
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchForms = async () => {
      try {
        const response = await fetch('/api/forms');
        if (response.ok) {
          const data = await response.json();
          setAvailableForms(data.forms || []);
        }
      } catch (error) {
        console.error('Error fetching forms:', error);
      }
    };

    fetchForms();
    fetchAnalyticsData();
  }, [filters]);

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

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 lg:p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Analytics Avanzate
            </h1>
           
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button variant="outline" size="sm" className="flex-shrink-0">
              <RefreshCw className="h-4 w-4 mr-2" />
              Aggiorna
            </Button>
            
            <Button variant="outline" size="sm" className="flex-shrink-0">
              <Download className="h-4 w-4 mr-2" />
              Esporta
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Filtri */}
      <motion.div variants={itemVariants} className="mb-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-lg">Filtri Avanzati</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {/* Date Range */}
              <div className="lg:col-span-2">
                <Label className="text-sm font-medium">Periodo</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filters.dateRange.from.toISOString().split('T')[0]}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, from: new Date(e.target.value) }
                    }))}
                  />
                  <Input
                    type="date"
                    value={filters.dateRange.to.toISOString().split('T')[0]}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, to: new Date(e.target.value) }
                    }))}
                  />
                </div>
              </div>

              {/* Form Select */}
              <div>
                <Label className="text-sm font-medium">Form</Label>
                <Select value={filters.formId} onValueChange={(value) => setFilters(prev => ({ ...prev, formId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti i form" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i form</SelectItem>
                    {availableForms.map((form) => (
                      <SelectItem key={form.id} value={form.id}>
                        {form.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Question Type */}
              <div>
                <Label className="text-sm font-medium">Tipo Domanda</Label>
                <Select value={filters.questionType} onValueChange={(value) => setFilters(prev => ({ ...prev, questionType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti i tipi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i tipi</SelectItem>
                    <SelectItem value="TEXT">Testo</SelectItem>
                    <SelectItem value="MULTIPLE_CHOICE">Scelta multipla</SelectItem>
                    <SelectItem value="RATING">Rating</SelectItem>
                    <SelectItem value="LIKERT">Likert</SelectItem>
                    <SelectItem value="NPS">NPS</SelectItem>
                    <SelectItem value="RANKING">Ranking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Completion Status */}
              <div>
                <Label className="text-sm font-medium">Stato</Label>
                <Select value={filters.completionStatus} onValueChange={(value) => setFilters(prev => ({ ...prev, completionStatus: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="completed">Completate</SelectItem>
                    <SelectItem value="partial">Parziali</SelectItem>
                    <SelectItem value="abandoned">Abbandonate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div>
                <Label className="text-sm font-medium">Cerca</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cerca risposte..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div variants={itemVariants} className="mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 lg:grid-cols-6 w-full lg:w-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Panoramica</TabsTrigger>
            <TabsTrigger value="responses" className="text-xs sm:text-sm">Risposte</TabsTrigger>
            <TabsTrigger value="temporal" className="text-xs sm:text-sm">Temporale</TabsTrigger>
            <TabsTrigger value="completion" className="text-xs sm:text-sm">Completamento</TabsTrigger>
            <TabsTrigger value="open" className="text-xs sm:text-sm hidden lg:block">Testo Libero</TabsTrigger>
            <TabsTrigger value="demographics" className="text-xs sm:text-sm hidden lg:block">Demografia</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* KPI Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
              {analyticsData?.overview && (
                <>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Risposte Totali</p>
                          <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalResponses.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <MessageSquare className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Forms Attivi</p>
                          <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalForms}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                          <FileText className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Tasso Completamento</p>
                          <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.completionRate}%</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                          <Target className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Tempo Medio</p>
                          <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.avgResponseTime}m</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Clock className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Utenti Attivi</p>
                          <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.activeUsers}</p>
                        </div>
                        <div className="p-3 bg-indigo-100 rounded-lg">
                          <Users className="h-6 w-6 text-indigo-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </motion.div>

            {/* Overview Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Andamento Risposte</CardTitle>
                    <CardDescription>Trend delle risposte nel tempo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData?.temporalData || []}>
                          <defs>
                            <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={chartColors.primary.gold} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={chartColors.primary.lightGold} stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid {...axisConfig.gridStyle} />
                          <XAxis 
                            dataKey="date" 
                            {...axisConfig.style}
                            tick={{ fontSize: 12, fill: axisConfig.style.color }}
                          />
                          <YAxis 
                            {...axisConfig.style}
                            tick={{ fontSize: 12, fill: axisConfig.style.color }}
                          />
                          <Tooltip content={<TemporalTooltip />} />
                          <Area 
                            type="monotone" 
                            dataKey="responses" 
                            stroke={chartColors.primary.gold} 
                            fillOpacity={1} 
                            fill="url(#colorResponses)"
                            strokeWidth={chartPresets.area.strokeWidth}
                            dot={chartPresets.area.dot}
                            activeDot={chartPresets.area.activeDot}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Distribuzione Completamento</CardTitle>
                    <CardDescription>Stato delle risposte</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Completate', value: analyticsData?.completionAnalysis.completed || 0, color: chartColors.status.completed },
                              { name: 'Parziali', value: analyticsData?.completionAnalysis.partial || 0, color: chartColors.status.partial },
                              { name: 'Abbandonate', value: analyticsData?.completionAnalysis.abandoned || 0, color: chartColors.status.abandoned }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={chartPresets.pie.innerRadius}
                            outerRadius={chartPresets.pie.outerRadius}
                            paddingAngle={chartPresets.pie.paddingAngle}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {[
                              { name: 'Completate', value: analyticsData?.completionAnalysis.completed || 0, color: chartColors.status.completed },
                              { name: 'Parziali', value: analyticsData?.completionAnalysis.partial || 0, color: chartColors.status.partial },
                              { name: 'Abbandonate', value: analyticsData?.completionAnalysis.abandoned || 0, color: chartColors.status.abandoned }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CompletionTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="responses" className="space-y-6 mt-6">
            {/* Responses by Question */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Analisi per Domanda</CardTitle>
                  <CardDescription>Distribuzione delle risposte per ogni domanda</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {analyticsData?.responsesByQuestion.map((question, index) => (
                      <div key={question.questionId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium text-gray-900">{question.questionText}</h3>
                            <p className="text-sm text-gray-500">Tipo: {question.questionType}</p>
                          </div>
                          <Badge variant="secondary">{question.responses.length} risposte</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Chart */}
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={question.responses}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis dataKey="value" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Statistics */}
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-900">Statistiche</h4>
                            {question.statistics.mean && (
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Media:</span>
                                <span className="text-sm font-medium">{question.statistics.mean.toFixed(2)}</span>
                              </div>
                            )}
                            {question.statistics.median && (
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Mediana:</span>
                                <span className="text-sm font-medium">{question.statistics.median.toFixed(2)}</span>
                              </div>
                            )}
                            {question.statistics.mode && (
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Moda:</span>
                                <span className="text-sm font-medium">{question.statistics.mode}</span>
                              </div>
                            )}
                            {question.statistics.min && question.statistics.max && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Min:</span>
                                  <span className="text-sm font-medium">{question.statistics.min}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Max:</span>
                                  <span className="text-sm font-medium">{question.statistics.max}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="temporal" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Andamento Temporale</CardTitle>
                    <CardDescription>Risposte e completamenti nel tempo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData?.temporalData || []}>
                          <CartesianGrid {...axisConfig.gridStyle} />
                          <XAxis 
                            dataKey="date" 
                            {...axisConfig.style}
                            tick={{ fontSize: 12, fill: axisConfig.style.color }}
                          />
                          <YAxis 
                            {...axisConfig.style}
                            tick={{ fontSize: 12, fill: axisConfig.style.color }}
                          />
                          <Tooltip content={<TemporalTooltip />} />
                          <Legend {...legendConfig} />
                          <Line 
                            type="monotone" 
                            dataKey="responses" 
                            stroke={chartColors.primary.gold} 
                            strokeWidth={chartPresets.line.strokeWidth} 
                            dot={chartPresets.line.dot}
                            activeDot={chartPresets.line.activeDot}
                            name="Risposte"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="completions" 
                            stroke={chartColors.status.completed} 
                            strokeWidth={chartPresets.line.strokeWidth} 
                            dot={chartPresets.line.dot}
                            activeDot={chartPresets.line.activeDot}
                            name="Completamenti"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Punteggio Medio</CardTitle>
                    <CardDescription>Evoluzione del punteggio nel tempo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData?.temporalData || []}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 10, fill: '#94A3B8' }}
                            height={50}
                            interval="preserveStartEnd"
                            tickMargin={8}
                          />
                          <YAxis 
                            tick={{ fontSize: 10, fill: '#94A3B8' }}
                            width={50}
                            tickMargin={8}
                          />
                          <Tooltip />
                          <Area type="monotone" dataKey="avgScore" stroke="#f59e0b" fillOpacity={1} fill="url(#colorScore)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="completion" className="space-y-6 mt-6">
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Analisi Completamento</CardTitle>
                  <CardDescription>Dettagli sul tasso di completamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          {analyticsData?.completionAnalysis.total ? 
                            Math.round((analyticsData.completionAnalysis.completed / analyticsData.completionAnalysis.total) * 100) : 0}%
                        </div>
                        <p className="text-sm text-gray-600">Tasso di Completamento</p>
                      </div>
                      <Progress 
                        value={analyticsData?.completionAnalysis.total ? 
                          (analyticsData.completionAnalysis.completed / analyticsData.completionAnalysis.total) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium">Completate</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">
                          {analyticsData?.completionAnalysis.completed || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                          <span className="text-sm font-medium">Parziali</span>
                        </div>
                        <span className="text-sm font-bold text-yellow-600">
                          {analyticsData?.completionAnalysis.partial || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <span className="text-sm font-medium">Abbandonate</span>
                        </div>
                        <span className="text-sm font-bold text-red-600">
                          {analyticsData?.completionAnalysis.abandoned || 0}
                        </span>
                      </div>
                    </div>

                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Completate', value: analyticsData?.completionAnalysis.completed || 0, color: '#22c55e' },
                              { name: 'Parziali', value: analyticsData?.completionAnalysis.partial || 0, color: '#f59e0b' },
                              { name: 'Abbandonate', value: analyticsData?.completionAnalysis.abandoned || 0, color: '#ef4444' }
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            dataKey="value"
                            label={({ percentage }) => percentage > 5 ? `${percentage}%` : ''}
                            fontSize={10}
                          >
                            {[
                              { name: 'Completate', value: analyticsData?.completionAnalysis.completed || 0, color: '#22c55e' },
                              { name: 'Parziali', value: analyticsData?.completionAnalysis.partial || 0, color: '#f59e0b' },
                              { name: 'Abbandonate', value: analyticsData?.completionAnalysis.abandoned || 0, color: '#ef4444' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="open" className="space-y-6 mt-6">
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Risposte a Testo Libero</CardTitle>
                  <CardDescription>Analisi delle risposte aperte</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {analyticsData?.openResponses.map((question) => (
                      <div key={question.questionId} className="border rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-4">{question.questionText}</h3>
                        <div className="space-y-3">
                          {question.responses.map((response) => (
                            <div key={response.id} className="bg-gray-50 rounded-lg p-3">
                              <p className="text-sm text-gray-900 mb-2">{response.value}</p>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{response.userName || 'Anonimo'}</span>
                                <span>{format(new Date(response.createdAt), 'dd/MM/yyyy HH:mm', { locale: it })}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="demographics" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Dispositivi</CardTitle>
                    <CardDescription>Distribuzione per tipo di device</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData?.demographics.deviceTypes.map((device) => (
                        <div key={device.device} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{device.device}</span>
                            <span className="text-gray-500">{device.count} ({device.percentage}%)</span>
                          </div>
                          <Progress value={device.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Orari di Attività</CardTitle>
                    <CardDescription>Quando vengono compilati i form</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData?.demographics.timeOfDay || []}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis 
                            dataKey="hour" 
                            tick={{ fontSize: 10, fill: '#94A3B8' }}
                            height={50}
                            tickMargin={8}
                          />
                          <YAxis 
                            tick={{ fontSize: 10, fill: '#94A3B8' }}
                            width={50}
                            tickMargin={8}
                          />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Giorni della Settimana</CardTitle>
                    <CardDescription>Attività per giorno</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData?.demographics.dayOfWeek || []}>
                          <CartesianGrid {...axisConfig.gridStyle} />
                          <XAxis 
                            dataKey="day" 
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
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="count" 
                            fill={chartColors.secondary.blue} 
                            radius={chartPresets.bar.radius}
                            maxBarSize={chartPresets.bar.maxBarSize}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
} 