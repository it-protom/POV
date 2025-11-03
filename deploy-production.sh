#!/bin/bash
# ============================================
# ProtomForms - Production Deployment Script
# Domain: pov.protom.com
# IP: 93.63.117.104
# ============================================

set -e  # Exit on error

echo "🚀 Starting ProtomForms Production Deployment..."
echo "Domain: pov.protom.com"
echo "IP: 93.63.117.104"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "docker-compose.production.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.production.yml not found!${NC}"
    echo "Please run this script from the ProtomForms directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f "env.production.protomforms" ]; then
    echo -e "${YELLOW}⚠️  Warning: env.production.protomforms not found!${NC}"
    echo "Creating from example..."
    cp env.production.protomforms.example env.production.protomforms 2>/dev/null || {
        echo -e "${RED}❌ Please create env.production.protomforms file!${NC}"
        exit 1
    }
fi

# Step 1: Stop existing containers
echo -e "${YELLOW}📦 Step 1: Stopping existing containers...${NC}"
docker-compose -f docker-compose.production.yml down || true

# Step 2: Build images
echo -e "${YELLOW}🔨 Step 2: Building Docker images...${NC}"
docker-compose -f docker-compose.production.yml build --no-cache

# Step 3: Start services
echo -e "${YELLOW}🚀 Step 3: Starting services...${NC}"
docker-compose -f docker-compose.production.yml up -d

# Step 4: Wait for services to be ready
echo -e "${YELLOW}⏳ Step 4: Waiting for services to be ready...${NC}"
sleep 30

# Step 5: Run database migrations
echo -e "${YELLOW}🗄️  Step 5: Running database migrations...${NC}"
docker exec protomforms-backend npx prisma migrate deploy || {
    echo -e "${YELLOW}⚠️  Migrations failed, trying generate...${NC}"
    docker exec protomforms-backend npx prisma generate
}

# Step 6: Generate Prisma client
echo -e "${YELLOW}🔧 Step 6: Generating Prisma client...${NC}"
docker exec protomforms-backend npx prisma generate || true

# Step 7: Check service health
echo -e "${YELLOW}🏥 Step 7: Checking service health...${NC}"
sleep 10

# Check backend
if curl -f http://localhost:3001/api/test > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    docker logs protomforms-backend --tail 50
fi

# Check frontend
if curl -f http://localhost:4004 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
    docker logs protomforms-frontend --tail 50
fi

# Step 8: Show container status
echo -e "${YELLOW}📊 Step 8: Container status:${NC}"
docker-compose -f docker-compose.production.yml ps

echo ""
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo "Access ProtomForms at:"
echo "  - Frontend: https://pov.protom.com"
echo "  - Backend API: https://pov.protom.com/api"
echo ""
echo "To view logs:"
echo "  docker logs -f protomforms-backend"
echo "  docker logs -f protomforms-frontend"
echo ""
echo "To restart services:"
echo "  docker-compose -f docker-compose.production.yml restart"

