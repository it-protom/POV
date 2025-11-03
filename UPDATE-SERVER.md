# 🔄 Aggiornamento Server ProtomForms

## 📍 Informazioni Server
- **IP**: 93.63.117.104
- **Directory**: `/home/protom/protomforms`
- **Repository**: https://github.com/it-protom/POV.git (pubblico)

## 🚀 Procedura di Aggiornamento

### Metodo 1: Script Automatico (Consigliato)

1. **Connettiti al server via SSH:**
   ```bash
   ssh -i "C:\Users\Giuseppe Mursia\Downloads\OneDrive_2025-10-13\VM ARCANO\config" root@93.63.117.104
   ```

2. **Vai nella directory del progetto:**
   ```bash
   cd /home/protom/protomforms
   ```

3. **Copia lo script di update sul server** (se non è già presente):
   - Dal tuo PC, carica `update-server.sh` nella directory del server
   - Oppure crealo direttamente sul server con `nano update-server.sh` e incolla il contenuto

4. **Rendi lo script eseguibile:**
   ```bash
   chmod +x update-server.sh
   ```

5. **Esegui l'update:**
   ```bash
   ./update-server.sh
   ```

Lo script farà automaticamente:
- ✅ Backup dei file correnti
- ✅ Pull delle ultime modifiche da GitHub
- ✅ Build delle immagini Docker
- ✅ Riavvio dei container
- ✅ Esecuzione delle migration del database
- ✅ Verifica dello stato dei servizi

### Metodo 2: Comandi Manuali

Se preferisci eseguire i comandi manualmente:

```bash
# 1. Connettiti al server
ssh -i "C:\Users\Giuseppe Mursia\Downloads\OneDrive_2025-10-13\VM ARCANO\config" root@93.63.117.104

# 2. Vai nella directory
cd /home/protom/protomforms

# 3. Crea backup (opzionale ma consigliato)
mkdir -p ../protomforms-backup-$(date +%Y%m%d_%H%M%S)
cp -r protomforms-backend ../protomforms-backup-*/ 2>/dev/null || true
cp -r protomforms-frontend ../protomforms-backup-*/ 2>/dev/null || true

# 4. Pull dal repository
git fetch origin
git pull origin main  # o il tuo branch principale

# 5. Ferma i container
docker-compose -f docker-compose.production.yml down

# 6. Build le immagini (con cache per velocità)
docker-compose -f docker-compose.production.yml build

# 7. Avvia i container
docker-compose -f docker-compose.production.yml up -d

# 8. Attendi che i servizi siano pronti
sleep 30

# 9. Esegui le migration
docker exec protomforms-backend npx prisma migrate deploy

# 10. Genera Prisma client
docker exec protomforms-backend npx prisma generate

# 11. Verifica lo stato
docker-compose -f docker-compose.production.yml ps

# 12. Controlla i log (opzionale)
docker logs protomforms-backend --tail 50
docker logs protomforms-frontend --tail 50
```

## 🔍 Verifica Post-Update

Dopo l'update, verifica che tutto funzioni:

```bash
# Controlla i container
docker ps | grep protomforms

# Test backend
curl http://localhost:3001/api/test

# Test frontend
curl http://localhost:4004

# Controlla i log
docker logs protomforms-backend --tail 50
docker logs protomforms-frontend --tail 50
```

## 🌐 Accesso all'Applicazione

Dopo l'update, l'applicazione dovrebbe essere disponibile a:
- **Frontend**: https://pov.protom.com
- **Backend API**: https://pov.protom.com/api

## ⚠️ Troubleshooting

### Se il git pull fallisce:
```bash
# Verifica lo stato del repository
git status

# Se ci sono conflitti, risolvili manualmente
git stash  # salva le modifiche locali
git pull origin main
# oppure
git pull origin main --rebase
```

### Se i container non si avviano:
```bash
# Controlla i log
docker logs protomforms-backend
docker logs protomforms-frontend
docker logs protomforms-postgres

# Verifica la configurazione
docker-compose -f docker-compose.production.yml config

# Prova a rebuildare senza cache
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
```

### Se le migration falliscono:
```bash
# Prova a generare il client Prisma
docker exec protomforms-backend npx prisma generate

# Verifica la connessione al database
docker exec protomforms-backend npx prisma db pull

# Esegui le migration manualmente
docker exec protomforms-backend npx prisma migrate deploy
```

### Se devi fare rollback:
```bash
# Ferma i container
docker-compose -f docker-compose.production.yml down

# Ripristina dal backup
cd ..
cp -r protomforms-backup-YYYYMMDD_HHMMSS/* protomforms/

# Torna nella directory e riavvia
cd protomforms
docker-compose -f docker-compose.production.yml up -d
```

## 📝 Note Importanti

1. **Repository Pubblico**: Il repository è pubblico, quindi non serve autenticazione per il pull
2. **Backup**: Lo script crea automaticamente un backup prima dell'update
3. **Non tocca AGO-EXPLORER**: ProtomForms è completamente isolato e non interferisce con altri servizi
4. **Downtime**: Durante l'update ci sarà un breve periodo di downtime (circa 1-2 minuti)

## 🔄 Update Rapido (senza rebuild completo)

Se hai solo modifiche al codice (non alle dipendenze), puoi fare un update più veloce:

```bash
cd /home/protom/protomforms
git pull origin main
docker-compose -f docker-compose.production.yml restart
docker exec protomforms-backend npx prisma migrate deploy
```

Questo evita di rebuildare le immagini Docker, risparmiando tempo.

