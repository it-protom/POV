# Stato Servizi ProtomForms

## ✅ Servizi Attivi

### Backend (Next.js)
- **Porta**: 3001
- **URL**: http://localhost:3001
- **API Base**: http://localhost:3001/api
- **Status**: ✅ Attivo

### Frontend (Vite + React)
- **Porta**: 3000
- **URL**: http://localhost:3000
- **Status**: ✅ Attivo

## 📍 URL Importanti

- **Frontend**: http://localhost:3000
- **Login Page**: http://localhost:3000/auth/signin
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health/database
- **Session Check**: http://localhost:3001/api/auth/session
- **NextAuth Endpoints**: http://localhost:3001/api/auth/*

## 🔍 Verifica Autenticazione Azure AD

### Test Manuale

1. Apri il browser su: http://localhost:3000/auth/signin
2. Clicca su "Accedi con Microsoft" (tab Microsoft)
3. Verifica il redirect ad Azure AD
4. Dopo l'autenticazione, verifica il redirect al dashboard

### Endpoint di Test

```bash
# Verifica sessione
curl http://localhost:3001/api/auth/session

# Health check database
curl http://localhost:3001/api/health/database

# Test Azure config
curl http://localhost:3001/api/test-azure-config
```

## ⚙️ Configurazione Richiesta

Assicurati che il file `.env` nel backend contenga:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/protomforms"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
AZURE_AD_CLIENT_ID="your-client-id"
AZURE_AD_CLIENT_SECRET="your-client-secret"
AZURE_AD_TENANT_ID="your-tenant-id"
```

## 🛑 Per Fermare i Servizi

Usa `Ctrl+C` nei terminali dove sono in esecuzione, oppure:

```powershell
# Trova i processi
Get-Process -Name node

# Termina tutti i processi Node (ATTENZIONE: chiude tutti i processi Node)
Stop-Process -Name node -Force
```

## 📝 Note

- Il frontend è configurato per usare un proxy verso `/api` che reindirizza a `http://localhost:3001`
- I cookie NextAuth sono configurati per `sameSite: 'lax'` in sviluppo
- In produzione, i cookie useranno `sameSite: 'none'` e `secure: true`


