import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { Database, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { authenticatedFetch } from '@/lib/utils';

interface MigrationStats {
  totalOrphaned: number;
  totalWithUser: number;
  total: number;
}

interface OrphanedResponse {
  id: string;
  formId: string;
  formTitle: string;
  isAnonymous: boolean;
  ownerId: string;
  ownerName: string;
  progressiveNumber: number;
  createdAt: string;
}

export default function MigrateResponsesPage() {
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [orphanedResponses, setOrphanedResponses] = useState<OrphanedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMigrationStatus();
  }, []);

  const fetchMigrationStatus = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/admin/migrate-responses');
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento dei dati');
      }
      
      const data = await response.json();
      setStats(data.stats);
      setOrphanedResponses(data.orphanedResponses || []);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore nel caricamento dei dati",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    try {
      setMigrating(true);
      const response = await authenticatedFetch('/api/admin/migrate-responses', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Errore durante la migrazione');
      }

      const data = await response.json();

      toast({
        title: "Migrazione completata!",
        description: `${data.stats.migrated} risposte migrate, ${data.stats.skipped} saltate`,
      });

      // Ricarica i dati
      await fetchMigrationStatus();
    } catch (error: any) {
      toast({
        title: "Errore durante la migrazione",
        description: error.message || "Si è verificato un errore",
        variant: "destructive"
      });
    } finally {
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Database className="h-8 w-8 text-[#FFCD00]" />
          Migrazione Risposte
        </h1>
        <p className="text-gray-600">
          Associa le risposte senza userId agli utenti corretti
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Risposte Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Senza Utente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">
              {stats?.totalOrphaned || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Con Utente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {stats?.totalWithUser || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Migration Info */}
      {stats && stats.totalOrphaned > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="h-5 w-5" />
              Azione Richiesta
            </CardTitle>
            <CardDescription className="text-orange-700">
              Ci sono {stats.totalOrphaned} risposte che non sono associate a nessun utente.
              Queste risposte sono state create prima dell'aggiornamento del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-orange-900">Come funziona la migrazione:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-orange-800">
                <li>Le risposte a form <strong>NON anonimi</strong> verranno associate al proprietario del form</li>
                <li>Le risposte a form <strong>anonimi</strong> rimarranno senza utente (come previsto)</li>
                <li>Questo processo è sicuro e reversibile</li>
              </ul>
            </div>

            <Button
              onClick={runMigration}
              disabled={migrating}
              className="bg-[#FFCD00] text-black hover:bg-[#FFCD00]/90"
            >
              {migrating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Migrazione in corso...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Avvia Migrazione
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Success message */}
      {stats && stats.totalOrphaned === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle className="h-5 w-5" />
              Tutto OK!
            </CardTitle>
            <CardDescription className="text-green-700">
              Tutte le risposte sono correttamente associate agli utenti. Non è necessaria alcuna azione.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* List of orphaned responses */}
      {orphanedResponses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risposte da Migrare</CardTitle>
            <CardDescription>
              Anteprima delle prime 50 risposte senza utente associato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orphanedResponses.map((response) => (
                <div
                  key={response.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium">{response.formTitle}</div>
                    <div className="text-sm text-gray-500">
                      Risposta #{response.progressiveNumber} • {new Date(response.createdAt).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {response.isAnonymous ? (
                      <Badge variant="outline" className="bg-gray-100">Anonimo</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800">
                        → {response.ownerName}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={fetchMigrationStatus}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Aggiorna Stato
        </Button>
      </div>
    </div>
  );
}

