#!/bin/bash
# ============================================
# Script to copy ProtomForms files to server
# Usage: ./copy-to-server.sh user@server
# ============================================

if [ -z "$1" ]; then
    echo "Usage: ./copy-to-server.sh user@server"
    echo "Example: ./copy-to-server.sh root@93.63.117.104"
    exit 1
fi

SERVER="$1"
REMOTE_DIR="/home/protom/protomforms"

echo "📦 Copying ProtomForms files to server..."
echo "Server: $SERVER"
echo "Remote directory: $REMOTE_DIR"
echo ""

# Create remote directory if it doesn't exist
ssh "$SERVER" "mkdir -p $REMOTE_DIR"

# Copy necessary files
echo "Copying docker-compose.production.yml..."
scp docker-compose.production.yml "$SERVER:$REMOTE_DIR/"

echo "Copying nginx-pov-protom.conf..."
scp nginx-pov-protom.conf "$SERVER:$REMOTE_DIR/"

echo "Copying env.production.protomforms.example..."
scp env.production.protomforms.example "$SERVER:$REMOTE_DIR/"

echo "Copying deploy-complete.sh..."
scp deploy-complete.sh "$SERVER:$REMOTE_DIR/"
ssh "$SERVER" "chmod +x $REMOTE_DIR/deploy-complete.sh"

echo "Copying protomforms-backend..."
scp -r protomforms-backend "$SERVER:$REMOTE_DIR/" --exclude=node_modules --exclude=.next

echo "Copying protomforms-frontend..."
scp -r protomforms-frontend "$SERVER:$REMOTE_DIR/" --exclude=node_modules --exclude=build

echo ""
echo "✅ Files copied successfully!"
echo ""
echo "Next steps on server:"
echo "1. SSH to server: ssh $SERVER"
echo "2. cd $REMOTE_DIR"
echo "3. Run: sudo ./deploy-complete.sh"

