# 🚀 Deploy ProtomForms usando Tarball

## 📦 File Creati

I seguenti tarball sono stati creati e pronti per il deploy:
- `protomforms-backend.tar` - Backend Next.js
- `protomforms-frontend.tar` - Frontend React/Vite
- `protomforms-config.tar` - Configurazione Docker/NGINX
- `extract-and-deploy.sh` - Script di estrazione e deploy

## 📤 Trasferimento File

### Opzione 1: SCP/SFTP
```bash
# Da PowerShell o WSL
scp protomforms-*.tar root@93.63.117.104:/root/

# Oppure usando WinSCP o FileZilla
# Host: 93.63.117.104
# User: root
# Protocol: SFTP/SCP
```

### Opzione 2: Upload via FTP/SFTP client
Usa WinSCP, FileZilla o un altro client per trasferire i file `.tar` su:
- **Host**: 93.63.117.104
- **User**: root
- **Remote Path**: /root/

## 🚀 Deploy sul Server

### 1. Connettiti al Server
```bash
ssh root@93.63.117.104
```

### 2. Trasferisci lo script di deploy
Se non l'hai già copiato, trasferisci `extract-and-deploy.sh`:
```bash
# Da locale
scp extract-and-deploy.sh root@93.63.117.104:/root/
```

### 3. Esegui lo script di deploy
```bash
cd /root
chmod +x extract-and-deploy.sh
./extract-and-deploy.sh
```

Lo script farà automaticamente:
- ✅ Backup della configurazione esistente
- ✅ Backup del database (se presente)
- ✅ Estrazione dei tarball
- ✅ Verifica file di configurazione
- ✅ Deploy automatico con `deploy-production.sh`
- ✅ Restore database (se presente backup)

### 4. Verifica Deployment
```bash
# Controlla container
docker ps | grep protomforms

# Controlla log
docker logs protomforms-backend --tail 50
docker logs protomforms-frontend --tail 50

# Test endpoint
curl https://pov.protom.com/health
```

## ⚠️ Note Importanti

1. **Variabili d'Ambiente**: Se è la prima installazione, modifica `env.production.protomforms`:
   ```bash
   nano /home/protom/protomforms/env.production.protomforms
   ```
   Imposta:
   - `PROTOMFORMS_DB_PASSWORD`: Password forte
   - `PROTOMFORMS_NEXTAUTH_SECRET`: Secret random (usa `openssl rand -base64 32`)

2. **NGINX**: Se NGINX non è ancora configurato:
   ```bash
   cd /home/protom/protomforms
   chmod +x setup-nginx.sh
   sudo ./setup-nginx.sh
   ```

3. **SSL Certificate**: Ottieni certificato SSL se necessario:
   ```bash
   sudo certbot --nginx -d pov.protom.com
   ```

## 🔄 Rollback

Se qualcosa va storto:
```bash
cd /home/protom/protomforms
git checkout [commit-precedente]
./deploy-production.sh
```

Oppure usa i backup nella directory `/home/protom/protomforms-backup-YYYYMMDD_HHMMSS/`.

## 📝 Troubleshooting

### Container non si avvia
```bash
docker logs protomforms-backend --tail 100
docker logs protomforms-frontend --tail 100
```

### Database connection errors
```bash
docker exec protomforms-backend npx prisma db pull
docker logs protomforms-postgres
```

### Porte già in uso
```bash
# Controlla porte
netstat -tulpn | grep -E '3001|4004|5433'
```

### NGINX errors
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```






