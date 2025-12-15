#!/bin/bash
# Bible Games Rollback Script
# Rolls back to a previous deployment

set -e

APP_NAME="bible-games"
APP_DIR="/home/appuser/projects/bible-games"
BACKUP_DIR="/home/appuser/backups"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; exit 1; }

# List available backups
if [ "$1" == "list" ] || [ -z "$1" ]; then
    echo "Available backups:"
    echo "=================="
    ls -lht "$BACKUP_DIR"/${APP_NAME}_*.tar.gz 2>/dev/null | awk '{print NR". "$9" ("$5", "$6" "$7" "$8")"}' || echo "No backups found"
    echo ""
    echo "Usage: $0 <backup_number>"
    echo "       $0 list"
    exit 0
fi

# Get backup file by number
BACKUP_FILE=$(ls -t "$BACKUP_DIR"/${APP_NAME}_*.tar.gz 2>/dev/null | sed -n "${1}p")

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
    error "Backup #$1 not found"
fi

log "Rolling back to: $BACKUP_FILE"

# Stop the application
log "Stopping application..."
pm2 stop "$APP_NAME" || warn "Application was not running"

# Backup current .env.local
if [ -f "$APP_DIR/apps/web/.env.local" ]; then
    cp "$APP_DIR/apps/web/.env.local" "/tmp/.env.local.backup"
fi

# Remove current deployment
log "Removing current deployment..."
rm -rf "$APP_DIR"

# Restore backup
log "Restoring backup..."
cd /home/appuser/projects
tar -xzf "$BACKUP_FILE"

# Restore .env.local
if [ -f "/tmp/.env.local.backup" ]; then
    cp "/tmp/.env.local.backup" "$APP_DIR/apps/web/.env.local"
    rm "/tmp/.env.local.backup"
fi

# Rebuild (backup might not have node_modules)
log "Installing dependencies..."
cd "$APP_DIR"
npm ci --omit=dev 2>/dev/null || npm install --omit=dev

log "Building application..."
npm run build --workspace @bible-games/web

# Restart the application
log "Starting application..."
pm2 restart "$APP_NAME" || pm2 start "$APP_DIR/deploy/ecosystem.config.js"
pm2 save

log "Rollback complete!"
