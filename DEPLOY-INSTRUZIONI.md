# 🚀 ISTRUZIONI DEPLOY RAPIDO

## Modifiche implementate e pronte per il deploy:
- ✅ Fix calendario: layout tabella corretto
- ✅ Fix auth: header x-user-id per session fallback
- ✅ Fix fetch: authenticatedFetch con credentials include
- ✅ Date pickers: apertura e chiusura form
- ✅ Schema Prisma: opensAt e closesAt
- ✅ Cleanup: rimossi file .next da git

## Comandi da eseguire sul server:

```bash
# 1. Connettiti al server
ssh root@93.63.117.104
cd /home/protom/protomforms

# 2. Aggiorna il codice
git pull

# 3. Esegui il deploy automatico
chmod +x deploy-production.sh
./deploy-production.sh
```

Lo script farà automaticamente:
- Stop container esistenti
- Build immagini Docker (--no-cache)
- Start servizi
- Migrazioni database Prisma
- Verifica health check

## Verifica dopo il deploy:

```bash
# Controlla container
docker ps | grep protomforms

# Verifica log
docker logs protomforms-backend --tail 50
docker logs protomforms-frontend --tail 50

# Test endpoint
curl https://pov.protom.com/health
```

## Rollback (se necessario):

```bash
cd /home/protom/protomforms
git checkout [commit-precedente]
./deploy-production.sh
```



