# ProtomForms - Deployment Guide
## Domain: pov.protom.com | IP: 93.63.117.104

Questo documento descrive come deployare ProtomForms sul server di produzione seguendo la stessa struttura di AGO-EXPLORER.

## 📋 Prerequisiti

1. Accesso SSH al server (93.63.117.104)
2. Docker e Docker Compose installati
3. NGINX installato e configurato
4. Certbot per SSL (Let's Encrypt)
5. Dominio `pov.protom.com` puntato a `93.63.117.104`

## 🏗️ Struttura

```
/home/protom/protomforms/
├── docker-compose.production.yml
├── env.production.protomforms
├── nginx-pov-protom.conf
├── deploy-production.sh
├── setup-nginx.sh
├── protomforms-backend/
│   ├── Dockerfile
│   └── ...
└── protomforms-frontend/
    ├── Dockerfile
    └── ...
```

## 🚀 Deploy Steps

### 1. Prepara il Server

```bash
# Connetti al server
ssh root@93.63.117.104

# Vai nella directory ProtomForms
cd /home/protom/protomforms
```

### 2. Configura Variabili d'Ambiente

```bash
# Copia l'esempio e modifica
cp env.production.protomforms.example env.production.protomforms

# Modifica le variabili importanti:
# - PROTOMFORMS_DB_PASSWORD: Password sicura per PostgreSQL
# - PROTOMFORMS_NEXTAUTH_SECRET: Secret casuale di almeno 32 caratteri
# - Verifica che le URL siano corrette (https://pov.protom.com)
nano env.production.protomforms
```

### 3. Configura NGINX

```bash
# Rendi eseguibile lo script
chmod +x setup-nginx.sh

# Esegui lo setup NGINX
sudo ./setup-nginx.sh

# Ottieni certificato SSL (se non già presente)
sudo certbot --nginx -d pov.protom.com

# Verifica configurazione
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Deploy con Docker Compose

```bash
# Rendi eseguibile lo script di deploy
chmod +x deploy-production.sh

# Esegui il deploy
./deploy-production.sh

# Oppure manualmente:
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# Attendi che i servizi siano pronti
sleep 30

# Esegui migrations
docker exec protomforms-backend npx prisma migrate deploy
docker exec protomforms-backend npx prisma generate
```

### 5. Verifica Deployment

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

## 🌐 Accesso all'Applicazione

- **Frontend**: https://pov.protom.com
- **Backend API**: https://pov.protom.com/api
- **Health Check**: https://pov.protom.com/health

## 🔧 Porte Utilizzate

| Servizio | Porta Container | Porta Host | Note |
|----------|----------------|------------|------|
| Frontend | 80 | 4004 | Nginx in container |
| Backend | 3001 | 3001 | Next.js API |
| PostgreSQL | 5432 | 5433 | Diversa da AGO-EXPLORER (5432) |

## 📝 Comandi Utili

### Gestione Container

```bash
# Riavvia tutti i servizi
docker-compose -f docker-compose.production.yml restart

# Riavvia un servizio specifico
docker-compose -f docker-compose.production.yml restart protomforms-backend

# Vedi i log in tempo reale
docker logs -f protomforms-backend
docker logs -f protomforms-frontend

# Ferma tutto
docker-compose -f docker-compose.production.yml down

# Rimuovi tutto (ATTENZIONE: cancella anche i volumi!)
docker-compose -f docker-compose.production.yml down -v
```

### Database

```bash
# Connetti al database
docker exec -it protomforms-postgres psql -U protomforms_user -d protomforms

# Backup database
docker exec protomforms-postgres pg_dump -U protomforms_user protomforms > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker exec -i protomforms-postgres psql -U protomforms_user protomforms < backup.sql
```

### Migrazioni

```bash
# Esegui migrations
docker exec protomforms-backend npx prisma migrate deploy

# Genera Prisma client
docker exec protomforms-backend npx prisma generate

# Prisma Studio (per debug)
docker exec -it protomforms-backend npx prisma studio --port 5555
# Accesso: http://localhost:5555 (richiede port forwarding)
```

## 🔐 Sicurezza

1. **Password Database**: Cambia `PROTOMFORMS_DB_PASSWORD` con una password forte
2. **NextAuth Secret**: Genera un secret casuale di almeno 32 caratteri
3. **SSL Certificate**: Assicurati che il certificato SSL sia valido
4. **Firewall**: Configura il firewall per permettere solo porte necessarie

## 🔍 Troubleshooting

### Container non si avvia

```bash
# Controlla i log
docker logs protomforms-backend
docker logs protomforms-frontend

# Controlla lo stato
docker-compose -f docker-compose.production.yml ps

# Verifica le porte
netstat -tulpn | grep -E '3001|4004|5433'
```

### Database connection errors

```bash
# Verifica che PostgreSQL sia in esecuzione
docker ps | grep protomforms-postgres

# Testa la connessione
docker exec protomforms-backend npx prisma db pull

# Controlla i log del database
docker logs protomforms-postgres
```

### NGINX errors

```bash
# Testa la configurazione
sudo nginx -t

# Vedi i log NGINX
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## ⚠️ IMPORTANTE

- **NON modificare nulla di AGO-EXPLORER**
- ProtomForms usa porte diverse (4004 invece di 4003, 5433 invece di 5432)
- I container sono sulla rete `protomforms-network` separata
- Il database è completamente indipendente da AGO-EXPLORER

## 📞 Supporto

In caso di problemi, controlla:
1. I log dei container: `docker logs [container-name]`
2. I log NGINX: `/var/log/nginx/`
3. Lo stato dei servizi: `docker ps`
4. La configurazione NGINX: `/etc/nginx/sites-enabled/pov-protom.conf`

