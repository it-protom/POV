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
  Tablet,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { authenticatedFetch } from '../../../lib/utils';
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
    percentage?: number;
  }>;
  userCompletionDetails?: Array<{
    name: string;
    email: string;
    status: string;
    answersCount: number;
    totalQuestions: number;
  }>;
}

export default function DashboardPage() {
  const [selectedFormId, setSelectedFormId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [availableForms, setAvailableForms] = useState<Array<{ id: string; title: string }>>([]);
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});
  
  // Filtri e paginazione per la tabella utenti
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'partial' | 'notStarted'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await authenticatedFetch('/api/forms/summary', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Forms data received:', data);
          // L'API restituisce {forms: [...]}
          setAvailableForms(data.forms || []);
        }
      } catch (error) {
        console.error('Error fetching forms:', error);
      }
    };

    fetchForms();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedFormId && selectedFormId !== 'all') {
          params.append('formId', selectedFormId);
        }
        
        const response = await authenticatedFetch(`/api/dashboard/stats?${params.toString()}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
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
  }, [selectedFormId]);

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
  const allUserCompletionDetails = dashboardData?.userCompletionDetails || [];
  
  // Filtraggio e paginazione
  const filteredUsers = allUserCompletionDetails.filter(user => {
    // Filtro ricerca
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro stato
    const completionRate = user.totalQuestions > 0 ? user.answersCount / user.totalQuestions : 0;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'completed' && completionRate === 1) ||
      (filterStatus === 'partial' && completionRate > 0 && completionRate < 1) ||
      (filterStatus === 'notStarted' && completionRate === 0);
    
    return matchesSearch && matchesStatus;
  });
  
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
              {selectedFormId !== 'all' && (
                <p className="text-sm text-gray-600 mt-2">
                  <Badge variant="outline" className="bg-[#FFCD00]/10 border-[#FFCD00] text-gray-900">
                    <FileText className="h-3 w-3 mr-1" />
                    {availableForms.find(f => f.id === selectedFormId)?.title || 'Form Selezionato'}
                  </Badge>
                </p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Seleziona Form" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Tutti i Form ({availableForms.length})
                  </SelectItem>
                  {availableForms.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-shrink-0"
                onClick={() => {
                  setIsLoading(true);
                  window.location.reload();
                }}
              >
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
            {stats.map((stat, index) => {
              // Determina l'URL in base al titolo
              let href: string | undefined;
              if (stat.title === "Forms Totali") {
                href = "/admin/forms";
              } else if (stat.title === "Risposte Totali") {
                href = "/admin/responses";
              } else if (stat.title === "Utenti Attivi") {
                href = "/admin/users";
              }

              return (
                <MetricCard
                  key={stat.title}
                  {...stat}
                  index={index}
                  href={href}
                />
              );
            })}
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
            <div className="space-y-4">
              <AccessibleChart
                title="Distribuzione Completamento"
                description={selectedFormId !== 'all' ? "Stato completamento utenti" : "Stato delle risposte"}
                data={completionData}
                showLegend={true}
                showTable={allUserCompletionDetails.length === 0}
                ariaLabel="Grafico a torta che mostra la distribuzione dello stato di completamento"
                legendProps={{
                  payload: completionData.map(item => ({
                    value: item.name,
                    color: item.name.includes('Completato') ? chartColors.status.completed :
                           item.name.includes('Parziali') ? chartColors.status.partial :
                           item.name.includes('Non Hanno') ? chartColors.status.abandoned :
                           item.name === 'Completate' ? chartColors.status.completed :
                           item.name === 'Abbandonate' ? chartColors.status.abandoned :
                           chartColors.status.partial
                  }))
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
                      label={({ name, percentage, value }) => {
                        const pct = percentage || Math.round((value / completionData.reduce((sum, d) => sum + d.value, 0)) * 100);
                        return pct > 5 ? `${name.split(' ')[0]} ${pct}%` : '';
                      }}
                      labelLine={false}
                      fontSize={10}
                    >
                      {completionData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.name.includes('Completato') ? chartColors.status.completed :
                            entry.name.includes('Parziali') ? chartColors.status.partial :
                            entry.name.includes('Non Hanno') ? chartColors.status.abandoned :
                            entry.name === 'Completate' ? chartColors.status.completed :
                            entry.name === 'Abbandonate' ? chartColors.status.abandoned :
                            chartColors.status.partial
                          } 
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PerformanceTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </AccessibleChart>
              
              {/* Tabella dettagli */}
              {allUserCompletionDetails.length > 0 ? (
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {selectedFormId === 'all' 
                            ? `Tutti gli Utenti (${filteredUsers.length}${filteredUsers.length !== allUserCompletionDetails.length ? ` di ${allUserCompletionDetails.length}` : ''})`
                            : `Dettaglio Utenti - ${availableForms.find(f => f.id === selectedFormId)?.title || 'Form'} (${allUserCompletionDetails.length})`
                          }
                        </CardTitle>
                        {selectedFormId === 'all' && (
                          <p className="text-xs text-gray-500 mt-1">
                            Clicca su una riga per vedere i dettagli | 🔒 = Form anonimo
                          </p>
                        )}
                      </div>
                      
                      {selectedFormId === 'all' && (
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Cerca utente o email..."
                              value={searchTerm}
                              onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                              }}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <Select value={filterStatus} onValueChange={(value: any) => {
                            setFilterStatus(value);
                            setCurrentPage(1);
                          }}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                              <SelectValue placeholder="Filtra per stato" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tutti gli stati</SelectItem>
                              <SelectItem value="completed">✅ Completati</SelectItem>
                              <SelectItem value="partial">⚠️ Parziali</SelectItem>
                              <SelectItem value="notStarted">❌ Non iniziati</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      {selectedFormId === 'all' ? (
                        // Tabella compatta e scalabile per tutti gli utenti
                        <>
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-4 font-semibold text-xs text-gray-700 uppercase tracking-wider">Utente</th>
                                <th className="text-left py-3 px-4 font-semibold text-xs text-gray-700 uppercase tracking-wider">Completamento</th>
                                <th className="text-left py-3 px-4 font-semibold text-xs text-gray-700 uppercase tracking-wider">Progresso</th>
                                <th className="text-center py-3 px-4 font-semibold text-xs text-gray-700 uppercase tracking-wider">Azioni</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedUsers.length > 0 ? paginatedUsers.map((user, index) => {
                                const globalIndex = (currentPage - 1) * itemsPerPage + index;
                                const isExpanded = expandedUser === globalIndex;
                                
                                // Calcola statistiche aggregate senza parsare tutti i form
                                let completedCount = 0;
                                let partialCount = 0;
                                let notStartedCount = 0;
                                
                                if (user.status && user.status !== 'Nessun form disponibile') {
                                  const statusParts = user.status.split(', ');
                                  statusParts.forEach(part => {
                                    const statusPart = part.split(':')[1]?.trim() || part;
                                    if (statusPart.includes('✅') || statusPart.includes('Completato')) {
                                      completedCount++;
                                    } else if (statusPart.includes('⚠️') || statusPart.includes('Parziale')) {
                                      partialCount++;
                                    } else if (statusPart.includes('❌') || statusPart.includes('Non iniziato')) {
                                      notStartedCount++;
                                    }
                                  });
                                }
                                
                                // Se non abbiamo trovato stati, usa i totali dal backend
                                if (completedCount === 0 && partialCount === 0 && notStartedCount === 0 && user.totalQuestions > 0) {
                                  // Fallback: calcola basandosi sui dati disponibili
                                  completedCount = user.answersCount || 0;
                                  notStartedCount = Math.max(0, user.totalQuestions - completedCount);
                                }
                                
                                // Il totale dei form viene dal backend (user.totalQuestions rappresenta il numero di form)
                                const totalForms = user.totalQuestions || (completedCount + partialCount + notStartedCount);
                                const completionRate = totalForms > 0 
                                  ? Math.round((completedCount / totalForms) * 100)
                                  : 0;
                                
                                // Parse form statuses solo quando espanso (lazy loading)
                                interface FormStatus {
                                  formName: string;
                                  status: 'completed' | 'partial' | 'notStarted';
                                  progress?: string;
                                  isAnonymous: boolean;
                                }
                                
                                const formStatuses: FormStatus[] = [];
                                if (isExpanded && user.status && user.status !== 'Nessun form disponibile') {
                                  user.status.split(', ').forEach(formStatus => {
                                    const isAnonymous = formStatus.includes('(Anonimo)');
                                    const formName = formStatus.split(':')[0].replace('(Anonimo)', '').trim();
                                    const statusPart = formStatus.split(':')[1]?.trim() || '';
                                    
                                    if (statusPart.includes('Completato') || statusPart.includes('✅')) {
                                      formStatuses.push({
                                        formName,
                                        status: 'completed',
                                        isAnonymous
                                      });
                                    } else if (statusPart.includes('Parziale') || statusPart.includes('⚠️')) {
                                      const progressMatch = statusPart.match(/(\d+)\/(\d+)/);
                                      formStatuses.push({
                                        formName,
                                        status: 'partial',
                                        progress: progressMatch ? progressMatch[0] : undefined,
                                        isAnonymous
                                      });
                                    } else if (statusPart.includes('Non iniziato') || statusPart.includes('❌')) {
                                      formStatuses.push({
                                        formName,
                                        status: 'notStarted',
                                        isAnonymous
                                      });
                                    }
                                  });
                                }
                                
                                // Raggruppa i form per stato (solo se espanso)
                                const formsByStatus = isExpanded ? {
                                  completed: [] as Array<{name: string; isAnonymous: boolean}>,
                                  partial: [] as Array<{name: string; progress?: string; isAnonymous: boolean}>,
                                  notStarted: [] as Array<{name: string; isAnonymous: boolean}>
                                } : null;
                                
                                if (isExpanded && formsByStatus) {
                                  formStatuses.forEach(formStatus => {
                                    if (formStatus.status === 'completed') {
                                      formsByStatus.completed.push({
                                        name: formStatus.formName,
                                        isAnonymous: formStatus.isAnonymous
                                      });
                                    } else if (formStatus.status === 'partial') {
                                      formsByStatus.partial.push({
                                        name: formStatus.formName,
                                        progress: formStatus.progress,
                                        isAnonymous: formStatus.isAnonymous
                                      });
                                    } else if (formStatus.status === 'notStarted') {
                                      formsByStatus.notStarted.push({
                                        name: formStatus.formName,
                                        isAnonymous: formStatus.isAnonymous
                                      });
                                    }
                                  });
                                }
                                
                                return (
                                  <React.Fragment key={globalIndex}>
                                    <tr 
                                      className={`border-b border-gray-200 hover:bg-gray-50 ${
                                        isExpanded ? 'bg-gray-100' : ''
                                      }`}
                                    >
                                      <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-xs font-medium flex-shrink-0">
                                            {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                          </div>
                                          <div className="min-w-0">
                                            <div className="font-medium text-sm text-gray-900 truncate">{user.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4">
                                        <div className="flex flex-col gap-1">
                                          {totalForms > 0 ? (
                                            <>
                                              <div className="text-sm text-gray-900">
                                                {completedCount} completati / {partialCount} parziali / {notStartedCount} non iniziati
                                              </div>
                                              <div className="text-xs text-gray-500">
                                                Totale: {totalForms} form
                                              </div>
                                            </>
                                          ) : (
                                            <span className="text-sm text-gray-400">Nessun form disponibile</span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-3 px-4">
                                        <div className="flex flex-col gap-1">
                                          {totalForms > 0 ? (
                                            <>
                                              <div className="w-full max-w-[200px] h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                  className="h-full bg-gray-600 transition-all"
                                                  style={{ width: `${completionRate}%` }}
                                                />
                                              </div>
                                              <span className="text-xs text-gray-600">{completionRate}% completati</span>
                                            </>
                                          ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-xs"
                                          onClick={() => setExpandedUser(isExpanded ? null : globalIndex)}
                                        >
                                          {isExpanded ? 'Nascondi' : 'Dettagli'}
                                        </Button>
                                      </td>
                                    </tr>
                                    {isExpanded && formsByStatus && (
                                      <tr>
                                        <td colSpan={4} className="p-4 bg-gray-50 border-b border-gray-200">
                                          <div className="space-y-4">
                                            {/* Completati */}
                                            {formsByStatus.completed.length > 0 && (
                                              <div>
                                                <div className="text-sm font-semibold text-gray-700 mb-2">
                                                  Completati ({formsByStatus.completed.length})
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                  {formsByStatus.completed.map((form, idx) => (
                                                    <Badge key={idx} variant="outline" className="text-xs">
                                                      {form.name}
                                                      {form.isAnonymous && ' (Anonimo)'}
                                                    </Badge>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                            
                                            {/* Parziali */}
                                            {formsByStatus.partial.length > 0 && (
                                              <div>
                                                <div className="text-sm font-semibold text-gray-700 mb-2">
                                                  In corso ({formsByStatus.partial.length})
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                  {formsByStatus.partial.map((form, idx) => (
                                                    <Badge key={idx} variant="outline" className="text-xs">
                                                      {form.name}
                                                      {form.progress && ` (${form.progress})`}
                                                      {form.isAnonymous && ' (Anonimo)'}
                                                    </Badge>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                            
                                            {/* Non iniziati */}
                                            {formsByStatus.notStarted.length > 0 && (
                                              <div>
                                                <div className="text-sm font-semibold text-gray-700 mb-2">
                                                  Da completare ({formsByStatus.notStarted.length})
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                  {formsByStatus.notStarted.map((form, idx) => (
                                                    <Badge key={idx} variant="outline" className="text-xs">
                                                      {form.name}
                                                      {form.isAnonymous && ' (Anonimo)'}
                                                    </Badge>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                            
                                            {formStatuses.length === 0 && (
                                              <div className="text-sm text-gray-500">Nessun form disponibile</div>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              }) : (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-gray-500">
                                    <p className="font-medium">Nessun utente trovato</p>
                                    <p className="text-sm mt-1">Prova a modificare i filtri di ricerca</p>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                          
                          {/* Paginazione */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
                              <div className="text-sm text-gray-500">
                                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} di {filteredUsers.length} utenti
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                  disabled={currentPage === 1}
                                >
                                  Precedente
                                </Button>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                      pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                      pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                      pageNum = totalPages - 4 + i;
                                    } else {
                                      pageNum = currentPage - 2 + i;
                                    }
                                    
                                    return (
                                      <Button
                                        key={i}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className="w-8 h-8 p-0"
                                      >
                                        {pageNum}
                                      </Button>
                                    );
                                  })}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                  disabled={currentPage === totalPages}
                                >
                                  Successivo
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        // Tabella per singolo form - dettaglio utenti
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Utente</th>
                              <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Email</th>
                              <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Stato</th>
                              <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Progresso</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allUserCompletionDetails.map((user, index) => (
                              <tr 
                                key={index} 
                                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                }`}
                              >
                                <td className="py-3 px-4 text-sm">{user.name}</td>
                                <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                                <td className="py-3 px-4 text-center">
                                  <Badge 
                                    variant="outline"
                                    className={
                                      user.status === 'Completato' 
                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                        : user.status === 'Non ha risposto'
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    }
                                  >
                                    {user.status}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-center text-sm">
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="text-gray-600">
                                      {user.answersCount}/{user.totalQuestions}
                                    </span>
                                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full transition-all ${
                                          user.answersCount >= user.totalQuestions 
                                            ? 'bg-green-500' 
                                            : user.answersCount > 0 
                                            ? 'bg-yellow-500'
                                            : 'bg-red-500'
                                        }`}
                                        style={{ 
                                          width: `${Math.round((user.answersCount / Math.max(user.totalQuestions, 1)) * 100)}%` 
                                        }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
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