#!/usr/bin/env node
/**
 * GitHub Webhook Receiver for Bible Games Auto-Deploy
 *
 * Listens for GitHub push events and triggers deployment.
 *
 * Usage:
 *   node webhook-server.js
 *   # Or via PM2:
 *   pm2 start webhook-server.js --name bible-games-webhook
 *
 * Environment:
 *   WEBHOOK_SECRET - GitHub webhook secret (required)
 *   WEBHOOK_PORT   - Port to listen on (default: 9000)
 */

const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');
const path = require('path');

const PORT = process.env.WEBHOOK_PORT || 9000;
const SECRET = process.env.WEBHOOK_SECRET;
const DEPLOY_SCRIPT = path.join(__dirname, 'update.sh');
const LOG_FILE = '/home/appuser/logs/webhook.log';

// Simple logging
function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  // Also append to log file
  require('fs').appendFileSync(LOG_FILE, line + '\n');
}

// Verify GitHub signature
function verifySignature(payload, signature) {
  if (!SECRET) {
    log('WARNING: No WEBHOOK_SECRET set - skipping signature verification');
    return true;
  }

  if (!signature) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

// Run deployment
function deploy() {
  log('Starting deployment...');

  exec(`cd ${path.dirname(DEPLOY_SCRIPT)} && bash update.sh`, {
    cwd: path.dirname(DEPLOY_SCRIPT),
    env: { ...process.env, PATH: process.env.PATH + ':/usr/local/bin:/usr/bin' }
  }, (error, stdout, stderr) => {
    if (error) {
      log(`Deployment FAILED: ${error.message}`);
      log(`stderr: ${stderr}`);
      return;
    }
    log('Deployment completed successfully');
    log(`Output: ${stdout.slice(-500)}`); // Last 500 chars
  });
}

// Create server
const server = http.createServer((req, res) => {
  // Health check endpoint
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'bible-games-webhook' }));
    return;
  }

  // Status endpoint
  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'bible-games-webhook',
      uptime: process.uptime(),
      hasSecret: !!SECRET
    }));
    return;
  }

  // Only accept POST to /webhook or /
  if (req.method !== 'POST' || (req.url !== '/webhook' && req.url !== '/')) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
    // Limit body size to 1MB
    if (body.length > 1024 * 1024) {
      res.writeHead(413);
      res.end('Payload too large');
      req.destroy();
    }
  });

  req.on('end', () => {
    const signature = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];

    log(`Received ${event || 'unknown'} event from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);

    // Verify signature
    if (!verifySignature(body, signature)) {
      log('Invalid signature - rejecting request');
      res.writeHead(401);
      res.end('Invalid signature');
      return;
    }

    // Parse payload
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (e) {
      log('Invalid JSON payload');
      res.writeHead(400);
      res.end('Invalid JSON');
      return;
    }

    // Handle ping event (GitHub sends this when webhook is first set up)
    if (event === 'ping') {
      log('Received ping from GitHub - webhook is configured correctly');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'pong', message: 'Webhook configured successfully' }));
      return;
    }

    // Only deploy on push to main branch
    if (event === 'push') {
      const branch = payload.ref?.replace('refs/heads/', '');
      const repo = payload.repository?.full_name;

      log(`Push to ${repo}:${branch}`);

      if (branch === 'main') {
        log('Push to main branch detected - triggering deployment');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'deploying', branch }));

        // Trigger deploy asynchronously
        setImmediate(deploy);
      } else {
        log(`Ignoring push to non-main branch: ${branch}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ignored', reason: 'not main branch', branch }));
      }
      return;
    }

    // Ignore other events
    log(`Ignoring event type: ${event}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ignored', event }));
  });
});

server.listen(PORT, '0.0.0.0', () => {
  log(`Webhook server listening on port ${PORT}`);
  log(`Secret configured: ${SECRET ? 'yes' : 'NO (accepting all requests)'}`);
  log(`Deploy script: ${DEPLOY_SCRIPT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down...');
  server.close(() => {
    log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('Received SIGINT, shutting down...');
  server.close(() => {
    log('Server closed');
    process.exit(0);
  });
});
