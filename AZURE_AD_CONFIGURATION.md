# Configurazione Azure AD per ProtomForms

## Problema
Quando si accede con Microsoft, viene reindirizzato a `http://0.0.0.0:3001/api/auth/[...nextauth]` invece di `https://pov.protom.com/api/auth/[...nextauth]`.

## Soluzione Implementata

### 1. Configurazione Backend
Il backend ora usa `NEXTAUTH_URL=https://pov.protom.com` (senza `/api`) in produzione.

### 2. Variabili d'Ambiente
Nel `docker-compose.production.yml`:
```yaml
environment:
  NEXTAUTH_URL: https://pov.protom.com  # SENZA /api
  FRONTEND_URL: https://pov.protom.com
  PUBLIC_URL: https://pov.protom.com
```

### 3. Codice Backend
- `src/lib/auth.ts`: Usa `url: NEXTAUTH_URL` in `authOptions` per dire a NextAuth quale URL usare
- `src/app/api/auth/signin/route.ts`: Costruisce URL usando `NEXTAUTH_URL` invece di `request.url`
- `src/app/api/auth/azure-ad/signin/route.ts`: Usa `NEXTAUTH_URL` per i redirect

### 4. Frontend
- `src/pages/auth/signin/page.tsx`: In produzione usa `window.location.origin` (che sarà `https://pov.protom.com`)

## Configurazione Azure AD

### Passo 1: Accedi al Portale Azure
1. Vai a https://portal.azure.com
2. Accedi con un account amministratore
3. Cerca "Azure Active Directory" o "Microsoft Entra ID"

### Passo 2: Vai all'App Registration "POV"
1. Clicca su "App registrations"
2. Cerca o seleziona l'app **"POV"** (Client ID: `0fc2c468-c587-4bae-a99c-e8512c720d94`)

### Passo 3: Configura Redirect URIs
1. Nel menu sinistro, clicca su **"Authentication"** (Autenticazione)
2. Nella sezione **"Redirect URIs"**, verifica che ci sia:
   ```
   https://pov.protom.com/api/auth/callback/azure-ad
   ```
3. Se non c'è, clicca su **"Add URI"** e aggiungi:
   - **Platform**: Web
   - **Redirect URI**: `https://pov.protom.com/api/auth/callback/azure-ad`
4. **IMPORTANTE**: Se c'è ancora `http://localhost:3001/api/auth/callback/azure-ad`, **NON rimuoverlo** (potrebbe servire per sviluppo locale), ma assicurati che quello di produzione sia presente

### Passo 4: Verifica Frontend/Web Settings
1. Nella stessa pagina "Authentication", scrolla fino a **"Frontend/Web settings"**
2. Verifica che sia configurato:
   - **Frontend redirect URIs**: 
     - `https://pov.protom.com/api/auth/callback/azure-ad`
     - (opzionale) `http://localhost:3001/api/auth/callback/azure-ad` per sviluppo

### Passo 5: Verifica Impostazioni API
1. Nel menu sinistro, clicca su **"Expose an API"** (Esporre un'API)
2. Verifica che l'**Application ID URI** sia configurato correttamente

### Passo 6: Verifica Certificati e Segreti
1. Nel menu sinistro, clicca su **"Certificates & secrets"** (Certificati e segreti)
2. Verifica che il **Client Secret** sia valido:
   - **Value**: `Bbx8Q~lVe0OnN6odfQEC7o7E4SzrRWjOjQMLpbEU`
   - Se scaduto, crea un nuovo secret e aggiorna il backend

### Passo 7: Verifica Permessi API
1. Nel menu sinistro, clicca su **"API permissions"** (Permessi API)
2. Verifica che siano presenti:
   - **Microsoft Graph** → `openid`, `profile`, `email`
   - Status deve essere **"Granted"**

### Passo 8: Salva le Modifiche
1. Clicca su **"Save"** in alto per salvare tutte le modifiche
2. Attendi qualche minuto per la propagazione delle modifiche (di solito 2-5 minuti)

## Test della Configurazione

### 1. Verifica URL Backend
Accedi a: `https://pov.protom.com/api/test`
Dovrebbe rispondere: `{"status":"ok","timestamp":"...","message":"Backend is working"}`

### 2. Test Login Azure AD
1. Vai a: `https://pov.protom.com/auth/signin`
2. Clicca su **"Accedi con Microsoft"**
3. **Verifica l'URL nel browser**: Dovrebbe essere `https://pov.protom.com/api/auth/signin/azure-ad?...` (NON `http://0.0.0.0:3001`)
4. Dopo il login, dovresti essere reindirizzato a: `https://pov.protom.com/admin/dashboard`

### 3. Verifica Log Backend
Esegui sul server:
```bash
docker logs protomforms-backend | grep -i "azure\|redirect\|nextauth" | tail -20
```

Dovresti vedere:
- `🔐 Azure AD Configuration: { redirectUri: 'https://pov.protom.com/api/auth/callback/azure-ad', ... }`
- `🔄 Redirect callback called: { baseUrl: 'https://pov.protom.com', ... }`

## Troubleshooting

### Problema: "Invalid redirect URI"
**Causa**: Il redirect URI in Azure AD non corrisponde esattamente a quello usato dall'app.
**Soluzione**: Verifica che in Azure AD ci sia esattamente: `https://pov.protom.com/api/auth/callback/azure-ad` (con HTTPS, senza trailing slash)

### Problema: "Redirect to http://0.0.0.0:3001"
**Causa**: NextAuth sta usando l'URL dalla richiesta invece di `NEXTAUTH_URL`.
**Soluzione**: 
1. Verifica che `NEXTAUTH_URL=https://pov.protom.com` sia impostato nel container
2. Riavvia il container: `docker-compose restart protomforms-backend`

### Problema: "CSRF token mismatch"
**Causa**: NextAuth non può verificare il token CSRF perché l'URL base non corrisponde.
**Soluzione**: Assicurati che NGINX stia passando correttamente `X-Forwarded-Proto: https` e `X-Forwarded-Host: pov.protom.com`

## Verifica Finale

Dopo tutte le configurazioni, verifica:

1. ✅ Azure AD ha il redirect URI: `https://pov.protom.com/api/auth/callback/azure-ad`
2. ✅ Docker container ha `NEXTAUTH_URL=https://pov.protom.com`
3. ✅ NGINX passa `X-Forwarded-Proto: https`
4. ✅ Il login reindirizza a `https://pov.protom.com` (non `http://0.0.0.0:3001`)
5. ✅ Dopo il login si arriva a `https://pov.protom.com/admin/dashboard`

## Note Importanti

- **NON rimuovere** i redirect URI di sviluppo (`http://localhost:3001`) se si deve ancora sviluppare in locale
- Il **Client Secret** ha una scadenza - verificare periodicamente
- Le modifiche in Azure AD possono richiedere **2-5 minuti** per propagarsi
- Se si cambia il dominio, aggiornare anche il **DNS** e il **certificato SSL**
https://agoexplorer.protom.com/api/auth/[...nextauth]?csrf=true