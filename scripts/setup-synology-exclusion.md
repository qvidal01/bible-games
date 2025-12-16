# Synology Drive - Exclude .git Folders

To prevent git repository corruption when syncing between devices, you need to exclude `.git` folders from Synology Drive sync.

## Option 1: Synology Drive Client Settings (Recommended)

1. Open **Synology Drive Client** on your Mac/PC
2. Click the **Synology Drive icon** in the menu bar/system tray
3. Click the **gear icon** > **Settings**
4. Go to the **Sync Rules** tab
5. Under **Blacklist**, click **Add**
6. Add these patterns:
   - `.git`
   - `*.git`
   - `.git/**`
7. Click **Apply**

This will prevent all `.git` folders from syncing between devices.

## Option 2: Global Blacklist File

On your Synology NAS, you can create a global blacklist:

```bash
# SSH to your NAS
ssh dunkin@192.168.0.25

# Create/edit the blacklist file
sudo nano /var/packages/SynologyDrive/etc/blacklist.filter

# Add these lines:
.git
*.git
node_modules
```

Then restart Synology Drive:
```bash
sudo synopkg restart SynologyDrive
```

## Option 3: Use Git for Code Sync Instead

Since the bible-games repo now has auto-deploy, you can:

1. **Before leaving a machine:**
   ```bash
   cd ~/projects/bible-games
   git add -A && git commit -m "WIP" && git push
   ```

2. **When arriving at another machine:**
   ```bash
   cd ~/projects/bible-games
   git pull
   ```

3. **Auto-deploy happens automatically** when you push to main!

## Quick Aliases

Add these to your `~/.zshrc` or `~/.bashrc`:

```bash
# Quick save and sync
alias gsync='git add -A && git commit -m "sync: $(date +%Y%m%d-%H%M)" && git push'

# Quick pull
alias gpull='git fetch && git pull'

# Bible games specific
alias bg-save='cd ~/projects/bible-games && gsync'
alias bg-pull='cd ~/projects/bible-games && gpull'
```

## Verification

After setting up exclusion, verify it's working:

1. Make a small change in the repo on Machine A
2. Commit and push: `git add -A && git commit -m "test" && git push`
3. On Machine B, run: `git pull`
4. Both machines should have identical code without sync conflicts

The auto-deploy webhook will also deploy to production automatically!
