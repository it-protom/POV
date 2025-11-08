# 🔧 Configurazione Proxy Flowise per ProtomForms

## 📋 Panoramica

Questo documento descrive come aggiungere il proxy Flowise alla configurazione nginx di ProtomForms **SENZA modificare** AGO Explorer o Arcano.

## 🎯 Obiettivo

Aggiungere il proxy `/protomforms-flowise/api/v1/` al file `protomforms.conf` esistente per permettere a ProtomForms di comunicare con Flowise tramite nginx.

## 📁 File Creati

1. **`protomforms-flowise-nginx-patch.conf`** - Solo le sezioni da aggiungere
2. **`protomforms.conf.updated`** - File completo aggiornato (riferimento)
3. **`apply-protomforms-flowise-proxy.sh`** - Script automatico per applicare le modifiche

## 🚀 Metodo 1: Script Automatico (Consigliato)

```bash
# 1. Connettiti al server
ssh root@93.63.117.104

# 2. Vai nella directory del progetto
cd /home/protom/protomforms

# 3. Copia lo script sul server (se non è già presente)
# Oppure crealo direttamente sul server

# 4. Rendi eseguibile
chmod +x apply-protomforms-flowise-proxy.sh

# 5. Esegui lo script
sudo ./apply-protomforms-flowise-proxy.sh
```

Lo script:
- ✅ Crea un backup automatico
- ✅ Testa la configurazione nginx
- ✅ Applica le modifiche solo se il test passa
- ✅ Ricarica nginx automaticamente

## 🛠️ Metodo 2: Modifica Manuale

### Passo 1: Backup

```bash
ssh root@93.63.117.104
cd /etc/nginx/sites-enabled
cp protomforms.conf protomforms.conf.backup.$(date +%Y%m%d_%H%M%S)
```

### Passo 2: Aggiungi le Sezioni

Apri il file:
```bash
nano /etc/nginx/sites-enabled/protomforms.conf
```

Aggiungi queste sezioni **DOPO** la sezione `location /api/` e **PRIMA** della sezione `location /`:

```nginx
    # ============================================
    # FLOWISE PROTOMFORMS - API Proxy
    # ============================================
    location /protomforms-flowise/api/v1/ {
        proxy_pass http://127.0.0.1:4002/api/v1/;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        
        # No cache for API
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        
        # CORS headers per ProtomForms
        add_header 'Access-Control-Allow-Origin' 'https://agoexplorer.protom.com' always;
        add_header 'Access-Control-Allow-Origin' 'https://agoexplorer.protom.com:8443' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        # Handle OPTIONS preflight
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://agoexplorer.protom.com';
            add_header 'Access-Control-Allow-Origin' 'https://agoexplorer.protom.com:8443';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
    
    # ============================================
    # FLOWISE PROTOMFORMS - Assets statici
    # ============================================
    location /protomforms-flowise/assets/ {
        proxy_pass http://127.0.0.1:4002/assets/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /protomforms-flowise/static/ {
        proxy_pass http://127.0.0.1:4002/static/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
```

### Passo 3: Test e Ricarica

```bash
# Testa la configurazione
nginx -t

# Se il test passa, ricarica nginx
systemctl reload nginx
```

## ✅ Verifica

Dopo aver applicato le modifiche, verifica che il proxy funzioni:

```bash
# Test del proxy Flowise
curl -I https://agoexplorer.protom.com:8443/protomforms-flowise/api/v1/health

# Oppure dal browser
# https://agoexplorer.protom.com:8443/protomforms-flowise/api/v1/health
```

## 🔗 URL del Proxy

Il proxy sarà disponibile su:
- **Produzione**: `https://agoexplorer.protom.com:8443/protomforms-flowise/api/v1/`
- **IP diretto**: `https://93.63.117.104:8443/protomforms-flowise/api/v1/`

## 📝 Note Importanti

- ✅ **NON modificare** `ago-explorer.conf` o `arcano.conf`
- ✅ Il proxy usa lo stesso container Flowise (porta 4002) di AGO Explorer
- ✅ Le modifiche sono isolate solo a `protomforms.conf`
- ✅ Il backup viene creato automaticamente prima delle modifiche

## 🐛 Troubleshooting

### Se nginx -t fallisce:
```bash
# Ripristina il backup
cp /etc/nginx/sites-enabled/protomforms.conf.backup.* /etc/nginx/sites-enabled/protomforms.conf
nginx -t
```

### Se il proxy non risponde:
```bash
# Verifica che Flowise sia in esecuzione
docker ps | grep flowise

# Verifica i log nginx
tail -f /var/log/nginx/error.log
```

### Se ci sono errori CORS:
- Verifica che gli header CORS siano corretti
- Controlla che l'origine del frontend corrisponda a quella configurata

## 📞 Supporto

Per problemi, controlla:
- Log nginx: `/var/log/nginx/error.log`
- Log Flowise: `docker logs ago-explorer-flowise`
- Stato nginx: `systemctl status nginx`

