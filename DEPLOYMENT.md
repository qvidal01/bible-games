# Bible Games - Deployment Guide

## Overview

Bible Games is deployed on Proxmox LXC container 350 (`bible-games`) at IP `192.168.0.52`.

| Component | Value |
|-----------|-------|
| **Host** | proxmain (192.168.0.165) |
| **Container ID** | 350 |
| **Container IP** | 192.168.0.52 |
| **Container Name** | bible-games |
| **App User** | appuser |
| **App Directory** | /home/appuser/projects/bible-games |
| **Process Manager** | PM2 |
| **Node.js** | v20.x |
| **Port** | 3000 |

## Quick Commands

### From Development Machine

```bash
# Deploy latest changes
ssh dunkin@192.168.0.165 "sudo pct exec 350 -- su - appuser -c 'cd /home/appuser/projects/bible-games && ./deploy/update.sh'"

# Full deployment (with dependency install)
ssh dunkin@192.168.0.165 "sudo pct exec 350 -- su - appuser -c '/home/appuser/projects/bible-games/deploy/deploy.sh'"

# Check status
ssh dunkin@192.168.0.165 "sudo pct exec 350 -- su - appuser -c 'pm2 status'"

# View logs
ssh dunkin@192.168.0.165 "sudo pct exec 350 -- su - appuser -c 'pm2 logs bible-games --lines 50'"

# Restart app
ssh dunkin@192.168.0.165 "sudo pct exec 350 -- su - appuser -c 'pm2 restart bible-games'"
```

### From Container (as appuser)

```bash
# Quick update (git pull + rebuild + reload)
./deploy/update.sh

# Full deployment
./deploy/deploy.sh

# Rollback
./deploy/rollback.sh list      # List available backups
./deploy/rollback.sh 1         # Rollback to most recent backup

# PM2 commands
pm2 status                     # Check status
pm2 logs bible-games           # View logs
pm2 restart bible-games        # Restart
pm2 reload bible-games         # Zero-downtime reload
pm2 monit                      # Resource monitoring
```

## Deployment Scripts

### `deploy/deploy.sh`
Full deployment script that:
- Creates timestamped backup
- Pulls latest code from GitHub
- Installs dependencies
- Builds the application
- Reloads PM2 process
- Keeps last 5 backups

```bash
./deploy/deploy.sh [branch]    # Default: main
```

### `deploy/update.sh`
Quick update for simple changes (no dependency updates):
- Git pull
- Rebuild
- PM2 reload

```bash
./deploy/update.sh
```

### `deploy/rollback.sh`
Rollback to a previous deployment:

```bash
./deploy/rollback.sh list      # List backups
./deploy/rollback.sh 1         # Rollback to backup #1
```

## Environment Configuration

Environment file location: `/home/appuser/projects/bible-games/apps/web/.env.local`

### Required Variables

```env
# Pusher (real-time features)
PUSHER_APP_ID=your_app_id
PUSHER_SECRET=your_secret
NEXT_PUBLIC_PUSHER_KEY=your_public_key
NEXT_PUBLIC_PUSHER_CLUSTER=us2

# Optional: Rate limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

### Backup Environment Template

A backup of the env file is kept at: `/home/appuser/.env.bible-games`

## Architecture

```
bible-games/
├── apps/
│   └── web/                    # Next.js 16 application
│       ├── src/
│       │   ├── app/
│       │   │   ├── jeopardy/   # Bible Jeopardy game
│       │   │   ├── family-feud/# Bible Family Feud game
│       │   │   └── api/        # API routes (rooms, game, pusher)
│       │   └── shared/         # Shared components & utilities
│       └── .env.local          # Environment configuration
├── packages/                   # Shared packages (reserved)
├── deploy/
│   ├── ecosystem.config.js     # PM2 configuration
│   ├── deploy.sh               # Full deployment script
│   ├── update.sh               # Quick update script
│   └── rollback.sh             # Rollback script
└── turbo.json                  # Turborepo configuration
```

## Logs

| Log | Location |
|-----|----------|
| App output | `/home/appuser/logs/bible-games-out.log` |
| App errors | `/home/appuser/logs/bible-games-error.log` |
| PM2 logs | `pm2 logs bible-games` |

## Monitoring

```bash
# PM2 monitoring dashboard
pm2 monit

# Check memory/CPU
pm2 show bible-games

# Container resources
htop
```

## Troubleshooting

### App won't start

1. Check logs: `pm2 logs bible-games --lines 100`
2. Verify .env.local exists and has all required variables
3. Check if port 3000 is available: `netstat -tlnp | grep 3000`
4. Try manual start: `cd apps/web && npm run start`

### Build fails

1. Check Node.js version: `node --version` (should be 20.x)
2. Clear cache: `rm -rf apps/web/.next node_modules/.cache`
3. Reinstall: `rm -rf node_modules && npm install`

### Real-time features not working

1. Verify Pusher credentials in .env.local
2. Check browser console for WebSocket errors
3. Test Pusher connection: Check PM2 logs for Pusher-related errors

### Rollback procedure

```bash
# List available backups
./deploy/rollback.sh list

# Rollback to most recent
./deploy/rollback.sh 1
```

## CI/CD Integration (Future)

For automated deployments, add GitHub Actions workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PROXMOX_HOST }}
          username: dunkin
          key: ${{ secrets.SSH_KEY }}
          script: |
            sudo pct exec 350 -- su - appuser -c '/home/appuser/projects/bible-games/deploy/update.sh'
```

## Cloudflare Tunnel

The app is exposed via Cloudflare Tunnel. Configuration is managed through:
- Tunnel: `915fd3b4-98e8-42fd-bc1d-c5f72482dafc`
- Domain: `biblegames.aiqso.io` (or similar)

To update tunnel routing, modify the tunnel config on the Cloudflare dashboard or via `cloudflared`.

## Maintenance

### Weekly
- Check disk space: `df -h`
- Review logs for errors
- Update dependencies if security patches available

### Monthly
- Prune old backups beyond 5
- Review and rotate Pusher credentials if needed
- Check for Node.js LTS updates

## Contact

- **Repository**: https://github.com/qvidal01/bible-games
- **Maintainer**: Quinn Vidal
