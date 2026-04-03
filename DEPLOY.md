# Deployment Guide for Picture Frame App

## Overview

This guide describes the deployment workflow for the Picture Frame application. The main branch will always be the source of truth for deployment.

## Deployment Workflow

1. All development work should happen in feature branches or the stable-version branch
2. Changes should be tested and verified in their respective branches
3. Once changes are ready for deployment, they should be merged into the main branch
4. Deployment should always be done from the main branch

## Deployment Process

### Quick Deployment (Single Command)

This will build the app and start it in production mode:

```bash
# Make sure you're on the main branch
git checkout main

# Pull the latest changes
git pull origin main

# Build and deploy in a single command
npm run deploy
```

### Standard Deployment (Single Express Server - Recommended)

The Express server handles both the API and the frontend on port 5000:

```bash
# Make sure you're on the main branch
git checkout main

# Pull the latest changes
git pull origin main

# Build the app
npm run build

# Start the server
./start.sh
```

Access the app at `http://<your-ip>:5000`

### Dual Server Deployment (Express + Serve)

If you prefer separate servers for API and frontend:

```bash
./start.sh --serve
```

This starts Express on port 5000 (API) and serve on port 3000 (frontend).

### Testing Network Access

To verify network access:

```bash
npm run network
```

## Automatic Deployment (Raspberry Pi / Linux)

### 1. Create the systemd service file

```bash
sudo nano /etc/systemd/system/pictureframe.service
```

Add the following content (adjust username and paths):

```ini
[Unit]
Description=Picture Frame Application
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/pictureframe
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=NODE_ENV=production
ExecStart=/usr/bin/bash /home/pi/pictureframe/start.sh
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**If you installed Node.js via nvm**, use this instead for ExecStart:

```ini
ExecStart=/bin/bash -c 'source /home/pi/.nvm/nvm.sh && /home/pi/pictureframe/start.sh'
```

### 2. Enable and start the service

```bash
sudo systemctl daemon-reload
sudo systemctl enable pictureframe.service
sudo systemctl start pictureframe.service
```

### 3. Check it's running

```bash
sudo systemctl status pictureframe.service
```

### 4. View logs if something goes wrong

```bash
sudo journalctl -u pictureframe.service -f
```

## Kiosk Mode (Auto-launch Chromium)

To automatically open the slideshow in fullscreen on the Pi's screen:

### Option A: Desktop autostart (Raspberry Pi OS with desktop)

```bash
mkdir -p ~/.config/autostart
nano ~/.config/autostart/pictureframe-kiosk.desktop
```

```ini
[Desktop Entry]
Type=Application
Name=Picture Frame Kiosk
Exec=chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:5000
```

### Option B: Disable screen blanking

```bash
sudo nano /etc/xdg/lxsession/LXDE-pi/autostart
```

Add these lines:

```
@xset s off
@xset -dpms
@xset s noblank
```

## Troubleshooting Deployment Issues

If the application fails to start after deployment:

1. Check the service logs:
```bash
sudo journalctl -u pictureframe.service --no-pager -n 50
```

2. Check if node is accessible:
```bash
which node
node --version
```

3. Check for broken upload directory links:
```bash
ls -la build/uploads
```

4. Rebuild and restart:
```bash
npm run build
sudo systemctl restart pictureframe.service
```

## Rolling Back a Deployment

If a deployment causes issues:

```bash
# Find the commit hash of the last working version
git log --oneline

# Reset to that version
git checkout main
git reset --hard <commit-hash>

# Rebuild and restart
npm run build
sudo systemctl restart pictureframe.service
```

## Updating

Use the update script to pull the latest code while preserving your uploads and settings:

```bash
./update.sh
sudo systemctl restart pictureframe.service
```
