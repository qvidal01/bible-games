#!/bin/bash
# Bible Games Deployment Script
# Deploys the bible-games monorepo to production

set -e

# Configuration
APP_NAME="bible-games"
APP_DIR="/home/appuser/projects/bible-games"
BACKUP_DIR="/home/appuser/backups"
REPO_URL="https://github.com/qvidal01/bible-games.git"
BRANCH="${1:-main}"
LOG_DIR="/home/appuser/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

# Create necessary directories
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

log "Starting deployment of $APP_NAME (branch: $BRANCH)"

# Check if this is first deployment or update
if [ -d "$APP_DIR" ]; then
    log "Existing installation found. Creating backup..."
    BACKUP_FILE="$BACKUP_DIR/${APP_NAME}_$(date +%Y%m%d_%H%M%S).tar.gz"

    # Backup .env.local and current build
    tar -czf "$BACKUP_FILE" \
        -C "$(dirname $APP_DIR)" \
        --exclude='node_modules' \
        --exclude='.next/cache' \
        "$(basename $APP_DIR)" 2>/dev/null || warn "Backup creation had warnings"

    log "Backup created: $BACKUP_FILE"

    # Keep only last 5 backups
    ls -t "$BACKUP_DIR"/${APP_NAME}_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f

    log "Pulling latest changes..."
    cd "$APP_DIR"
    git fetch origin
    git checkout "$BRANCH"
    git reset --hard "origin/$BRANCH"
else
    log "Fresh installation. Cloning repository..."
    git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# Copy .env.local if it exists in backup but not in current
ENV_FILE="$APP_DIR/apps/web/.env.local"
if [ ! -f "$ENV_FILE" ]; then
    if [ -f "/home/appuser/.env.bible-games" ]; then
        log "Copying environment file..."
        cp "/home/appuser/.env.bible-games" "$ENV_FILE"
    else
        warn "No .env.local found! Please create one at $ENV_FILE"
        warn "Required variables: PUSHER_APP_ID, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_KEY, NEXT_PUBLIC_PUSHER_CLUSTER"
    fi
fi

# Install dependencies
log "Installing dependencies..."
cd "$APP_DIR"
npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# Build the application
log "Building application..."
cd "$APP_DIR"
npm run build --workspace @bible-games/web

# Deploy PM2 process
log "Deploying to PM2..."
cd "$APP_DIR/deploy"

# Check if process exists
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
    log "Reloading existing PM2 process..."
    pm2 reload ecosystem.config.js --update-env
else
    log "Starting new PM2 process..."
    pm2 start ecosystem.config.js
fi

# Save PM2 process list
pm2 save

# Verify deployment
log "Verifying deployment..."
sleep 3

if pm2 describe "$APP_NAME" | grep -q "online"; then
    log "Deployment successful!"
    pm2 show "$APP_NAME"
else
    error "Deployment verification failed! Check logs at $LOG_DIR"
fi

log "Deployment complete!"
echo ""
echo "Useful commands:"
echo "  pm2 logs $APP_NAME     - View logs"
echo "  pm2 status             - Check status"
echo "  pm2 restart $APP_NAME  - Restart app"
echo "  pm2 monit              - Monitor resources"
