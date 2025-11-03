# 🚀 Esegui questi comandi sul server

## 1. Connettiti al Server

```bash
ssh root@93.63.117.104
```

## 2. Vai nella Directory ProtomForms

```bash
cd /home/protom/protomforms
```

## 3. Verifica che i File Siano Presenti

```bash
ls -la
# Dovresti vedere:
# - docker-compose.production.yml
# - nginx-pov-protom.conf
# - env.production.protomforms.example
# - deploy-complete.sh
# - protomforms-backend/
# - protomforms-frontend/
```

## 4. Esegui lo Script di Deploy Completo

```bash
sudo ./deploy-complete.sh
```

Questo script farà automaticamente:
- ✅ Creazione file environment con secrets generati
- ✅ Configurazione NGINX per pov.protom.com
- ✅ Richiesta certificato SSL (se necessario)
- ✅ Build e deploy dei container Docker
- ✅ Setup database e migrazioni
- ✅ Health checks di tutti i servizi

## 5. Se lo Script Fallisce

### Problema con NGINX:
```bash
sudo nginx -t  # Verifica configurazione
sudo systemctl status nginx
```

### Problema con Docker:
```bash
docker ps -a  # Vedi tutti i container
docker logs protomforms-backend  # Log backend
docker logs protomforms-frontend  # Log frontend
```

### Problema con Database:
```bash
docker exec protomforms-backend npx prisma migrate deploy
docker exec protomforms-backend npx prisma generate
```

### Riavviare Tutto:
```bash
cd /home/protom/protomforms
docker-compose -f docker-compose.production.yml restart
```

## 6. Verifica Finale

```bash
# Controlla container
docker ps | grep protomforms

# Testa backend
curl http://localhost:3001/api/test

# Testa frontend
curl http://localhost:4004/

# Verifica NGINX
curl -I https://pov.protom.com
```

## ⚠️ IMPORTANTE

- **NON modificare nulla in `/home/protom/AGO-EXPLORER`**
- ProtomForms usa porte separate (4004, 5433, 3001)
- I servizi sono completamente isolati

## 📞 Se Serve Aiuto

Controlla i log:
```bash
docker logs -f protomforms-backend
docker logs -f protomforms-frontend
docker logs -f protomforms-postgres
sudo tail -f /var/log/nginx/error.log
```

