# Configurazione Azure AD per ProtomForms

## Variabili d'ambiente richieste

Nel file `.env` o `.env.production` del backend, assicurati di avere:

```env
# Azure AD Configuration
AZURE_AD_CLIENT_ID="your-azure-ad-client-id"
AZURE_AD_CLIENT_SECRET="your-azure-ad-client-secret"
AZURE_AD_TENANT_ID="your-azure-ad-tenant-id"

# NextAuth Configuration
NEXTAUTH_SECRET="your-very-long-random-secret-key-minimum-32-characters"
NEXTAUTH_URL="https://agoexplorer.protom.com/protomforms/api"
FRONTEND_URL="https://agoexplorer.protom.com/protomforms"

# Database
DATABASE_URL="postgresql://user:password@host:5432/protomforms"
```

## Configurazione in Azure Portal

### 1. Registrare l'applicazione in Azure AD

1. Vai su [Azure Portal](https://portal.azure.com)
2. Naviga su **Azure Active Directory** → **App registrations**
3. Clicca su **New registration**
4. Nome: `ProtomForms`
5. **Supported account types**: Seleziona il tipo appropriato (Single tenant, Multi-tenant, ecc.)
6. **Redirect URI**: 
   - Tipo: `Web`
   - URL: `https://agoexplorer.protom.com/protomforms/api/auth/callback/azure-ad`
7. Clicca su **Register**

### 2. Configurare le Redirect URIs

Dopo la registrazione, vai su **Authentication**:

1. Aggiungi le seguenti Redirect URIs:
   - `https://agoexplorer.protom.com/protomforms/api/auth/callback/azure-ad`
   - `http://localhost:3001/api/auth/callback/azure-ad` (per sviluppo)

2. In **Implicit grant and hybrid flows**, abilita:
   - ✅ ID tokens (usato per il login con OpenID Connect)

3. Clicca su **Save**

### 3. Ottenere le credenziali

1. Vai su **Overview** e copia:
   - **Application (client) ID** → `AZURE_AD_CLIENT_ID`
   - **Directory (tenant) ID** → `AZURE_AD_TENANT_ID`

2. Vai su **Certificates & secrets**:
   - Clicca su **New client secret**
   - Aggiungi una descrizione (es: "ProtomForms Production")
   - Seleziona la scadenza
   - Clicca su **Add**
   - **IMPORTANTE**: Copia il **Value** del secret immediatamente (non sarà più visibile)
   - Questo valore va in `AZURE_AD_CLIENT_SECRET`

### 4. Configurare le API permissions (opzionale)

Se necessario, vai su **API permissions** e aggiungi:
- Microsoft Graph → `User.Read` (per leggere il profilo utente)

### 5. Configurare le scopes

In **Expose an API**:
1. Clicca su **Add a scope**
2. Scope name: `access_as_user`
3. Chi può dare il consenso: Amministratori e utenti
4. Descrizione: "Access ProtomForms as the signed-in user"
5. Clicca su **Add scope**

## Verifica della configurazione

### Test locale

1. Avvia il backend:
```bash
cd protomforms-backend
npm run dev
```

2. Avvia il frontend:
```bash
cd protomforms-frontend
npm run dev
```

3. Vai su `http://localhost:3000/auth/signin`
4. Clicca su "Accedi con Microsoft"
5. Verifica che il redirect funzioni correttamente

### Test produzione

1. Assicurati che tutte le variabili d'ambiente siano configurate
2. Verifica che il backend sia accessibile su `https://agoexplorer.protom.com/protomforms/api`
3. Verifica che il frontend sia accessibile su `https://agoexplorer.protom.com/protomforms`
4. Testa il login Azure AD

## Troubleshooting

### Errore: "AADSTS50011: The reply URL specified in the request does not match"

- Verifica che il redirect URI in Azure AD corrisponda esattamente a quello nel codice
- Verifica che `NEXTAUTH_URL` sia configurato correttamente
- Il redirect URI deve essere: `{NEXTAUTH_URL}/api/auth/callback/azure-ad`

### Errore: "AADSTS7000215: Invalid client secret"

- Verifica che `AZURE_AD_CLIENT_SECRET` sia il valore corretto
- I secret scadono, potrebbe essere necessario crearne uno nuovo

### Cookie non funzionano

- Verifica che `sameSite: 'none'` sia configurato in produzione
- Verifica che `secure: true` sia configurato in produzione
- Verifica che i cookie siano inviati con `withCredentials: true` nel frontend

### CORS errors

- Verifica che `FRONTEND_URL` sia configurato correttamente
- Verifica che il frontend invii le richieste con `withCredentials: true`
- Controlla i header CORS nella configurazione Next.js

## Note importanti

1. **Redirect URI**: Deve corrispondere esattamente a quello configurato in Azure AD, incluso lo slash finale o meno
2. **Secret**: I secret scadono, assicurati di aggiornarli prima della scadenza
3. **HTTPS**: In produzione, Azure AD richiede HTTPS per i redirect URI
4. **Tenant ID**: Può essere specifico o `common` per multi-tenant


