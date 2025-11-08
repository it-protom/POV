#!/bin/bash
# ============================================
# Script per estrarre i tarball e fare il deploy
# ============================================

set -e  # Exit on error

echo "============================================"
echo "ProtomForms - Extract and Deploy from Tarballs"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directory di lavoro
WORK_DIR="/home/protom/protomforms"
BACKUP_DIR="/home/protom/protomforms-backup-$(date +%Y%m%d_%H%M%S)"

# Verifica che i tarball esistano
echo -e "${YELLOW}Verifica tarball...${NC}"
for tar_file in protomforms-backend.tar protomforms-frontend.tar protomforms-config.tar; do
    if [ ! -f "$tar_file" ]; then
        echo -e "${RED}Errore: $tar_file non trovato!${NC}"
        exit 1
    fi
done
echo -e "${GREEN}Tutti i tarball trovati${NC}"
echo ""

# Crea directory di lavoro se non esiste
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

# Backup del database se esiste
echo -e "${YELLOW}Backup configurazione esistente...${NC}"
if [ -d "$WORK_DIR" ] && [ "$(ls -A $WORK_DIR 2>/dev/null)" ]; then
    echo "Fermo container esistenti..."
    cd "$WORK_DIR"
    docker-compose -f docker-compose.production.yml down 2>/dev/null || true
    
    # Backup database volume se esiste
    if docker volume ls | grep -q protomforms_postgres_data; then
        echo "Backup database volume..."
        mkdir -p "$BACKUP_DIR"
        docker run --rm \
            -v protomforms_postgres_data:/data \
            -v "$BACKUP_DIR":/backup \
            ubuntu tar czf /backup/postgres-backup.tar.gz /data || true
        echo -e "${GREEN}Backup database completato${NC}"
    fi
fi
echo ""

# Estrai i tarball
echo -e "${YELLOW}Estrai tarball...${NC}"

# Backend
echo "Estrai backend..."
tar -xzf "$WORK_DIR/../protomforms-backend.tar" -C "$WORK_DIR/" 2>/dev/null || \
    tar -xzf "/root/protomforms-backend.tar" -C "$WORK_DIR/" 2>/dev/null || \
    tar -xzf "./protomforms-backend.tar" -C "$WORK_DIR/"
echo -e "${GREEN}Backend estratto${NC}"

# Frontend
echo "Estrai frontend..."
tar -xzf "$WORK_DIR/../protomforms-frontend.tar" -C "$WORK_DIR/" 2>/dev/null || \
    tar -xzf "/root/protomforms-frontend.tar" -C "$WORK_DIR/" 2>/dev/null || \
    tar -xzf "./protomforms-frontend.tar" -C "$WORK_DIR/"
echo -e "${GREEN}Frontend estratto${NC}"

# Config
echo "Estrai configurazione..."
tar -xzf "$WORK_DIR/../protomforms-config.tar" -C "$WORK_DIR/" 2>/dev/null || \
    tar -xzf "/root/protomforms-config.tar" -C "$WORK_DIR/" 2>/dev/null || \
    tar -xzf "./protomforms-config.tar" -C "$WORK_DIR/"
echo -e "${GREEN}Configurazione estratta${NC}"
echo ""

# Verifica env file
if [ ! -f "$WORK_DIR/env.production.protomforms" ]; then
    echo -e "${YELLOW}env.production.protomforms non trovato, copio da example...${NC}"
    cp "$WORK_DIR/env.production.protomforms.example" "$WORK_DIR/env.production.protomforms"
    echo -e "${RED}IMPORTANTE: Modifica env.production.protomforms con i valori corretti!${NC}"
fi

# Restore database se esiste backup
if [ -f "$BACKUP_DIR/postgres-backup.tar.gz" ]; then
    echo -e "${YELLOW}Restore database dal backup...${NC}"
    # Questo verrà fatto dopo che il container postgres è avviato
    RESTORE_DB=true
else
    RESTORE_DB=false
fi

# Deploy
cd "$WORK_DIR"
echo -e "${YELLOW}Avvio deploy...${NC}"
chmod +x deploy-production.sh
./deploy-production.sh

# Restore database se necessario
if [ "$RESTORE_DB" = true ]; then
    echo -e "${YELLOW}Attendo che postgres sia pronto...${NC}"
    sleep 30
    
    echo "Restore database..."
    docker run --rm \
        -v protomforms_postgres_data:/data \
        -v "$BACKUP_DIR":/backup \
        ubuntu tar xzf /backup/postgres-backup.tar.gz -C /
    echo -e "${GREEN}Database restore completato${NC}"
    
    # Riavvia backend per applicare il database
    echo "Riavvio backend..."
    docker-compose -f docker-compose.production.yml restart protomforms-backend
fi

echo ""
echo -e "${GREEN}============================================"
echo "Deploy completato con successo!"
echo "============================================${NC}"
echo ""
echo "Frontend: https://pov.protom.com"
echo "Backend API: https://pov.protom.com/api"
echo ""






