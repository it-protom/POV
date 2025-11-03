#!/bin/bash
# ============================================
# ProtomForms - NGINX Setup Script
# Domain: pov.protom.com
# ============================================

set -e

echo "🔧 Setting up NGINX for ProtomForms (pov.protom.com)..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (sudo)${NC}"
    exit 1
fi

# Check if nginx-pov-protom.conf exists
if [ ! -f "nginx-pov-protom.conf" ]; then
    echo -e "${RED}❌ nginx-pov-protom.conf not found!${NC}"
    exit 1
fi

# Backup existing config if it exists
if [ -f "/etc/nginx/sites-available/pov-protom.conf" ]; then
    echo -e "${YELLOW}⚠️  Backing up existing config...${NC}"
    cp /etc/nginx/sites-available/pov-protom.conf /etc/nginx/sites-available/pov-protom.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# Copy configuration
echo "📋 Copying NGINX configuration..."
cp nginx-pov-protom.conf /etc/nginx/sites-available/pov-protom.conf

# Create symlink if it doesn't exist
if [ ! -L "/etc/nginx/sites-enabled/pov-protom.conf" ]; then
    echo "🔗 Creating symlink..."
    ln -s /etc/nginx/sites-available/pov-protom.conf /etc/nginx/sites-enabled/pov-protom.conf
fi

# Test NGINX configuration
echo "🧪 Testing NGINX configuration..."
if nginx -t; then
    echo -e "${GREEN}✅ NGINX configuration is valid${NC}"
else
    echo -e "${RED}❌ NGINX configuration test failed!${NC}"
    exit 1
fi

# Reload NGINX
echo "🔄 Reloading NGINX..."
systemctl reload nginx

echo ""
echo -e "${GREEN}✅ NGINX setup completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Get SSL certificate:"
echo "   certbot --nginx -d pov.protom.com"
echo ""
echo "2. Verify configuration:"
echo "   nginx -t"
echo ""
echo "3. Check NGINX status:"
echo "   systemctl status nginx"

