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

### Standard Deployment (Dual Server Mode - Recommended)

This will start:
- Express server on port 5000 for the API
- Static serve on port 3000 for the frontend

```bash
# Make sure you're on the main branch
git checkout main

# Pull the latest changes
git pull origin main

# Start both servers (frontend on port 3000, backend on port 5000)
npm run production
```

### Single Server Deployment (Express Only - Not Recommended)

This uses only the Express server for both API and static files (only use if dual server mode is not working):

```bash
# Make sure you're on the main branch
git checkout main

# Pull the latest changes
git pull origin main

# Start with single server mode (Express only)
npm run express-only
```

### Testing Network Access

To verify network access:

```bash
npm run network
```

## Automatic Deployment

For automatic deployment on boot (e.g., on a Raspberry Pi), follow these steps:

1. Create a systemd service file:

```bash
sudo nano /etc/systemd/system/pictureframe.service
```

2. Add the following content (adjust paths as needed):

```ini
[Unit]
Description=Picture Frame Application
After=network.target

[Service]
Type=simple
User=<your-username>
WorkingDirectory=/path/to/pictureframe
# Always use dual server mode for reliable operation
ExecStart=/bin/bash /path/to/pictureframe/start.sh --serve
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

3. Enable and start the service:

```bash
sudo systemctl enable pictureframe.service
sudo systemctl start pictureframe.service
```

## Troubleshooting Deployment Issues

If the application fails to start after deployment:

1. Check the server logs:
```bash
cat server.log
```

2. Check for broken upload directory links:
```bash
ls -la build/uploads
```

3. Fix any broken symlinks using the start script:
```bash
./start.sh
```

## Rolling Back a Deployment

If a deployment causes issues, you can roll back to a previous version:

```bash
# Find the commit hash of the last working version
git log

# Reset to that version
git checkout main
git reset --hard <commit-hash>

# Redeploy
npm run production
```