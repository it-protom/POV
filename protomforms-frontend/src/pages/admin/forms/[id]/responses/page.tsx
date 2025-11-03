import React from 'react';
"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, Filter, Search, BarChart2, PieChart, Table, User, Calendar, Clock, CheckCircle, XCircle, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authenticatedFetch } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Question {
  id: string;
  text: string;
  type: string;
  required: boolean;
  options?: string[];
  order: number;
}

interface Form {
  id: string;
  title: string;
  description?: string;
  type: "SURVEY" | "QUIZ";
  isAnonymous: boolean;
  allowEdit: boolean;
  showResults: boolean;
  thankYouMessage?: string;
  questions: Question[];
  theme?: {
    primaryColor: string;
    backgroundColor: string;
    fontFamily: string;
  };
}

interface Response {
  id: string;
  formId: string;
  submittedAt: string;
  createdAt: string;
  progressiveNumber: number;
  answers: {
    id: string;
    questionId: string;
    value: any;
  }[];
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
}

interface QuestionStats {
  type: string;
  options: string[];
  stats: Record<string | number, number>;
  total: number;
}

export default function FormResponsesPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "incomplete">("all");
  const [activeTab, setActiveTab] = useState<"table" | "charts">("table");
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);

  // Carica i dati del form e le risposte in parallelo
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Carica i dati del form e le risposte in parallelo
        const [formResponse, responsesResponse] = await Promise.all([
          authenticatedFetch(`/api/forms/${params.id}`),
          authenticatedFetch(`/api/forms/${params.id}/responses`)
        ]);

        if (!formResponse.ok) {
          throw new Error("Failed to fetch form");
        }
        if (!responsesResponse.ok) {
          throw new Error("Failed to fetch responses");
        }

        const [formData, responsesData] = await Promise.all([
          formResponse.json(),
          responsesResponse.json()
        ]);

        setForm(formData);
        setResponses(responsesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  // Filtra le risposte in base alla ricerca e al filtro
  const filteredResponses = responses.filter(response => {
    // Filtra per termine di ricerca
    const matchesSearch = searchTerm === "" || 
      response.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (response.answers && response.answers.some(answer => 
        String(answer.value).toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    // Filtra per stato
    const isComplete = response.answers && response.answers.length === form?.questions.length;
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "completed" && isComplete) || 
      (filterStatus === "incomplete" && !isComplete);
    
    return matchesSearch && matchesStatus;
  });

  // Calcola le statistiche per le domande
  const calculateQuestionStats = (questionId: string): QuestionStats | null => {
    if (!form) return null;
    
    const question = form.questions.find(q => q.id === questionId);
    if (!question) return null;
    
    // Per domande con opzioni (multiple choice, checkbox)
    if (question.options) {
      const stats: Record<string, number> = {};
      
      // Verifica che question.options sia un array
      let optionsArray: string[] = [];
      try {
        if (Array.isArray(question.options)) {
          optionsArray = question.options;
        } else if (typeof question.options === 'string') {
          const parsed = JSON.parse(question.options);
          optionsArray = Array.isArray(parsed) ? parsed : [];
        }
      } catch (error) {
        console.error('Errore nel parsing delle opzioni:', error);
        optionsArray = [];
      }

      // Verifica che optionsArray sia effettivamente un array prima di usare forEach
      if (Array.isArray(optionsArray)) {
        optionsArray.forEach((option: string) => {
          if (typeof option === 'string') {
            stats[option] = 0;
          }
        });
      }
      
      responses.forEach(response => {
        const answer = response.answers.find(a => a.questionId === questionId);
        if (answer) {
          if (Array.isArray(answer.value)) {
            // Per checkbox (risposte multiple)
            answer.value.forEach((value: string) => {
              if (typeof value === 'string' && stats[value] !== undefined) {
                stats[value]++;
              }
            });
          } else if (typeof answer.value === 'string') {
            // Per multiple choice (risposta singola)
            if (stats[answer.value] !== undefined) {
              stats[answer.value]++;
            }
          }
        }
      });
      
      return {
        type: question.type,
        options: optionsArray,
        stats,
        total: responses.length,
      };
    }
    
    // Per domande di tipo rating
    if (question.type === "RATING") {
      const stats: Record<number, number> = {};
      for (let i = 1; i <= 5; i++) {
        stats[i] = 0;
      }
      
      responses.forEach(response => {
        const answer = response.answers.find(a => a.questionId === questionId);
        if (answer && typeof answer.value === 'number') {
          if (stats[answer.value] !== undefined) {
            stats[answer.value]++;
          }
        }
      });
      
      return {
        type: question.type,
        options: [],
        stats,
        total: responses.length,
      };
    }
    
    return null;
  };

  // Formatta la data
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Data non valida';
      }
      return new Intl.DateTimeFormat('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      console.error('Errore nella formattazione della data:', error);
      return 'Data non valida';
    }
  };

  // Formatta il valore della risposta
  const formatAnswerValue = (questionId: string, value: any) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  };

  // Esporta le risposte in CSV
  const exportToCSV = () => {
    if (!form || responses.length === 0) return;
    
    // Intestazioni
    const headers = ['Numero Progressivo', 'Data', 'Nome', 'Email'];
    form.questions.forEach(question => {
      headers.push(question.text);
    });
    
    // Dati
    const rows = responses.map(response => {
      const row = [
        response.progressiveNumber || response.id,
        formatDate(response.createdAt),
        form.isAnonymous 
          ? `Risposta #${response.progressiveNumber || response.id}`
          : (response.user?.name || `Risposta #${response.progressiveNumber || response.id}`),
        form.isAnonymous ? 'Anonimo' : (response.user?.email || 'N/A'),
      ];
      
      form.questions.forEach(question => {
        const answer = response.answers.find(a => a.questionId === question.id);
        row.push(answer ? formatAnswerValue(question.id, answer.value) : '');
      });
      
      return row;
    });
    
    // Crea il CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Scarica il file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${form.title.replace(/\s+/g, '_')}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="form-page container mx-auto py-8 animate-fade-in">
        <div className="form-card p-8 text-center">
          <p className="text-blue-700 text-lg">Loading responses...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="form-page container mx-auto py-8 animate-fade-in">
        <div className="form-card p-8 text-center">
          <p className="text-red-600 text-lg">Form not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Indietro
          </Button>
          <h1 className="text-2xl font-bold">Risposte al Form</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Esporta CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{form?.title}</CardTitle>
          <CardDescription>{form?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Cerca per nome, email o risposta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterStatus} onValueChange={(value: "all" | "completed" | "incomplete") => setFilterStatus(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtra per stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le risposte</SelectItem>
                <SelectItem value="completed">Complete</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "table" | "charts")}>
            <TabsList>
              <TabsTrigger value="table">
                <Table className="mr-2 h-4 w-4" />
                Tabella
              </TabsTrigger>
              <TabsTrigger value="charts">
                <BarChart2 className="mr-2 h-4 w-4" />
                Grafici
              </TabsTrigger>
            </TabsList>

            <TabsContent value="table">
              <div className="rounded-md border">
                <TableComponent>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rispondente</TableHead>
                      {!form?.isAnonymous && <TableHead>Email</TableHead>}
                      <TableHead>Data Invio</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Risposte</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResponses.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-500" />
                            </div>
                            <div className="font-medium">
                              {form?.isAnonymous 
                                ? `Risposta #${response.progressiveNumber}` 
                                : (response.user?.name || `Risposta #${response.progressiveNumber}`)}
                            </div>
                          </div>
                        </TableCell>
                        {!form?.isAnonymous && (
                          <TableCell>{response.user?.email || "N/A"}</TableCell>
                        )}
                        <TableCell>{formatDate(response.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant={response.answers.length === form?.questions.length ? "default" : "secondary"}>
                            {response.answers.length === form?.questions.length ? "Completo" : "Incompleto"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {response.answers.length} di {form?.questions.length} domande
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            onClick={() => setSelectedResponse(response)}
                          >
                            Visualizza Dettagli
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </TableComponent>
              </div>
            </TabsContent>

            <TabsContent value="charts">
              <div className="space-y-6">
                {form.questions.map((question) => {
                  const stats = calculateQuestionStats(question.id);
                  if (!stats) return null;
                  
                  // Trova tutte le risposte individuali per questa domanda
                  const questionResponses = responses
                    .map(response => {
                      const answer = response.answers.find(a => a.questionId === question.id);
                      return answer ? { response, answer } : null;
                    })
                    .filter(Boolean) as Array<{ response: Response; answer: any }>;
                  
                  return (
                    <Card key={question.id} className="overflow-hidden">
                      <CardHeader className="bg-gray-50 py-3">
                        <CardTitle className="text-lg">{question.text}</CardTitle>
                        <CardDescription>
                          {stats.total} risposte totali
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 space-y-6">
                        {/* Statistiche aggregate */}
                        <div>
                          <h4 className="font-medium mb-3 text-sm text-gray-700">Statistiche Aggregate</h4>
                          {stats.type === "MULTIPLE_CHOICE" && (
                            <div className="space-y-4">
                              {stats.options.map((option: string) => {
                                const count = stats.stats[option] || 0;
                                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                return (
                                  <div key={option} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span>{option}</span>
                                      <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {stats.type === "CHECKBOX" && (
                            <div className="space-y-4">
                              {stats.options.map((option: string) => {
                                const count = stats.stats[option] || 0;
                                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                return (
                                  <div key={option} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span>{option}</span>
                                      <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {stats.type === "RATING" && (
                            <div className="space-y-4">
                              {[1, 2, 3, 4, 5].map((rating: number) => {
                                const count = stats.stats[rating] || 0;
                                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                return (
                                  <div key={rating} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span>{rating} stella{rating !== 1 ? 'e' : ''}</span>
                                      <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {!["MULTIPLE_CHOICE", "CHECKBOX", "RATING"].includes(stats.type) && (
                            <div className="text-sm text-gray-500">
                              {stats.total} risposte per questa domanda
                            </div>
                          )}
                        </div>

                        {/* Tutte le risposte individuali */}
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-3 text-sm text-gray-700">
                            Tutte le Risposte Individuali ({questionResponses.length})
                          </h4>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {questionResponses.length === 0 ? (
                              <p className="text-sm text-gray-500">Nessuna risposta per questa domanda</p>
                            ) : (
                              questionResponses.map(({ response, answer }, index) => (
                                <div 
                                  key={`${response.id}-${answer.id}`}
                                  className="p-3 bg-gray-50 rounded border border-gray-200"
                                >
                                  <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-gray-600">
                                        {form?.isAnonymous 
                                          ? `Risposta #${response.progressiveNumber}`
                                          : (response.user?.name || `Risposta #${response.progressiveNumber}`)}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        • {new Date(response.createdAt).toLocaleDateString('it-IT')}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-700 mt-1">
                                    <strong>Risposta:</strong> {formatAnswerValue(question.id, answer.value)}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog per visualizzare le risposte dettagliate */}
      {form && selectedResponse && (
        <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Dettagli Risposta</DialogTitle>
              <DialogDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">
                      {form?.isAnonymous 
                        ? `Risposta #${selectedResponse.progressiveNumber}` 
                        : (selectedResponse.user?.name || `Risposta #${selectedResponse.progressiveNumber}`)}
                    </span>
                  </div>
                  {!form?.isAnonymous && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{selectedResponse.user?.email || "N/A"}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Inviato il {formatDate(selectedResponse.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Stato: {selectedResponse.answers.length === form.questions.length ? "Completo" : "Incompleto"}</span>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <h3 className="font-medium">Risposte:</h3>
              {selectedResponse.answers.map((answer) => {
                const question = form.questions.find(q => q.id === answer.questionId);
                return (
                  <Card key={answer.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{question?.text}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-500">
                        {formatAnswerValue(question?.type || "", answer.value)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 