import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, Search, Filter, Download, RefreshCw, User, Mail, Calendar, Shield, Users, Plus, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  image?: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  formsCreated: number;
  responsesSubmitted: number;
  azureId?: string;
  department?: string;
  jobTitle?: string;
  officeLocation?: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
  totalFormsCreated: number;
  totalResponsesSubmitted: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  // const [statusFilter, setStatusFilter] = useState('all'); // Non disponibile nel modello attuale
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await res.json();
      setUsers(data.users || []);
      setStats(data.stats || null);
      setError(null);
    } catch (err) {
      setError('Error loading users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filtro per ricerca
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.azureId && user.azureId.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro per ruolo
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filtro per stato - non disponibile nel modello attuale
    // if (statusFilter !== 'all') {
    //   filtered = filtered.filter(user => 
    //     statusFilter === 'active' ? user.isActive : !user.isActive
    //   );
    // }

    setFilteredUsers(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeDate = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Ora';
    if (diffInHours < 24) return `${diffInHours}h fa`;
    if (diffInHours < 48) return 'Ieri';
    return formatDate(dateString);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'ADMIN' ? 'destructive' : 'secondary';
  };

  const getStatusBadgeVariant = (isActive: boolean) => {
    return 'default' as const; // Tutti gli utenti sono attivi per ora
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-red-600">{error}</div>
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
                  Gestione Utenti
                </h1>
                <div className="h-1.5 w-20 bg-[#FFCD00] rounded mb-4"></div>
                <p className="text-gray-600">
                  Visualizza e gestisci tutti gli utenti della piattaforma
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button variant="outline" size="sm" onClick={fetchUsers}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Aggiorna
                </Button>
                
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Esporta
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Statistiche */}
        {stats && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Utenti Totali</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Utenti Attivi</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Amministratori</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.adminUsers}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Nuovi Questo Mese</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.newUsersThisMonth}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Plus className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filtri */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca per nome, email, Azure ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Ruolo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i ruoli</SelectItem>
                  <SelectItem value="ADMIN">Amministratori</SelectItem>
                  <SelectItem value="USER">Utenti</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro per stato - non disponibile nel modello attuale
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="active">Attivi</SelectItem>
                  <SelectItem value="inactive">Inattivi</SelectItem>
                </SelectContent>
              </Select>
              */}
            </div>
          </div>
        </motion.div>

        {/* Tabella Utenti */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border overflow-hidden"
        >
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#868789]">
                Utenti ({filteredUsers.length})
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Utente</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Azure ID</TableHead>
                  <TableHead>Form Creati</TableHead>
                  <TableHead>Risposte</TableHead>
                  <TableHead>Ultimo Accesso</TableHead>
                  <TableHead>Registrato</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.image} alt={user.name} />
                        <AvatarFallback className="bg-[#FFCD00] text-black font-medium">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div className="font-medium text-[#868789]">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        {user.azureId && (
                          <div className="text-xs text-gray-400 font-mono">ID: {user.azureId.slice(0, 6)}...</div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role === 'ADMIN' ? 'Amministratore' : 'Utente'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm text-gray-600 font-mono">
                        {user.azureId ? user.azureId.slice(0, 8) + '...' : 'N/A'}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900">
                        {user.formsCreated}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900">
                        {user.responsesSubmitted}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {user.lastLoginAt ? formatRelativeDate(user.lastLoginAt) : 'Mai'}
                      </div>
                      <div className="text-xs text-gray-400">
                        Registrato: {formatDate(user.createdAt)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {formatDate(user.createdAt)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizza Dettagli
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifica Ruolo
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Disattiva Utente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Nessun utente trovato</p>
                <p className="text-sm">Prova a modificare i filtri di ricerca.</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Dialog Dettagli Utente */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Dettagli Utente</DialogTitle>
              <DialogDescription>
                Informazioni complete dell'utente e attività nella piattaforma
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser.image} alt={selectedUser.name} />
                    <AvatarFallback className="bg-[#FFCD00] text-black font-medium text-lg">
                      {getInitials(selectedUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-[#868789]">{selectedUser.name}</h3>
                    <p className="text-gray-600">{selectedUser.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={getRoleBadgeVariant(selectedUser.role)}>
                        {selectedUser.role === 'ADMIN' ? 'Amministratore' : 'Utente'}
                      </Badge>
                      <Badge variant="default">
                        Attivo
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Informazioni Azure AD</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Azure ID:</span>
                        <span className="ml-2">{selectedUser.azureId || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <span className="ml-2">{selectedUser.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Ruolo:</span>
                        <span className="ml-2">{selectedUser.role === 'ADMIN' ? 'Amministratore' : 'Utente'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Attività</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Form creati:</span>
                        <span className="ml-2 font-medium">{selectedUser.formsCreated}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Risposte inviate:</span>
                        <span className="ml-2 font-medium">{selectedUser.responsesSubmitted}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Ultimo accesso:</span>
                        <span className="ml-2">{selectedUser.lastLoginAt ? formatRelativeDate(selectedUser.lastLoginAt) : 'Mai'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Cronologia</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Registrato il:</span>
                      <span className="ml-2">{formatDate(selectedUser.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Ultimo aggiornamento:</span>
                      <span className="ml-2">{formatDate(selectedUser.lastLoginAt || selectedUser.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 