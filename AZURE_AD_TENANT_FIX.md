# 🔧 Fix Autenticazione Azure AD con Tenant

## Problema
Azure AD non accetta l'autenticazione con redirect URI localhost per il tenant `94524ed0-9807-4351-bd2e-ba548fd5a31d`.

## Soluzione

### 1. Verifica Redirect URI in Azure Portal

1. Vai su [Azure Portal](https://portal.azure.com)
2. Naviga su **Azure Active Directory** → **App registrations**
3. Cerca l'app **"POV"** (Client ID: `0fc2c468-c587-4bae-a99c-e8512c720d94`)
4. Vai su **Authentication** (Autenticazione)
5. Nella sezione **Redirect URIs**, verifica che ci siano **ENTRAMBI** questi URI:
   - ✅ `http://localhost:3001/api/auth/callback/azure-ad` (per sviluppo locale)
   - ✅ `https://pov.protom.com/api/auth/callback/azure-ad` (per produzione)

### 2. Configurazione Tenant

Se Azure AD non accetta redirect URI localhost, potrebbe essere necessario modificare le impostazioni del tenant:

#### Opzione A: Abilita Redirect URI Localhost (Consigliato per sviluppo)

1. In Azure Portal, vai su **Azure Active Directory** → **App registrations** → **POV**
2. Vai su **Authentication**
3. Nella sezione **Redirect URIs**, aggiungi:
   - Platform: **Web**
   - Redirect URI: `http://localhost:3001/api/auth/callback/azure-ad`
4. Scrolla fino a **Advanced settings** → **Allow public client flows**
5. Se questa opzione è disponibile, potresti doverla abilitare per permettere redirect URI localhost
6. Clicca **Save**

#### Opzione B: Usa Tenant "common" o "organizations" (Solo se necessario)

Se il problema persiste, puoi temporaneamente usare "common" o "organizations" invece del tenant ID specifico:

⚠️ **ATTENZIONE**: Questo permetterà l'autenticazione da qualsiasi tenant Microsoft, non solo Protom.

Nel file `src/lib/auth.ts`, modifica:
```typescript
tenantId: AZURE_AD_TENANT_ID,  // Cambia temporaneamente in:
tenantId: "common",  // o "organizations"
```

#### Opzione C: Usa Tunnel HTTPS per sviluppo locale

Se Azure AD non accetta redirect URI localhost, usa un tunnel HTTPS:

1. Installa [ngrok](https://ngrok.com/) o simile
2. Esegui: `ngrok http 3001`
3. Usa l'URL HTTPS fornito da ngrok come redirect URI in Azure AD
4. Aggiorna `NEXTAUTH_URL` nel backend con l'URL ngrok

### 3. Verifica Configurazione Account Types

1. In Azure Portal, vai su **Azure Active Directory** → **App registrations** → **POV**
2. Vai su **Overview**
3. Verifica **Supported account types**:
   - ✅ **Accounts in this organizational directory only** (Solo Protom Group S.p.A.)
   - ✅ **Accounts in any organizational directory** (qualsiasi tenant Microsoft Entra ID)
   - ✅ **Accounts in any organizational directory and personal Microsoft accounts**

Per permettere l'autenticazione solo da account Protom, usa l'opzione 1.

### 4. Verifica Token Configuration

1. In Azure Portal, vai su **Azure Active Directory** → **App registrations** → **POV**
2. Vai su **Token configuration**
3. Verifica che **ID tokens** sia abilitato

### 5. Verifica Platform Configuration

1. In Azure Portal, vai su **Azure Active Directory** → **App registrations** → **POV**
2. Vai su **Authentication**
3. Verifica che la **Platform** sia configurata come **Web**
4. Assicurati che **ID tokens** sia selezionato in **Implicit grant and hybrid flows**

## Test della Configurazione

Dopo aver configurato Azure AD:

1. Riavvia il backend: `npm run dev` nella cartella `protomforms-backend`
2. Controlla i log del backend - dovresti vedere:
   ```
   🔐 Azure AD Configuration: {
     redirectUri: 'http://localhost:3001/api/auth/callback/azure-ad',
     ...
   }
   ```
3. Prova ad accedere con Microsoft dalla pagina di sign-in
4. Se vedi ancora l'errore, controlla la console del browser per messaggi di errore specifici

## Errore Comune: "AADSTS50011: The reply URL specified in the request does not match"

Questo errore significa che il redirect URI nel codice NON corrisponde esattamente a quello in Azure AD.

**Verifica:**
- Il redirect URI nel codice deve essere **IDENTICO** a quello in Azure AD
- Controlla maiuscole/minuscole, `http://` vs `https://`, `localhost` vs `127.0.0.1`
- Il redirect URI deve terminare con `/api/auth/callback/azure-ad` (esattamente così)

## Checklist Finale

- [ ] Redirect URI `http://localhost:3001/api/auth/callback/azure-ad` è presente in Azure AD
- [ ] Redirect URI `https://pov.protom.com/api/auth/callback/azure-ad` è presente in Azure AD
- [ ] Platform è configurata come **Web**
- [ ] **ID tokens** è abilitato in **Implicit grant and hybrid flows**
- [ ] **Supported account types** è configurato correttamente
- [ ] Il backend sta usando il redirect URI corretto (controlla i log)
- [ ] Il tenant ID nel codice corrisponde al tenant ID in Azure AD

## Supporto

Se il problema persiste dopo aver seguito questi passaggi, verifica:
1. I log del backend per vedere quale redirect URI sta usando
2. La console del browser per errori specifici di Azure AD
3. Le impostazioni del tenant Azure AD per restrizioni sui redirect URI







