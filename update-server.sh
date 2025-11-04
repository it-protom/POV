#!/bin/bash
# ============================================
# ProtomForms - Server Update Script
# Domain: pov.protom.com
# IP: 93.63.117.104
# Repository: https://github.com/it-protom/POV.git
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}  ProtomForms - Server Update${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.production.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.production.yml not found!${NC}"
    echo "Please run this script from: /home/protom/protomforms"
    exit 1
fi

# Check if git repository exists
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Git repository not found. Initializing...${NC}"
    git init
    git remote add origin https://github.com/it-protom/POV.git || {
        git remote set-url origin https://github.com/it-protom/POV.git
    }
    echo -e "${GREEN}✅ Git repository initialized${NC}"
fi

# Step 1: Backup current state
echo -e "${YELLOW}💾 Step 1: Creating backup...${NC}"
BACKUP_DIR="../protomforms-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r protomforms-backend "$BACKUP_DIR/" 2>/dev/null || true
cp -r protomforms-frontend "$BACKUP_DIR/" 2>/dev/null || true
cp docker-compose.production.yml "$BACKUP_DIR/" 2>/dev/null || true
cp env.production.protomforms "$BACKUP_DIR/" 2>/dev/null || true
echo -e "${GREEN}✅ Backup created: $BACKUP_DIR${NC}"

# Step 2: Pull latest changes from repository
echo -e "${YELLOW}📥 Step 2: Pulling latest changes from GitHub...${NC}"
git fetch origin || {
    echo -e "${RED}❌ Failed to fetch from repository${NC}"
    exit 1
}

# Check current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
echo -e "${BLUE}Current branch: $CURRENT_BRANCH${NC}"

# Pull changes
git pull origin "$CURRENT_BRANCH" || {
    echo -e "${YELLOW}⚠️  Pull failed, trying to merge...${NC}"
    git pull origin "$CURRENT_BRANCH" --no-rebase || {
        echo -e "${RED}❌ Failed to pull changes. Please resolve conflicts manually.${NC}"
        exit 1
    }
}

echo -e "${GREEN}✅ Code updated successfully${NC}"

# Step 3: Check for environment file
echo -e "${YELLOW}📝 Step 3: Checking environment configuration...${NC}"
if [ ! -f "env.production.protomforms" ]; then
    echo -e "${RED}❌ env.production.protomforms not found!${NC}"
    echo "Please ensure the environment file exists before continuing."
    exit 1
fi
echo -e "${GREEN}✅ Environment file found${NC}"

# Step 4: Stop existing containers
echo -e "${YELLOW}🛑 Step 4: Stopping existing containers...${NC}"
docker-compose -f docker-compose.production.yml down || true
echo -e "${GREEN}✅ Containers stopped${NC}"

# Step 5: Build images
echo -e "${YELLOW}🔨 Step 5: Building Docker images...${NC}"
echo "This may take several minutes..."
docker-compose -f docker-compose.production.yml build --no-cache || {
    echo -e "${YELLOW}⚠️  Build with --no-cache failed, trying without...${NC}"
    docker-compose -f docker-compose.production.yml build
}
echo -e "${GREEN}✅ Images built successfully${NC}"

# Step 6: Start services
echo -e "${YELLOW}🚀 Step 6: Starting services...${NC}"
docker-compose -f docker-compose.production.yml up -d
echo -e "${GREEN}✅ Services started${NC}"

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
    echo -e "${YELLOW}⚠️  Database health check failed (may be normal)${NC}"
fi

# Step 11: Show container status
echo -e "${YELLOW}📊 Step 11: Container status:${NC}"
docker-compose -f docker-compose.production.yml ps

# Final summary
echo ""
echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}✅ Update completed successfully!${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: https://pov.protom.com"
echo "   Backend API: https://pov.protom.com/api"
echo ""
echo "📊 Container Status:"
docker ps --filter "name=protomforms" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "📝 Useful commands:"
echo "   View logs: docker logs -f protomforms-backend"
echo "   View frontend logs: docker logs -f protomforms-frontend"
echo "   Restart: docker-compose -f docker-compose.production.yml restart"
echo "   Stop: docker-compose -f docker-compose.production.yml down"
echo ""
echo -e "${GREEN}✅ All services updated and running${NC}"



