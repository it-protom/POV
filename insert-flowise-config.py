#!/usr/bin/env python3
"""
Script per inserire la configurazione Flowise in protomforms.conf
"""

nginx_conf = "/etc/nginx/sites-enabled/protomforms.conf"

# Configurazione Flowise da inserire
flowise_config = """    # ============================================
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

"""

# Leggi il file
with open(nginx_conf, 'r') as f:
    content = f.read()

# Verifica se già presente
if 'protomforms-flowise/api/v1/' in content:
    print("⚠️  La configurazione Flowise è già presente!")
    exit(1)

# Trova la posizione: dopo "location /api/" e prima di "location /"
# Pattern: cerca la chiusura di location /api/ e inserisci prima del commento "# ProtomForms - Main Application"
import re

# Pattern per trovare la fine di location /api/ e l'inizio di location /
pattern = r'(    location /api/.*?\n    \})\n\n    # ============================================\n    # ProtomForms - Main Application)'

replacement = r'\1\n\n' + flowise_config + r'    # ============================================\n    # ProtomForms - Main Application'

if re.search(pattern, content, re.DOTALL):
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
else:
    # Fallback: inserisci dopo location /api/ e prima di location /
    pattern2 = r'(    location /api/.*?\n    \})'
    replacement2 = r'\1\n\n' + flowise_config
    new_content = re.sub(pattern2, replacement2, content, flags=re.DOTALL)

# Scrivi il nuovo contenuto
with open(nginx_conf, 'w') as f:
    f.write(new_content)

print("✅ Configurazione Flowise inserita con successo!")

