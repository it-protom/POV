import React from 'react';
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useNavigate, useLocation, useSearchParams } from "react-router-dom"
import { Loader2, ArrowRight, Shield } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// next-auth removed - needs custom auth
import { Link } from "react-router-dom"
import { Icons } from "@/components/icons"
import { useAuth } from "@/contexts/AuthContext"
import { getApiUrl } from "@/lib/utils"

export default function SignInPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Check if user just registered
  const justRegistered = searchParams.get("registered") === "true"
  
  // Check for Azure AD errors from query params
  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      let errorMessage = "Errore durante l'autenticazione."
      
      if (errorParam === "azure-ad") {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        const redirectUri = isLocalhost 
          ? 'http://localhost:3001/api/auth/callback/azure-ad'
          : 'https://pov.protom.com/api/auth/callback/azure-ad'
        errorMessage = `Errore di configurazione Azure AD. Verifica che:\n- Il redirect URI in Azure AD sia esattamente: ${redirectUri}\n- Le credenziali (CLIENT_ID, CLIENT_SECRET, TENANT_ID) siano corrette\n- L'App Registration in Azure AD sia configurata correttamente\n- L'account appartenga al tenant corretto`
      } else if (errorParam === "OAuthCallback") {
        errorMessage = "Errore durante il callback OAuth. Riprova o contatta l'amministratore."
      } else if (errorParam === "OAuthSignin") {
        errorMessage = "Errore durante l'inizio dell'autenticazione OAuth. Riprova."
      } else if (errorParam === "OAuthCreateAccount") {
        errorMessage = "Errore durante la creazione dell'account. Riprova o contatta l'amministratore."
      } else if (errorParam === "AccessDenied") {
        errorMessage = "Accesso negato. Verifica le credenziali o i permessi dell'account."
      } else if (errorParam === "Configuration") {
        errorMessage = "Errore di configurazione del server. Contatta l'amministratore."
      }
      
      setError(errorMessage)
      
      // Clear error from URL after showing it
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.delete("error")
      const newUrl = newSearchParams.toString() 
        ? `/auth/signin?${newSearchParams.toString()}`
        : '/auth/signin'
      navigate(newUrl, { replace: true })
    }
  }, [searchParams, navigate])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.email) {
      errors.email = "Email è richiesta"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email non valida"
    }

    if (!formData.password) {
      errors.password = "Password è richiesta"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  async function handleCredentialsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      await login(formData.email, formData.password)
      
      // AuthContext handles the redirect based on role
      // The user will be redirected by ProtectedRoute
      navigate('/admin/dashboard')
    } catch (err: any) {
      setError(err.message || "Credenziali non valide")
      setLoading(false)
    }
  }

  const handleAzureSignIn = async () => {
    setLoading(true)
    try {
      // FORZA pov.protom.com in produzione per evitare conflitti con altri domini
      let frontendUrl: string
      let backendUrl: string
      
      if (window.location.hostname === 'pov.protom.com') {
        // Produzione: usa sempre pov.protom.com
        frontendUrl = 'https://pov.protom.com'
        backendUrl = 'https://pov.protom.com'
      } else if (window.location.hostname.includes('protom.com') && window.location.hostname !== 'agoexplorer.protom.com') {
        // Altri domini protom.com (ma non agoexplorer)
        frontendUrl = window.location.origin
        backendUrl = window.location.origin
      } else {
        // Sviluppo o altri domini: usa localhost o variabile d'ambiente
        frontendUrl = window.location.origin
        backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'
      }
      
      const callbackUrl = encodeURIComponent(`${frontendUrl}/admin/dashboard`)
      
      // Usa direttamente l'URL del backend per il redirect Azure AD
      // Questo bypassa il proxy Vite che potrebbe non gestire correttamente i redirect esterni
      // NextAuth gestirà il redirect ad Azure AD e poi il callback al backend
      const signInUrl = `${backendUrl}/api/auth/signin/azure-ad?callbackUrl=${callbackUrl}`
      
      console.log('🔵 Attempting Azure AD sign in (NextAuth endpoint):', {
        backendUrl,
        frontendUrl,
        callbackUrl: decodeURIComponent(callbackUrl),
        signInUrl,
        note: 'Direct backend URL for Azure AD redirect (bypasses Vite proxy for external redirects)'
      })
      
      // Redirect diretto - NextAuth gestirà tutto (state, PKCE, redirect ad Azure AD)
      window.location.href = signInUrl
    } catch (error) {
      console.error('❌ Error initiating Azure AD sign in:', error)
      setError('Errore durante l\'avvio dell\'autenticazione Azure AD')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent"></div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and title section */}
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img
                src="/logo_pov.png"
                alt="POV Logo"
                className="w-12 h-12 object-contain"
              />
              <h1 className="text-4xl font-bold text-gray-900">
                pov
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Benvenuto nella piattaforma di gestione form
            </p>
          </div>

          {/* Success message for registration */}
          {justRegistered && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-fade-in">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-medium">
                  Registrazione completata! Ora puoi accedere.
                </p>
              </div>
            </div>
          )}

          {/* Main card */}
          <Card className="border border-gray-200 shadow-lg bg-white animate-fade-in">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl font-semibold text-center text-gray-800">
                Accedi al tuo account
              </CardTitle>
              <CardDescription className="text-center text-gray-600">
                Scegli il metodo di accesso che preferisci
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="azure" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 p-1 rounded-xl">
                  <TabsTrigger 
                    value="azure" 
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                  >
                    Microsoft
                  </TabsTrigger>
                  <TabsTrigger 
                    value="credentials" 
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                  >
                    Credenziali
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="azure" className="space-y-6 mt-6">
                  <div className="text-center space-y-4">
                    {error && (
                      <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50">
                        <AlertDescription className="text-red-700 whitespace-pre-line text-sm">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <p className="text-sm text-blue-700 font-medium">
                        Accedi con il tuo account Microsoft @protom.com
                      </p>
                    </div>
                    <Button 
                      onClick={handleAzureSignIn} 
                      disabled={loading}
                      size="lg"
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group"
                    >
                      <Icons.microsoft className="w-5 h-5 mr-3" />
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Accesso in corso...
                        </>
                      ) : (
                        <>
                          Accedi con Microsoft
                          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="credentials" className="space-y-6 mt-6">
                  <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`h-12 rounded-xl border-2 transition-all duration-200 ${
                          validationErrors.email 
                            ? "border-red-300 focus:border-red-500" 
                            : "border-gray-200 focus:border-blue-500"
                        }`}
                        placeholder="user@protom.com"
                      />
                      {validationErrors.email && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Password
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`h-12 rounded-xl border-2 transition-all duration-200 ${
                          validationErrors.password 
                            ? "border-red-300 focus:border-red-500" 
                            : "border-gray-200 focus:border-blue-500"
                        }`}
                        placeholder="••••••••"
                      />
                      {validationErrors.password && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.password}</p>
                      )}
                    </div>
                    
                    {error && (
                      <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50">
                        <AlertDescription className="text-red-700">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <Button 
                      type="submit" 
                      disabled={loading}
                      size="lg"
                      className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Accesso in corso...
                        </>
                      ) : (
                        <>
                          Accedi
                          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
              
              {/* Registration link */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Non hai un account?{" "}
                  <Link 
                    to="/auth/register" 
                    className="font-medium text-blue-600 hover:text-blue-800 transition-colors hover:underline"
                  >
                    Registrati ora
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>© 2024 pov. Tutti i diritti riservati.</p>
          </div>
        </div>
      </div>
    </div>
  )
} 
