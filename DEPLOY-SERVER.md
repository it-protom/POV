# 🚀 Deploy ProtomForms sul Server di Produzione

## 📍 Server Details
- **Domain**: pov.protom.com
- **IP**: 93.63.117.104
- **Directory**: `/home/protom/protomforms`

## ⚠️ IMPORTANTE
**NON modificare nulla di AGO-EXPLORER!** ProtomForms usa porte e configurazioni completamente separate.

## 📦 File Creati

1. **docker-compose.production.yml** - Configurazione Docker Compose per produzione
2. **nginx-pov-protom.conf** - Configurazione NGINX per pov.protom.com
3. **env.production.protomforms.example** - Template per variabili d'ambiente
4. **deploy-production.sh** - Script automatico di deploy
5. **setup-nginx.sh** - Script per configurare NGINX
6. **README-DEPLOYMENT.md** - Documentazione completa

## 🔧 Passi per il Deploy

### 1. Connettiti al Server

```bash
ssh root@93.63.117.104
cd /home/protom/protomforms
```

### 2. Configura Variabili d'Ambiente

```bash
# Copia il template
cp env.production.protomforms.example env.production.protomforms

# Modifica con i valori corretti
nano env.production.protomforms
```

**Variabili importanti da configurare:**
- `PROTOMFORMS_DB_PASSWORD`: Password forte per PostgreSQL
- `PROTOMFORMS_NEXTAUTH_SECRET`: Secret casuale di almeno 32 caratteri (usa `openssl rand -base64 32`)
- Verifica che tutte le URL siano `https://pov.protom.com`

### 3. Configura NGINX

```bash
# Rendi eseguibile lo script
chmod +x setup-nginx.sh

# Esegui lo setup
sudo ./setup-nginx.sh
```

### 4. Ottieni Certificato SSL

```bash
# Se il certificato non esiste già
sudo certbot --nginx -d pov.protom.com

# Verifica configurazione NGINX
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Deploy Applicazione

```bash
# Rendi eseguibile lo script di deploy
chmod +x deploy-production.sh

# Esegui il deploy
./deploy-production.sh
```

### 6. Verifica Deployment

```bash
# Controlla lo stato dei container
docker ps | grep protomforms

# Controlla i log
docker logs protomforms-backend --tail 50
docker logs protomforms-frontend --tail 50

# Testa gli endpoint
curl http://localhost:3001/api/test
curl http://localhost:4004/
```

## 🌐 Accesso

Dopo il deploy, l'applicazione sarà disponibile a:
- **Frontend**: https://pov.protom.com
- **Backend API**: https://pov.protom.com/api
- **Health Check**: https://pov.protom.com/health

## 📊 Porte Utilizzate

| Servizio | Porta Host | Note |
|----------|------------|------|
| Frontend | 4004 | Diversa da AGO-EXPLORER (4003) |
| Backend | 3001 | Next.js API |
| PostgreSQL | 5433 | Diversa da AGO-EXPLORER (5432) |

## 🔍 Troubleshooting

### Container non si avvia
```bash
docker logs protomforms-backend
docker logs protomforms-frontend
docker-compose -f docker-compose.production.yml ps
```

### Database connection errors
```bash
docker exec protomforms-backend npx prisma db pull
docker logs protomforms-postgres
```

### NGINX errors
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Riavviare servizi
```bash
docker-compose -f docker-compose.production.yml restart
```

## 🔄 Aggiornamento

Per aggiornare l'applicazione:

```bash
cd /home/protom/protomforms

# Ferma i container
docker-compose -f docker-compose.production.yml down

# Rebuild (se necessario)
docker-compose -f docker-compose.production.yml build --no-cache

# Riavvia
docker-compose -f docker-compose.production.yml up -d

# Esegui migrations se necessario
docker exec protomforms-backend npx prisma migrate deploy
```

## 📝 Note Importanti

1. **Isolamento**: ProtomForms usa una rete Docker separata (`protomforms-network`)
2. **Database**: PostgreSQL completamente indipendente da AGO-EXPLORER
3. **Porte**: Tutte le porte sono diverse da quelle di AGO-EXPLORER per evitare conflitti
4. **NGINX**: Configurazione separata in `/etc/nginx/sites-enabled/pov-protom.conf`

## 📞 Supporto

Per problemi, controlla:
- Log dei container: `docker logs [container-name]`
- Log NGINX: `/var/log/nginx/`
- Status servizi: `docker ps`
- Config NGINX: `/etc/nginx/sites-enabled/pov-protom.conf`

