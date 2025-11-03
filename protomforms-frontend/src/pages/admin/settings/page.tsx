import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, Save, RefreshCw, Database, Shield, Users, Bell, Globe, Key, Palette, Zap, AlertTriangle, CheckCircle, XCircle, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    defaultLanguage: string;
    timezone: string;
    maintenanceMode: boolean;
  };
  authentication: {
    azureAdEnabled: boolean;
    azureAdClientId: string;
    azureAdTenantId: string;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
  };
  notifications: {
    emailEnabled: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    teamsWebhookEnabled: boolean;
    teamsWebhookUrl: string;
    notificationTypes: {
      newUser: boolean;
      newForm: boolean;
      newResponse: boolean;
      systemAlerts: boolean;
    };
  };
  security: {
    rateLimitEnabled: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
    corsEnabled: boolean;
    corsOrigins: string[];
    apiKeyRequired: boolean;
    auditLogEnabled: boolean;
  };
  database: {
    connectionString: string;
    maxConnections: number;
    queryTimeout: number;
    backupEnabled: boolean;
    backupFrequency: string;
    backupRetention: number;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    logoUrl: string;
    faviconUrl: string;
    customCss: string;
  };
}

interface SystemStatus {
  database: {
    status: 'connected' | 'disconnected' | 'error';
    responseTime: number;
    lastBackup: string;
  };
  azureAd: {
    status: 'connected' | 'disconnected' | 'error';
    lastSync: string;
  };
  email: {
    status: 'connected' | 'disconnected' | 'error';
    lastTest: string;
  };
  teams: {
    status: 'connected' | 'disconnected' | 'error';
    lastNotification: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: 'ProtomForms',
      siteDescription: 'Piattaforma per la gestione di form e sondaggi',
      defaultLanguage: 'it',
      timezone: 'Europe/Rome',
      maintenanceMode: false,
    },
    authentication: {
      azureAdEnabled: true,
      azureAdClientId: '',
      azureAdTenantId: '',
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
      },
    },
    notifications: {
      emailEnabled: false,
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      teamsWebhookEnabled: true,
      teamsWebhookUrl: '',
      notificationTypes: {
        newUser: true,
        newForm: true,
        newResponse: true,
        systemAlerts: true,
      },
    },
    security: {
      rateLimitEnabled: true,
      rateLimitRequests: 100,
      rateLimitWindow: 15,
      corsEnabled: true,
      corsOrigins: ['http://localhost:3000'],
      apiKeyRequired: false,
      auditLogEnabled: true,
    },
    database: {
      connectionString: '',
      maxConnections: 10,
      queryTimeout: 30,
      backupEnabled: true,
      backupFrequency: 'daily',
      backupRetention: 30,
    },
    appearance: {
      theme: 'auto',
      primaryColor: '#FFCD00',
      logoUrl: '',
      faviconUrl: '',
      customCss: '',
    },
  });

  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: {
      status: 'connected',
      responseTime: 45,
      lastBackup: '2025-07-02T10:00:00Z',
    },
    azureAd: {
      status: 'connected',
      lastSync: '2025-07-02T10:30:00Z',
    },
    email: {
      status: 'disconnected',
      lastTest: '2025-07-01T15:00:00Z',
    },
    teams: {
      status: 'connected',
      lastNotification: '2025-07-02T09:45:00Z',
    },
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
    checkSystemStatus();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        setMessage({ type: 'error', text: 'Errore nel caricamento delle impostazioni' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Errore nel caricamento delle impostazioni' });
    } finally {
      setLoading(false);
    }
  };

  const checkSystemStatus = async () => {
    try {
      // Verifica stato database e Azure AD in parallelo
      const [dbResponse, azureResponse] = await Promise.all([
        fetch('/api/health/database'),
        fetch('/api/health/azure')
      ]);

      const [dbStatus, azureStatus] = await Promise.all([
        dbResponse.json(),
        azureResponse.json()
      ]);
      
      setSystemStatus(prev => ({
        ...prev,
        database: {
          status: dbStatus.status,
          responseTime: dbStatus.responseTime,
          lastBackup: dbStatus.lastBackup,
        },
        azureAd: {
          status: azureStatus.status,
          lastSync: azureStatus.lastSync,
        },
      }));
    } catch (error) {
      console.error('Errore nel controllo dello stato del sistema:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Impostazioni salvate con successo!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Errore nel salvataggio delle impostazioni' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Errore nel salvataggio delle impostazioni' });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (type: 'email' | 'teams' | 'azure') => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage({ type: 'success', text: data.message });
        
        // Aggiorna lo stato del sistema con i nuovi dati
        if (type === 'email') {
          setSystemStatus(prev => ({
            ...prev,
            email: {
              status: 'connected',
              lastTest: data.details.lastTest,
            },
          }));
        } else if (type === 'teams') {
          setSystemStatus(prev => ({
            ...prev,
            teams: {
              status: 'connected',
              lastNotification: data.details.lastNotification,
            },
          }));
        } else if (type === 'azure') {
          setSystemStatus(prev => ({
            ...prev,
            azureAd: {
              status: 'connected',
              lastSync: data.details.lastSync,
            },
          }));
        }
      } else {
        setMessage({ type: 'error', text: data.error || `Errore nel test ${type}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Errore nel test ${type}` });
    } finally {
      setLoading(false);
    }
  };

  const exportSettings = async () => {
    try {
      const response = await fetch('/api/settings/export');
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `protomforms-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setMessage({ type: 'success', text: 'Impostazioni esportate con successo!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Errore nell\'esportazione' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Errore nell\'esportazione delle impostazioni' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connesso</Badge>;
      case 'disconnected':
        return <Badge variant="secondary">Disconnesso</Badge>;
      case 'error':
        return <Badge variant="destructive">Errore</Badge>;
      default:
        return <Badge variant="outline">Sconosciuto</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFCD00]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link 
            to="/admin/dashboard"
            className="inline-flex items-center text-[#868789] hover:text-black transition-colors mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Torna alla Dashboard
          </Link>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[#868789] mb-2">
                  Impostazioni Sistema
                </h1>
                <div className="h-1.5 w-20 bg-[#FFCD00] rounded mb-4"></div>
                <p className="text-gray-600">
                  Configura le impostazioni della piattaforma e monitora lo stato del sistema
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button variant="outline" size="sm" onClick={checkSystemStatus}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Aggiorna Stato
                </Button>
                
                <Button variant="outline" size="sm" onClick={exportSettings}>
                  <Download className="h-4 w-4 mr-2" />
                  Esporta
                </Button>
                
                <Button 
                  onClick={saveSettings} 
                  disabled={saving}
                  className="bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salva Impostazioni'}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Messaggio di stato */}
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}>
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : message.type === 'error' ? 'text-red-800' : 'text-blue-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Stato Sistema */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Stato:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(systemStatus.database.status)}
                    {getStatusBadge(systemStatus.database.status)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tempo di risposta:</span>
                  <span className="text-sm font-medium">{systemStatus.database.responseTime}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ultimo backup:</span>
                  <span className="text-sm text-gray-500">{new Date(systemStatus.database.lastBackup).toLocaleDateString('it-IT')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Azure AD
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Stato:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(systemStatus.azureAd.status)}
                    {getStatusBadge(systemStatus.azureAd.status)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ultima sincronizzazione:</span>
                  <span className="text-sm text-gray-500">{new Date(systemStatus.azureAd.lastSync).toLocaleDateString('it-IT')}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => testConnection('azure')}
                  disabled={loading}
                >
                  Test Connessione
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-600" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Stato:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(systemStatus.email.status)}
                    {getStatusBadge(systemStatus.email.status)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ultimo test:</span>
                  <span className="text-sm text-gray-500">{new Date(systemStatus.email.lastTest).toLocaleDateString('it-IT')}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => testConnection('email')}
                  disabled={loading}
                >
                  Test Email
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Stato:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(systemStatus.teams.status)}
                    {getStatusBadge(systemStatus.teams.status)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ultima notifica:</span>
                  <span className="text-sm text-gray-500">{new Date(systemStatus.teams.lastNotification).toLocaleDateString('it-IT')}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => testConnection('teams')}
                  disabled={loading}
                >
                  Test Webhook
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Impostazioni */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border overflow-hidden"
        >
          <Tabs defaultValue="general" className="w-full">
            <div className="border-b">
              <div className="px-6 py-4">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Generale
                  </TabsTrigger>
                  <TabsTrigger value="auth" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Autenticazione
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notifiche
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Sicurezza
                  </TabsTrigger>
                  <TabsTrigger value="database" className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Database
                  </TabsTrigger>
                  <TabsTrigger value="appearance" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Aspetto
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="general" className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Nome del Sito</Label>
                    <Input
                      id="siteName"
                      value={settings.general.siteName}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, siteName: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultLanguage">Lingua Predefinita</Label>
                    <Select
                      value={settings.general.defaultLanguage}
                      onValueChange={(value) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, defaultLanguage: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="it">Italiano</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Descrizione del Sito</Label>
                  <Textarea
                    id="siteDescription"
                    value={settings.general.siteDescription}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, siteDescription: e.target.value }
                    }))}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="maintenanceMode"
                    checked={settings.general.maintenanceMode}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, maintenanceMode: checked }
                    }))}
                  />
                  <Label htmlFor="maintenanceMode">Modalità Manutenzione</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="auth" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="azureAdEnabled"
                    checked={settings.authentication.azureAdEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      authentication: { ...prev.authentication, azureAdEnabled: checked }
                    }))}
                  />
                  <Label htmlFor="azureAdEnabled">Abilita Azure AD</Label>
                </div>

                {settings.authentication.azureAdEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="azureClientId">Azure AD Client ID</Label>
                      <Input
                        id="azureClientId"
                        type="password"
                        value={settings.authentication.azureAdClientId}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          authentication: { ...prev.authentication, azureAdClientId: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="azureTenantId">Azure AD Tenant ID</Label>
                      <Input
                        id="azureTenantId"
                        type="password"
                        value={settings.authentication.azureAdTenantId}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          authentication: { ...prev.authentication, azureAdTenantId: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Timeout Sessione (ore)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.authentication.sessionTimeout}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        authentication: { ...prev.authentication, sessionTimeout: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Tentativi di Login Massimi</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={settings.authentication.maxLoginAttempts}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        authentication: { ...prev.authentication, maxLoginAttempts: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Politica Password</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minLength">Lunghezza Minima</Label>
                      <Input
                        id="minLength"
                        type="number"
                        value={settings.authentication.passwordPolicy.minLength}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          authentication: {
                            ...prev.authentication,
                            passwordPolicy: {
                              ...prev.authentication.passwordPolicy,
                              minLength: parseInt(e.target.value)
                            }
                          }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="requireUppercase"
                          checked={settings.authentication.passwordPolicy.requireUppercase}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            authentication: {
                              ...prev.authentication,
                              passwordPolicy: {
                                ...prev.authentication.passwordPolicy,
                                requireUppercase: checked
                              }
                            }
                          }))}
                        />
                        <Label htmlFor="requireUppercase">Richiedi Maiuscole</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="emailEnabled"
                    checked={settings.notifications.emailEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, emailEnabled: checked }
                    }))}
                  />
                  <Label htmlFor="emailEnabled">Abilita Notifiche Email</Label>
                </div>

                {settings.notifications.emailEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={settings.notifications.smtpHost}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, smtpHost: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={settings.notifications.smtpPort}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, smtpPort: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex items-center space-x-2">
                  <Switch
                    id="teamsWebhookEnabled"
                    checked={settings.notifications.teamsWebhookEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, teamsWebhookEnabled: checked }
                    }))}
                  />
                  <Label htmlFor="teamsWebhookEnabled">Abilita Webhook Teams</Label>
                </div>

                {settings.notifications.teamsWebhookEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="teamsWebhookUrl">Teams Webhook URL</Label>
                    <Input
                      id="teamsWebhookUrl"
                      type="password"
                      value={settings.notifications.teamsWebhookUrl}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, teamsWebhookUrl: e.target.value }
                      }))}
                    />
                  </div>
                )}

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Tipi di Notifica</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="newUser"
                        checked={settings.notifications.notificationTypes.newUser}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            notificationTypes: {
                              ...prev.notifications.notificationTypes,
                              newUser: checked
                            }
                          }
                        }))}
                      />
                      <Label htmlFor="newUser">Nuovo Utente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="newForm"
                        checked={settings.notifications.notificationTypes.newForm}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            notificationTypes: {
                              ...prev.notifications.notificationTypes,
                              newForm: checked
                            }
                          }
                        }))}
                      />
                      <Label htmlFor="newForm">Nuovo Form</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="newResponse"
                        checked={settings.notifications.notificationTypes.newResponse}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            notificationTypes: {
                              ...prev.notifications.notificationTypes,
                              newResponse: checked
                            }
                          }
                        }))}
                      />
                      <Label htmlFor="newResponse">Nuova Risposta</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="systemAlerts"
                        checked={settings.notifications.notificationTypes.systemAlerts}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            notificationTypes: {
                              ...prev.notifications.notificationTypes,
                              systemAlerts: checked
                            }
                          }
                        }))}
                      />
                      <Label htmlFor="systemAlerts">Avvisi Sistema</Label>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="rateLimitEnabled"
                    checked={settings.security.rateLimitEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, rateLimitEnabled: checked }
                    }))}
                  />
                  <Label htmlFor="rateLimitEnabled">Abilita Rate Limiting</Label>
                </div>

                {settings.security.rateLimitEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="rateLimitRequests">Richieste per Minuto</Label>
                      <Input
                        id="rateLimitRequests"
                        type="number"
                        value={settings.security.rateLimitRequests}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          security: { ...prev.security, rateLimitRequests: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rateLimitWindow">Finestra (minuti)</Label>
                      <Input
                        id="rateLimitWindow"
                        type="number"
                        value={settings.security.rateLimitWindow}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          security: { ...prev.security, rateLimitWindow: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex items-center space-x-2">
                  <Switch
                    id="corsEnabled"
                    checked={settings.security.corsEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, corsEnabled: checked }
                    }))}
                  />
                  <Label htmlFor="corsEnabled">Abilita CORS</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auditLogEnabled"
                    checked={settings.security.auditLogEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, auditLogEnabled: checked }
                    }))}
                  />
                  <Label htmlFor="auditLogEnabled">Abilita Audit Log</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="database" className="p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="connectionString">Connection String</Label>
                  <Input
                    id="connectionString"
                    type="password"
                    value={settings.database.connectionString}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      database: { ...prev.database, connectionString: e.target.value }
                    }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="maxConnections">Connessioni Massime</Label>
                    <Input
                      id="maxConnections"
                      type="number"
                      value={settings.database.maxConnections}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        database: { ...prev.database, maxConnections: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="queryTimeout">Timeout Query (secondi)</Label>
                    <Input
                      id="queryTimeout"
                      type="number"
                      value={settings.database.queryTimeout}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        database: { ...prev.database, queryTimeout: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center space-x-2">
                  <Switch
                    id="backupEnabled"
                    checked={settings.database.backupEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      database: { ...prev.database, backupEnabled: checked }
                    }))}
                  />
                  <Label htmlFor="backupEnabled">Abilita Backup Automatico</Label>
                </div>

                {settings.database.backupEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="backupFrequency">Frequenza Backup</Label>
                      <Select
                        value={settings.database.backupFrequency}
                        onValueChange={(value) => setSettings(prev => ({
                          ...prev,
                          database: { ...prev.database, backupFrequency: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Ogni ora</SelectItem>
                          <SelectItem value="daily">Giornaliero</SelectItem>
                          <SelectItem value="weekly">Settimanale</SelectItem>
                          <SelectItem value="monthly">Mensile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backupRetention">Retention (giorni)</Label>
                      <Input
                        id="backupRetention"
                        type="number"
                        value={settings.database.backupRetention}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          database: { ...prev.database, backupRetention: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Tema</Label>
                  <Select
                    value={settings.appearance.theme}
                    onValueChange={(value: 'light' | 'dark' | 'auto') => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, theme: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Chiaro</SelectItem>
                      <SelectItem value="dark">Scuro</SelectItem>
                      <SelectItem value="auto">Automatico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Colore Primario</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primaryColor"
                      value={settings.appearance.primaryColor}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        appearance: { ...prev.appearance, primaryColor: e.target.value }
                      }))}
                    />
                    <div 
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: settings.appearance.primaryColor }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">URL Logo</Label>
                    <Input
                      id="logoUrl"
                      value={settings.appearance.logoUrl}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        appearance: { ...prev.appearance, logoUrl: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="faviconUrl">URL Favicon</Label>
                    <Input
                      id="faviconUrl"
                      value={settings.appearance.faviconUrl}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        appearance: { ...prev.appearance, faviconUrl: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customCss">CSS Personalizzato</Label>
                  <Textarea
                    id="customCss"
                    value={settings.appearance.customCss}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, customCss: e.target.value }
                    }))}
                    rows={6}
                    placeholder="/* Inserisci qui il tuo CSS personalizzato */"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
} 
