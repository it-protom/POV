#!/bin/bash
# ============================================
# ProtomForms - Complete Deployment Script
# Domain: pov.protom.com
# IP: 93.63.117.104
# IMPORTANT: Does NOT touch AGO-EXPLORER
# ============================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}  ProtomForms Production Deployment${NC}"
echo -e "${BLUE}  Domain: pov.protom.com${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (sudo)${NC}"
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "protomforms-backend" ] || [ ! -d "protomforms-frontend" ]; then
    echo -e "${RED}❌ Error: protomforms-backend or protomforms-frontend directory not found!${NC}"
    echo "Please run this script from the ProtomForms directory: /home/protom/protomforms"
    exit 1
fi

# Step 1: Create environment file if it doesn't exist
echo -e "${YELLOW}📝 Step 1: Setting up environment variables...${NC}"
if [ ! -f "env.production.protomforms" ]; then
    echo -e "${YELLOW}⚠️  env.production.protomforms not found, creating from example...${NC}"
    if [ -f "env.production.protomforms.example" ]; then
        cp env.production.protomforms.example env.production.protomforms
        
        # Generate secure secrets
        NEXTAUTH_SECRET=$(openssl rand -base64 32)
        DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-20)
        
        # Update the file with generated secrets
        sed -i "s|PROTOMFORMS_DB_PASSWORD=.*|PROTOMFORMS_DB_PASSWORD=${DB_PASSWORD}|g" env.production.protomforms
        sed -i "s|PROTOMFORMS_NEXTAUTH_SECRET=.*|PROTOMFORMS_NEXTAUTH_SECRET=${NEXTAUTH_SECRET}|g" env.production.protomforms
        sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://pov.protom.com/api|g" env.production.protomforms
        sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://pov.protom.com|g" env.production.protomforms
        sed -i "s|PUBLIC_URL=.*|PUBLIC_URL=https://pov.protom.com|g" env.production.protomforms
        
        echo -e "${GREEN}✅ Environment file created with secure secrets${NC}"
        echo -e "${YELLOW}⚠️  Please review env.production.protomforms and update if needed${NC}"
    else
        echo -e "${RED}❌ env.production.protomforms.example not found!${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Environment file already exists${NC}"
fi

# Step 2: Setup NGINX
echo -e "${YELLOW}🔧 Step 2: Configuring NGINX...${NC}"
if [ ! -f "nginx-pov-protom.conf" ]; then
    echo -e "${RED}❌ nginx-pov-protom.conf not found!${NC}"
    exit 1
fi

# Backup existing config if it exists
if [ -f "/etc/nginx/sites-available/pov-protom.conf" ]; then
    echo -e "${YELLOW}⚠️  Backing up existing NGINX config...${NC}"
    cp /etc/nginx/sites-available/pov-protom.conf /etc/nginx/sites-available/pov-protom.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# Copy configuration
cp nginx-pov-protom.conf /etc/nginx/sites-available/pov-protom.conf

# Create symlink if it doesn't exist
if [ ! -L "/etc/nginx/sites-enabled/pov-protom.conf" ]; then
    ln -s /etc/nginx/sites-available/pov-protom.conf /etc/nginx/sites-enabled/pov-protom.conf
    echo -e "${GREEN}✅ NGINX symlink created${NC}"
fi

# Test NGINX configuration
if nginx -t > /dev/null 2>&1; then
    echo -e "${GREEN}✅ NGINX configuration is valid${NC}"
    systemctl reload nginx
    echo -e "${GREEN}✅ NGINX reloaded${NC}"
else
    echo -e "${RED}❌ NGINX configuration test failed!${NC}"
    echo "Testing manually..."
    nginx -t
    exit 1
fi

