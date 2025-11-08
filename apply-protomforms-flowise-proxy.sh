#!/bin/bash

# ============================================
# Script per aggiungere proxy Flowise a ProtomForms
# ============================================

set -e  # Exit on error

NGINX_CONF="/etc/nginx/sites-enabled/protomforms.conf"
BACKUP_DIR="/etc/nginx/sites-enabled/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/protomforms.conf.backup.${TIMESTAMP}"

echo "🔧 Applicazione proxy Flowise a ProtomForms..."
echo ""

# Crea directory backup se non esiste
mkdir -p "$BACKUP_DIR"

# Crea backup
echo "📦 Creazione backup..."
cp "$NGINX_CONF" "$BACKUP_FILE"
echo "✅ Backup creato: $BACKUP_FILE"
echo ""

# Contenuto da aggiungere
FLOWISE_CONFIG='
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
        add_header '\''Access-Control-Allow-Origin'\'' '\''https://agoexplorer.protom.com'\'' always;
        add_header '\''Access-Control-Allow-Origin'\'' '\''https://agoexplorer.protom.com:8443'\'' always;
        add_header '\''Access-Control-Allow-Methods'\'' '\''GET, POST, PUT, DELETE, PATCH, OPTIONS'\'' always;
        add_header '\''Access-Control-Allow-Headers'\'' '\''Content-Type, Authorization, X-Requested-With'\'' always;
        add_header '\''Access-Control-Allow-Credentials'\'' '\''true'\'' always;
        
        # Handle OPTIONS preflight
        if ($request_method = '\''OPTIONS'\'') {
            add_header '\''Access-Control-Allow-Origin'\'' '\''https://agoexplorer.protom.com'\'';
            add_header '\''Access-Control-Allow-Origin'\'' '\''https://agoexplorer.protom.com:8443'\'';
            add_header '\''Access-Control-Allow-Methods'\'' '\''GET, POST, PUT, DELETE, PATCH, OPTIONS'\'';
            add_header '\''Access-Control-Allow-Headers'\'' '\''Content-Type, Authorization, X-Requested-With'\'';
            add_header '\''Access-Control-Max-Age'\'' 1728000;
            add_header '\''Content-Type'\'' '\''text/plain; charset=utf-8'\'';
            add_header '\''Content-Length'\'' 0;
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
'

# Verifica se la configurazione esiste già
if grep -q "protomforms-flowise/api/v1/" "$NGINX_CONF"; then
    echo "⚠️  La configurazione Flowise è già presente!"
    echo "   Vuoi sovrascriverla? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Operazione annullata."
        exit 0
    fi
    echo "🔄 Rimozione configurazione esistente..."
    # Rimuovi le sezioni esistenti
    sed -i '/# ============================================/,/# FLOWISE PROTOMFORMS - Assets statici/,/^    }$/d' "$NGINX_CONF"
    sed -i '/location \/protomforms-flowise\/assets\//,/^    }$/d' "$NGINX_CONF"
    sed -i '/location \/protomforms-flowise\/static\//,/^    }$/d' "$NGINX_CONF"
fi

# Trova la posizione dove inserire (dopo location /api/ e prima di location /)
echo "🔍 Ricerca posizione per inserire la configurazione..."

# Usa awk per inserire dopo location /api/ e prima di location /
awk -v flowise="$FLOWISE_CONFIG" '
    /location \/api\/ \{/ {
        print
        getline
        while (!/^    \}$/) {
            print
            getline
        }
        print
        print flowise
        next
    }
    { print }
' "$NGINX_CONF" > "${NGINX_CONF}.tmp" && mv "${NGINX_CONF}.tmp" "$NGINX_CONF"

echo "✅ Configurazione aggiunta al file"
echo ""

# Test configurazione nginx
echo "🧪 Test configurazione nginx..."
if nginx -t; then
    echo "✅ Configurazione nginx valida!"
    echo ""
    echo "🔄 Ricarica nginx..."
    systemctl reload nginx
    echo "✅ Nginx ricaricato con successo!"
    echo ""
    echo "🎉 Proxy Flowise configurato correttamente!"
    echo ""
    echo "📍 URL del proxy:"
    echo "   https://agoexplorer.protom.com:8443/protomforms-flowise/api/v1/"
    echo ""
else
    echo "❌ Errore nella configurazione nginx!"
    echo "🔄 Ripristino backup..."
    cp "$BACKUP_FILE" "$NGINX_CONF"
    echo "✅ Backup ripristinato: $BACKUP_FILE"
    exit 1
fi
