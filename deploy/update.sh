#!/bin/bash
# Bible Games Quick Update Script
# For quick updates when no dependency changes

set -e

APP_NAME="bible-games"
APP_DIR="/home/appuser/projects/bible-games"

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }

cd "$APP_DIR"

log "Pulling latest changes..."
git pull origin main

log "Rebuilding application..."
npm run build --workspace @bible-games/web

log "Reloading PM2 process..."
pm2 reload "$APP_NAME"

log "Update complete!"
pm2 show "$APP_NAME" | head -20
