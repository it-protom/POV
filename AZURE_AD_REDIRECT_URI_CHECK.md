# ✅ Verifica URI di Redirect Azure AD

## 🔍 URI RICHIESTI IN AZURE AD

Vai su **Azure Portal** → **Azure Active Directory** → **App registrations** → La tua app → **Authentication**

### ✅ URI che DEVI avere configurati:

1. **URI principale (OBBLIGATORIO per sviluppo locale):**
   ```
   http://localhost:3001/api/auth/callback/azure-ad
   ```
   - Tipo: `Web`
   - Questo è l'unico URI che Azure AD conosce
   - Azure AD reindirizza QUI dopo l'autenticazione

2. **URI per produzione (se applicabile):**
   ```
   https://agoexplorer.protom.com/protomforms/api/auth/callback/azure-ad
   ```
   - Tipo: `Web`
   - Solo se stai usando produzione

## ❌ URI che NON servono:

- ❌ `http://localhost:3000/admin/dashboard` - NON serve, è il frontend
- ❌ `http://localhost:3000/auth/callback` - NON serve
- ❌ Qualsiasi URI del frontend - Azure AD non deve conoscere il frontend

## 🔧 COME VERIFICARE/AGGIUNGERE:

1. Vai su: https://portal.azure.com
2. Naviga: **Azure Active Directory** → **App registrations**
3. Clicca sulla tua app (probabilmente "POV" o simile)
4. Vai su **Authentication** (menu laterale)
5. Nella sezione **Redirect URIs**, verifica che ci sia:
   - `http://localhost:3001/api/auth/callback/azure-ad`
6. Se manca, clicca su **Add URI** → **Web** → Inserisci l'URI → **Save**

## ⚠️ ERRORE COMUNE:

Se vedi l'errore: **"AADSTS50011: The reply URL specified in the request does not match"**

Significa che l'URI in Azure AD NON corrisponde esattamente a quello nel codice.

### Verifica che corrispondano ESATTAMENTE:

**Nel codice:** `http://localhost:3001/api/auth/callback/azure-ad`  
**In Azure AD:** Deve essere identico, carattere per carattere

- ✅ Deve essere `http://` (non `https://` per localhost)
- ✅ Deve essere `localhost:3001` (non `127.0.0.1:3001`)
- ✅ Deve avere `/api/auth/callback/azure-ad` esattamente così

## 📋 CHECKLIST RAPIDA:

- [ ] URI `http://localhost:3001/api/auth/callback/azure-ad` è presente in Azure AD?
- [ ] Tipo è `Web`?
- [ ] L'URI corrisponde ESATTAMENTE (incluso http vs https, porta, path)?
- [ ] Hai cliccato **Save** dopo aver aggiunto/modificato?

## 🚨 SE IL PROBLEMA PERSISTE:

Il problema NON è negli URI di Azure AD se:
- ✅ L'URI è configurato correttamente
- ✅ Azure AD autentica l'utente (vedi 200 OK)
- ❌ Ma non reindirizza alla dashboard

In questo caso, il problema è nel **callback redirect** di NextAuth che abbiamo già fixato nel codice.

## 📝 NOTE IMPORTANTI:

1. Azure AD reindirizza SOLO al backend (`localhost:3001`)
2. Il backend poi reindirizza al frontend (`localhost:3000`) usando il callback `redirect`
3. NON serve configurare URI del frontend in Azure AD
4. L'URI deve essere esattamente quello del backend callback endpoint


