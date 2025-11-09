import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFlowiseUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface FormAnalysisReportCardProps {
  formId: string;
  formTitle: string;
  className?: string;
  agentflowId?: string;
  onReportGenerated?: (report: any) => void;
}

interface AnalysisReport {
  report: string;
  sentiment: string | null;
  themes: string[];
  strengths: string[];
  improvements: string[];
  suggestions: string[];
}

export function FormAnalysisReportCard({
  formId,
  formTitle,
  className = '',
  agentflowId = '9a96c980-b7a2-48af-ae0b-5b17b8daa9bb',
  onReportGenerated
}: FormAnalysisReportCardProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const flowiseApiHost = getFlowiseUrl();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (formId && isAuthenticated) {
      generateReport();
    }
  }, [formId, isAuthenticated]);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      // Carica form e risposte
      const [formResponse, responsesResponse] = await Promise.all([
        api.get(`/forms/${formId}`),
        api.get(`/forms/${formId}/responses`)
      ]);

      const formData = formResponse.data;
      const responsesData = responsesResponse.data;

      // Prepara le variabili per Flowise
      const textAnswers = responsesData.flatMap((response: any) => 
        (response.answers || [])
          .filter((answer: any) => answer.question?.type === 'TEXT')
          .map((answer: any) => ({
            responseId: response.id,
            progressiveNumber: response.progressiveNumber,
            question: answer.question?.text || '',
            answer: typeof answer.value === 'string' 
              ? answer.value 
              : JSON.stringify(answer.value),
            createdAt: response.createdAt
          }))
      );

      const responsesContext = textAnswers.length > 0
        ? textAnswers.map((item: any, index: number) => 
            `Risposta ${index + 1} (ID: ${item.responseId}, Progressivo: ${item.progressiveNumber}):
Domanda: ${item.question}
Risposta: ${item.answer}
Data: ${item.createdAt}
---`
          ).join('\n\n')
        : 'Nessuna risposta testuale disponibile per questo form.';

      const vars = {
        formId: formData.id,
        formTitle: formData.title || 'Form senza titolo',
        formDescription: formData.description || '',
        totalResponses: responsesData.length,
        textResponsesCount: textAnswers.length,
        responsesContext: responsesContext,
        responsesData: JSON.stringify(textAnswers),
        userId: null,
      };

      // Costruisci l'URL
      let apiUrl: string;
      if (flowiseApiHost.includes('/api/v1')) {
        apiUrl = `${flowiseApiHost}/prediction/${agentflowId}`;
      } else if (flowiseApiHost.endsWith('/')) {
        apiUrl = `${flowiseApiHost}api/v1/prediction/${agentflowId}`;
      } else {
        apiUrl = `${flowiseApiHost}/api/v1/prediction/${agentflowId}`;
      }

      // Chiama Flowise
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          question: 'Analizza tutte le risposte e genera un report completo con sentiment, temi, punti di forza, aree di miglioramento e suggerimenti concreti.',
          history: [],
          overrideConfig: {
            returnSourceDocuments: false,
            sessionId: `form-${formId}-${Date.now()}`,
            vars: vars
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      console.log('📥 Risposta Flowise RAW (lunghezza totale):', JSON.stringify(data).length);
      console.log('📥 Risposta Flowise completa:', data);
      
      // Estrai il report (può essere in data.report o data.text)
      let reportData: any = {};
      
      // Cerca il report nel campo "report" (structured output)
      if (data.report) {
        console.log('🔍 Trovato campo data.report, tipo:', typeof data.report);
        if (typeof data.report === 'string') {
          console.log('🔍 data.report è una stringa, lunghezza:', data.report.length);
          console.log('🔍 data.report (inizio):', data.report.substring(0, 300));
          console.log('🔍 data.report (fine):', data.report.substring(Math.max(0, data.report.length - 200)));
          // Se report è una stringa, prova a parsarla come JSON
          try {
            const parsed = JSON.parse(data.report);
            console.log('✅ Parsed JSON da data.report:', parsed);
            reportData = parsed;
          } catch {
            // Se non è JSON valido, è solo il testo del report
            console.log('⚠️ data.report è testo semplice, non JSON');
            reportData = { report: data.report };
          }
        } else if (typeof data.report === 'object') {
          // Se report è un oggetto, usalo direttamente
          console.log('✅ data.report è un oggetto:', data.report);
          reportData = data.report;
        }
      } 
      // Se non c'è report, controlla data.text
      else if (data.text) {
        console.log('🔍 Trovato campo data.text, tipo:', typeof data.text);
        console.log('🔍 data.text lunghezza:', data.text.length);
        console.log('🔍 data.text (inizio):', data.text.substring(0, 300));
        console.log('🔍 data.text (fine):', data.text.substring(Math.max(0, data.text.length - 200)));
        console.log('📝 Trovato data.text, provo a parsare come JSON...');
        // Prova a parsare come JSON
        try {
          const parsed = JSON.parse(data.text);
          console.log('✅ Parsed JSON da data.text:', parsed);
          reportData = parsed;
        } catch {
          // Se non è JSON, è solo testo
          console.log('⚠️ data.text è testo semplice, non JSON');
          reportData = { report: data.text };
        }
      } 
      // Se ci sono direttamente i campi nel data, usali
      else if (data.sentiment || data.themes || data.strengths) {
        console.log('✅ Campi trovati direttamente in data:', data);
        reportData = data;
      }
      
      console.log('📊 ReportData prima della normalizzazione:', reportData);
      console.log('📊 reportData.report lunghezza:', reportData.report?.length || 0);
      if (reportData.report) {
        console.log('📊 reportData.report (inizio):', String(reportData.report).substring(0, 200));
        console.log('📊 reportData.report (fine):', String(reportData.report).substring(Math.max(0, String(reportData.report).length - 200)));
      }
      
      // 🚨 CASO SPECIALE: Se reportData ha solo il campo "report" come stringa che contiene TUTTO
      // (sentiment, themes, etc. sono scritti come testo dentro report, non come campi separati)
      if (reportData.report && typeof reportData.report === 'string' && 
          !reportData.sentiment && !reportData.themes) {
        
        const fullText = reportData.report;
        console.log('🔍 Controllo se report contiene campi JSON come testo...');
        
        // Pattern 1: Cerca "\n\n\"sentiment\":" o "\n\"sentiment\":" 
        // (i campi sono scritti come stringa dentro report)
        const sentimentPattern = /[\n\s]+"sentiment":\s*"([^"]+)"/;
        const themesPattern = /[\n\s]+"themes":\s*\[(.*?)\]/s;
        const strengthsPattern = /[\n\s]+"strengths":\s*\[(.*?)\]/s;
        const improvementsPattern = /[\n\s]+"improvements":\s*\[(.*?)\]/s;
        const suggestionsPattern = /[\n\s]+"suggestions":\s*\[(.*?)\]/s;
        
        if (fullText.includes('"sentiment":') || fullText.includes('\\n\\n\\"sentiment\\"')) {
          console.log('🔄 Rilevato JSON come testo dentro report, estraggo i campi...');
          
          // Trova dove inizia la sezione JSON (dopo il report narrativo)
          let narrativeText = fullText;
          let sentimentIndex = fullText.search(/[\n\s]+"sentiment":/);
          
          if (sentimentIndex > -1) {
            // Il testo narrativo è tutto prima di "sentiment"
            narrativeText = fullText.substring(0, sentimentIndex).trim();
            console.log('📝 Testo narrativo trovato (lunghezza):', narrativeText.length);
            
            // Estrai i campi con regex
            const sentimentMatch = fullText.match(sentimentPattern);
            const themesMatch = fullText.match(themesPattern);
            const strengthsMatch = fullText.match(strengthsPattern);
            const improvementsMatch = fullText.match(improvementsPattern);
            const suggestionsMatch = fullText.match(suggestionsPattern);
            
            console.log('🔍 Sentiment trovato:', sentimentMatch?.[1]);
            console.log('🔍 Themes trovato:', !!themesMatch);
            console.log('🔍 Strengths trovato:', !!strengthsMatch);
            console.log('🔍 Improvements trovato:', !!improvementsMatch);
            console.log('🔍 Suggestions trovato:', !!suggestionsMatch);
            
            // Helper per parsare array JSON dal match
            const parseJsonArray = (matchResult: string | null): string[] => {
              if (!matchResult) return [];
              try {
                // matchResult è il contenuto dentro le parentesi quadre
                // Es: "item1", "item2", "item3"
                const items = matchResult
                  .split(/",\s*"/)  // Dividi per ", "
                  .map(s => s.replace(/^["'\s]+|["'\s]+$/g, '').trim())  // Rimuovi virgolette all'inizio/fine
                  .filter(s => s.length > 0);
                return items;
              } catch {
                return [];
              }
            };
            
            reportData = {
              report: narrativeText,
              sentiment: sentimentMatch ? sentimentMatch[1] : null,
              themes: themesMatch ? parseJsonArray(themesMatch[1]) : [],
              strengths: strengthsMatch ? parseJsonArray(strengthsMatch[1]) : [],
              improvements: improvementsMatch ? parseJsonArray(improvementsMatch[1]) : [],
              suggestions: suggestionsMatch ? parseJsonArray(suggestionsMatch[1]) : []
            };
            
            console.log('✅ Campi estratti con successo:');
            console.log('  - report:', reportData.report?.length, 'caratteri');
            console.log('  - sentiment:', reportData.sentiment);
            console.log('  - themes:', reportData.themes?.length, 'elementi');
            console.log('  - strengths:', reportData.strengths?.length, 'elementi');
            console.log('  - improvements:', reportData.improvements?.length, 'elementi');
            console.log('  - suggestions:', reportData.suggestions?.length, 'elementi');
          }
        }
      }
      
      console.log('📊 ReportData dopo eventuale ri-parsing:', reportData);
      
      // Funzione helper per pulire il testo da tag HTML e normalizzare
      const cleanText = (text: any): string => {
        if (!text) return '';
        let str = String(text);
        
        // Rimuovi tutti i tag HTML inclusi <p>, <div>, etc.
        str = str.replace(/<[^>]*>/g, '');
        
        // Decodifica entità HTML comuni
        str = str
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&apos;/g, "'");
        
        // Normalizza spazi multipli e newline
        str = str.replace(/\s+/g, ' ');
        
        // Rimuovi spazi all'inizio e alla fine
        str = str.trim();
        
        return str;
      };

      // Normalizza i campi per assicurarsi che siano nel formato corretto
      const normalizedReport: AnalysisReport = {
        report: cleanText(reportData.report || reportData.Report || ''),
        sentiment: typeof reportData.sentiment === 'string' 
          ? reportData.sentiment 
          : (typeof reportData.Sentiment === 'string' ? reportData.Sentiment : null),
        themes: Array.isArray(reportData.themes) 
          ? reportData.themes.filter((t: any) => t && typeof t === 'string').map(cleanText) 
          : (Array.isArray(reportData.Themes) ? reportData.Themes.filter((t: any) => t && typeof t === 'string').map(cleanText) : []),
        strengths: Array.isArray(reportData.strengths) 
          ? reportData.strengths.filter((s: any) => s && typeof s === 'string').map(cleanText) 
          : (Array.isArray(reportData.Strengths) ? reportData.Strengths.filter((s: any) => s && typeof s === 'string').map(cleanText) : []),
        improvements: Array.isArray(reportData.improvements) 
          ? reportData.improvements.filter((i: any) => i && typeof i === 'string').map(cleanText) 
          : (Array.isArray(reportData.Improvements) ? reportData.Improvements.filter((i: any) => i && typeof i === 'string').map(cleanText) : []),
        suggestions: Array.isArray(reportData.suggestions) 
          ? reportData.suggestions.filter((s: any) => s && typeof s === 'string').map(cleanText) 
          : (Array.isArray(reportData.Suggestions) ? reportData.Suggestions.filter((s: any) => s && typeof s === 'string').map(cleanText) : []),
      };

      console.log('📊 Report normalizzato finale:', normalizedReport);
      console.log('📊 Report normalizzato - campo report lunghezza:', normalizedReport.report.length);
      console.log('📊 Report normalizzato - campo report:', normalizedReport.report);
      setReport(normalizedReport);
      if (onReportGenerated) {
        onReportGenerated(reportData);
      }

    } catch (error: any) {
      console.error('❌ Errore nella generazione del report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      toast({
        title: 'Errore',
        description: 'Impossibile generare il report. Riprova più tardi.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Analisi Report - {formTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 h-8 animate-spin mx-auto text-[#FFCD00]" />
              <p className="text-gray-600">Generazione del report in corso...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Errore nell'analisi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={generateReport} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Riprova
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report || (!report.report && report.themes.length === 0 && report.strengths.length === 0)) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Analisi Report - {formTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Nessun report disponibile per questo form.</p>
          <Button onClick={generateReport} variant="outline" size="sm" className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Genera Report
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FFCD00]" />
              Analisi Report - {formTitle}
            </CardTitle>
            <CardDescription className="mt-1">
              Report generato automaticamente dall'analisi delle risposte
            </CardDescription>
          </div>
          <Button onClick={generateReport} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Rigenera
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report principale - Sintesi Narrativa */}
        {report.report && report.report.trim() && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-900 uppercase tracking-wide">
              <FileText className="w-5 h-5 text-[#FFCD00]" />
              Report
            </h3>
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <p className="text-gray-700 leading-relaxed text-[15px] break-words" 
                 style={{ 
                   wordBreak: 'break-word', 
                   overflowWrap: 'break-word',
                   whiteSpace: 'normal',
                   maxWidth: '100%',
                   lineHeight: '1.7'
                 }}>
                {report.report}
              </p>
            </div>
          </div>
        )}

        {/* Grid per sentiment e temi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sentiment */}
          {report.sentiment && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Sentiment</h3>
              <Badge 
                variant="outline" 
                className={
                  report.sentiment === 'positive' 
                    ? 'bg-green-50 text-green-700 border-green-300 px-3 py-1.5 text-sm font-medium' 
                    : report.sentiment === 'negative'
                    ? 'bg-red-50 text-red-700 border-red-300 px-3 py-1.5 text-sm font-medium'
                    : report.sentiment === 'mixed'
                    ? 'bg-amber-50 text-amber-700 border-amber-300 px-3 py-1.5 text-sm font-medium'
                    : 'bg-gray-50 text-gray-700 border-gray-300 px-3 py-1.5 text-sm font-medium'
                }
              >
                {report.sentiment === 'positive' ? '✅ Positivo' : 
                 report.sentiment === 'negative' ? '❌ Negativo' :
                 report.sentiment === 'mixed' ? '⚖️ Misto' : '➖ Neutrale'}
              </Badge>
            </div>
          )}

          {/* Temi */}
          {report.themes && report.themes.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Themes</h3>
              <div className="flex flex-wrap gap-2">
                {report.themes.map((theme, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="bg-blue-50 text-blue-700 border-blue-200 px-2.5 py-1 text-xs font-medium"
                  >
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Punti di forza */}
        {report.strengths && report.strengths.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-base text-green-700 flex items-center gap-2 uppercase tracking-wide">
              <TrendingUp className="w-4 h-4" />
              Strengths
            </h3>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <ul className="space-y-2.5">
                {report.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-700">
                    <span className="text-green-600 font-bold mt-0.5 text-lg flex-shrink-0">✓</span>
                    <span className="flex-1 leading-relaxed">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Aree di miglioramento */}
        {report.improvements && report.improvements.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-base text-amber-700 flex items-center gap-2 uppercase tracking-wide">
              <AlertCircle className="w-4 h-4" />
              Improvements
            </h3>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <ul className="space-y-2.5">
                {report.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-700">
                    <span className="text-amber-600 font-bold mt-0.5 text-lg flex-shrink-0">⚠</span>
                    <span className="flex-1 leading-relaxed">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Suggerimenti */}
        {report.suggestions && report.suggestions.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-base text-blue-700 flex items-center gap-2 uppercase tracking-wide">
              <FileText className="w-4 h-4" />
              Suggestions
            </h3>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <ul className="space-y-2.5">
                {report.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-700">
                    <span className="text-blue-600 font-bold mt-0.5 text-lg flex-shrink-0">💡</span>
                    <span className="flex-1 leading-relaxed">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

