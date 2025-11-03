import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Link } from "react-router-dom"

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const error = searchParams.error

  let errorMessage = "Si è verificato un errore durante l'autenticazione."
  
  if (error === "AccessDenied") {
    errorMessage = "Accesso negato. Solo gli utenti con email @protom.com possono accedere."
  } else if (error === "Configuration") {
    errorMessage = "Errore di configurazione del server. Contatta l'amministratore."
  } else if (error === "Verification") {
    errorMessage = "Il link di verifica è scaduto o è già stato utilizzato."
  } else if (error === "OAuthSignin") {
    errorMessage = "Errore durante l'inizio del processo di autenticazione OAuth."
  } else if (error === "OAuthCallback") {
    errorMessage = "Errore durante la gestione della risposta OAuth."
  } else if (error === "OAuthCreateAccount") {
    errorMessage = "Impossibile creare l'account OAuth."
  } else if (error === "EmailCreateAccount") {
    errorMessage = "Impossibile creare l'account email."
  } else if (error === "Callback") {
    errorMessage = "Errore durante la gestione della risposta di autenticazione."
  } else if (error === "OAuthAccountNotLinked") {
    errorMessage = "Per confermare la tua identità, accedi con lo stesso account che hai utilizzato originariamente."
  } else if (error === "EmailSignin") {
    errorMessage = "Impossibile inviare l'email di accesso."
  } else if (error === "CredentialsSignin") {
    errorMessage = "Credenziali non valide. Verifica email e password."
  } else if (error === "SessionRequired") {
    errorMessage = "Questa pagina richiede l'autenticazione."
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-[400px] shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Errore di autenticazione</CardTitle>
          <CardDescription>
            Si è verificato un problema durante il processo di accesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button asChild>
              <Link to="/auth/signin">Torna al login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