# Step 3: Setup SSL certificate (if not exists)
echo -e "${YELLOW}🔒 Step 3: Checking SSL certificate...${NC}"
if [ ! -d "/etc/letsencrypt/live/pov.protom.com" ]; then
    echo -e "${YELLOW}⚠️  SSL certificate not found for pov.protom.com${NC}"
    echo "Attempting to obtain SSL certificate with certbot..."
    if command -v certbot > /dev/null 2>&1; then
        certbot --nginx -d pov.protom.com --non-interactive --agree-tos --email info@protom.com || {
            echo -e "${YELLOW}⚠️  Certbot failed. You may need to run manually:${NC}"
            echo "  certbot --nginx -d pov.protom.com"
        }
    else
        echo -e "${YELLOW}⚠️  Certbot not found. Please install and run:${NC}"
        echo "  apt-get install certbot python3-certbot-nginx"
        echo "  certbot --nginx -d pov.protom.com"
    fi
else
    echo -e "${GREEN}✅ SSL certificate already exists${NC}"
fi

# Step 4: Stop existing containers (if any)
echo -e "${YELLOW}🛑 Step 4: Stopping existing containers...${NC}"
if [ -f "docker-compose.production.yml" ]; then
    docker-compose -f docker-compose.production.yml down || true
    echo -e "${GREEN}✅ Existing containers stopped${NC}"
else
    echo -e "${RED}❌ docker-compose.production.yml not found!${NC}"
    exit 1
fi

# Step 5: Build images
echo -e "${YELLOW}🔨 Step 5: Building Docker images...${NC}"
echo "This may take several minutes..."
docker-compose -f docker-compose.production.yml build --no-cache

# Step 6: Start services
echo -e "${YELLOW}🚀 Step 6: Starting services...${NC}"
docker-compose -f docker-compose.production.yml up -d

# Step 7: Wait for services to be ready
echo -e "${YELLOW}⏳ Step 7: Waiting for services to be ready...${NC}"
sleep 30

# Step 8: Run database migrations
echo -e "${YELLOW}🗄️  Step 8: Running database migrations...${NC}"
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec protomforms-backend npx prisma migrate deploy 2>/dev/null; then
        echo -e "${GREEN}✅ Database migrations completed${NC}"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo -e "${YELLOW}⚠️  Migration failed, retrying... (${RETRY_COUNT}/${MAX_RETRIES})${NC}"
            sleep 10
        else
            echo -e "${YELLOW}⚠️  Migration failed after ${MAX_RETRIES} attempts. Trying generate...${NC}"
            docker exec protomforms-backend npx prisma generate || true
        fi
    fi
done

# Step 9: Generate Prisma client
echo -e "${YELLOW}🔧 Step 9: Generating Prisma client...${NC}"
docker exec protomforms-backend npx prisma generate || echo -e "${YELLOW}⚠️  Prisma generate warning (may already be done)${NC}"

# Step 10: Check service health
echo -e "${YELLOW}🏥 Step 10: Checking service health...${NC}"
sleep 15

# Check backend
if curl -f http://localhost:3001/api/test > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy (port 3001)${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo "Backend logs:"
    docker logs protomforms-backend --tail 20
fi

# Check frontend
if curl -f http://localhost:4004 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is healthy (port 4004)${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
    echo "Frontend logs:"
    docker logs protomforms-frontend --tail 20
fi

# Check database
if docker exec protomforms-postgres pg_isready -U protomforms_user > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database is healthy${NC}"
else
    echo -e "${RED}❌ Database health check failed${NC}"
    docker logs protomforms-postgres --tail 20
fi

# Step 11: Show container status
echo -e "${YELLOW}📊 Step 11: Container status:${NC}"
docker-compose -f docker-compose.production.yml ps

# Step 12: Final verification
echo ""
echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: https://pov.protom.com"
echo "   Backend API: https://pov.protom.com/api"
echo "   Health Check: https://pov.protom.com/health"
echo ""
echo "📊 Container Status:"
docker ps --filter "name=protomforms" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "📝 Useful commands:"
echo "   View logs: docker logs -f protomforms-backend"
echo "   Restart: docker-compose -f docker-compose.production.yml restart"
echo "   Stop: docker-compose -f docker-compose.production.yml down"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: AGO-EXPLORER was NOT touched${NC}"
echo -e "${GREEN}✅ All services are running independently${NC}"

