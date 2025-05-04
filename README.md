# Picture Frame App

A full-stack React application for displaying images in a slideshow format, perfect for digital picture frames. The app allows users to upload, view, and delete images through a web interface.

[![Deploy from Main](https://img.shields.io/badge/deploy-from%20main-blue.svg)](./DEPLOY.md)

> **IMPORTANT**: All deployments should be made from the `main` branch. See [deployment documentation](./DEPLOY.md) for details.

## Features

- Fullscreen slideshow mode with auto-advancing images (10 second intervals)
- Image management interface for adding and deleting pictures
- Drag-and-drop file uploads with support for JPEG, PNG, GIF, and WebP formats
- Bulk delete functionality with multi-select capabilities
- Keyboard navigation (arrow keys to navigate, 'f' to toggle fullscreen)
- Auto-hide controls that appear on mouse movement
- Responsive design for various display sizes
- Network access to upload/delete pictures over your local network
- Built-in fallback mechanisms for image loading failures
- Automatic image refresh (every 60 seconds)

## Installation

### Standard Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/pictureframe.git
cd pictureframe
```

2. Install dependencies:
```
npm install
```

### Raspberry Pi Installation

This application works great on Raspberry Pi devices to create a digital picture frame. Follow these steps to set it up:

#### Prerequisites

1. Raspberry Pi (3B+ or later recommended)
2. Raspberry Pi OS (32-bit or 64-bit) installed
3. Display connected to the Raspberry Pi
4. Internet connection (Wi-Fi or Ethernet)
5. Node.js 18.0.0 or later
6. npm 9.0.0 or later

#### Setup Steps

1. Update your Raspberry Pi:
```
sudo apt update
sudo apt upgrade -y
```

2. Install Node.js and npm (LTS version recommended):
```
# Clean any old installations (if needed)
sudo apt remove nodejs
sudo apt purge nodejs

# Install using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Alternatively, for older Raspberry Pi models use Node.js 18.x
# curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
# sudo apt install -y nodejs
```

3. Verify installation:
```
node -v
npm -v
```

4. Install git if not already installed:
```
sudo apt install git -y
```

5. Clone the repository:
```
git clone https://github.com/yourusername/pictureframe.git
cd pictureframe
```

6. Install dependencies:
```
npm install
```

7. Build the application:
```
npm run build
```

8. Start the server:
```
npm run server
```

#### Auto-start on Boot

To have the picture frame application start automatically when the Raspberry Pi boots:

1. Create a systemd service file:
```
sudo nano /etc/systemd/system/pictureframe.service
```

2. Add the following content (adjust paths as needed):

**Option 1: Using Express Server**
```
[Unit]
Description=Picture Frame Application
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/pictureframe
ExecStart=/usr/bin/bash /home/pi/pictureframe/start.sh
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

**Option 2: Using Serve (Recommended for Raspberry Pi)**
```
[Unit]
Description=Picture Frame Application
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/pictureframe
ExecStart=/usr/bin/bash /home/pi/pictureframe/start.sh --serve
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

3. Enable and start the service:
```
sudo systemctl enable pictureframe.service
sudo systemctl start pictureframe.service
```

4. Configure the Raspberry Pi for kiosk mode (full-screen browser):

Create a startup script:
```
sudo nano /home/pi/.config/autostart/kiosk.desktop
```

Add the following content:

**For Express server (port 5000):**
```
[Desktop Entry]
Type=Application
Name=Kiosk
Exec=chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:5000
```

**For Serve (port 3000, recommended):**
```
[Desktop Entry]
Type=Application
Name=Kiosk
Exec=chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:3000
```

5. Disable screen blanking by editing the config file:
```
sudo nano /etc/xdg/lxsession/LXDE-pi/autostart
```

Add these lines:
```
@xset s off
@xset -dpms
@xset s noblank
```

#### Preventing SD Card Wear

For long-term use, consider mounting the uploads directory to a USB drive:

1. Connect a USB drive to the Raspberry Pi
2. Format the USB drive:
```
sudo mkfs.ext4 /dev/sda1
```

3. Create a mount point:
```
sudo mkdir /mnt/usb
```

4. Add to fstab for automatic mounting:
```
sudo nano /etc/fstab
```

Add this line:
```
/dev/sda1 /mnt/usb ext4 defaults 0 0
```

5. Update the uploads folder path in the server.js file:
```
const UPLOADS_FOLDER = '/mnt/usb/uploads';
```

## Usage

### Development Mode

Run both the React frontend and Express backend concurrently:
```
npm run dev
```

This will start:
- React frontend on port 3000 (http://localhost:3000)
- Express backend on port 5000 (http://localhost:5000)

The application is configured to automatically proxy API requests from port 3000 to 5000 in development mode.

### Production Mode

1. Build the React application:
```
npm run build
```

2. Start the application using one of these methods:

**Method 1: Using Express Server (recommended, supports API functionality)**
```
npm run server
```
The application will be accessible at http://localhost:5000.

**Method 2: Using the start script (most reliable option)**
```
./start.sh
```
This will:
- Create the uploads directory if it doesn't exist
- Build the app if needed
- Set up proper symlinks between public/uploads and build/uploads
- Start the Express server on port 5000

You can also use Serve instead of Express by adding the `--serve` flag:
```
./start.sh --serve
```

**Method 3: Complete build and server in one command**
```
npm run production
```
Same as running `npm run build` followed by `npm run server`

**Method 4: Complete build and serve with static server**
```
npm run production:serve
```
Builds the app and serves it using the serve static server instead of Express.

**Method 5: Using Serve directly (for static serving only)**
```
npm run serve
```
The application will be accessible at http://localhost:3000 by default, but API functionality will be limited unless you're also running the Express server separately.

**Method 6: Build without deployment**
```
npm run build-only
```
This will build the React application and update the build folder without starting any servers. Use this when you want to update the build files but handle deployment separately.

### How it Works

In production mode:
1. Express server serves both the static React app and API endpoints from the same origin
2. Uploads are stored in the `/public/uploads` directory
3. A symlink connects the build/uploads directory to public/uploads
4. All API requests use the same host as the webapp, ensuring proper connectivity

## Accessing on Your Network

To access the application from other devices on your network:

1. Make sure your application is running in production mode with the proper network binding:
```
./start.sh
```
Or for using the static server:
```
./start.sh --serve
```

2. The script will automatically display your network IP address in the console output.

3. From other devices on the same network, access the application using:
   - Express server: `http://YOUR_IP_ADDRESS:5000`
   - Static server: `http://YOUR_IP_ADDRESS:3000` (default port for serve)

4. If you're using a custom port (set through PORT environment variable), make sure to use that port instead:
```
PORT=8080 ./start.sh
```

5. If your device has a firewall, make sure ports 5000 (for Express) and 3000 (for serve) are allowed.

### Troubleshooting Network Access

If devices cannot access the application:

1. Check if your device has a firewall blocking inbound connections on the app ports
   - For Linux: `sudo ufw status` or `sudo iptables -L`
   - For Windows: Check Windows Firewall settings

2. Verify the server is binding to all interfaces (0.0.0.0) and not just localhost:
   - Run `ss -tulpn | grep -E ':(5000|3000)'`
   - Look for `*:5000` (or your custom port) indicating it's listening on all interfaces

3. If using a router with client isolation enabled, disable this feature to allow devices to communicate

4. Test local connectivity with curl:
   ```
   curl http://localhost:5000/api/images
   ```

## Display Configuration

On Raspberry Pi, you may want to:

1. Set display orientation:
```
sudo nano /boot/config.txt
```

Add one of these lines depending on your mounting:
```
display_rotate=0    # Normal
display_rotate=1    # 90 degrees
display_rotate=2    # 180 degrees
display_rotate=3    # 270 degrees
```

2. For touchscreen interaction, you also need to rotate the touch input:
```
sudo nano /etc/X11/xorg.conf.d/40-libinput.conf
```

## Folder Structure

- `/public/uploads` - Stores all uploaded images
- `/src/api` - API service for interacting with the backend
- `/src/components` - React components
- `/src/styles` - CSS stylesheets

## Technologies Used

- React 18.2.0
- React Router DOM 6.22.1
- Express.js 4.18.2
- Multer 1.4.5-lts.2 (for file uploads)
- Axios 1.6.7
- UUID 9.0.1
- Concurrently 8.2.2

## Security Notes

This application has been secured against common vulnerabilities:
- All dependencies are updated to secure versions
- Package overrides are in place to ensure transitive dependencies are secure
- CORS is properly configured for cross-origin requests
- JSON parsing is handled with proper error handling
- File uploads are restricted to images with size limits (10MB)
- Regular security audits are recommended (run `npm audit` periodically)

## Troubleshooting

### Common Issues

1. **Images not displaying**
   - Ensure the uploads directory exists in the correct location
   - Check that the symlink between build/uploads and public/uploads is properly created
   - Verify permissions on the uploads directory (should be readable by the web server)
   - If using production mode, run `./start.sh` to fix broken symlinks

2. **Upload failures**
   - Check server logs for specific error messages
   - Verify the file size is under 10MB
   - Ensure the file type is supported (JPG, PNG, GIF, WebP)

3. **API connectivity issues**
   - In development mode: make sure both the frontend and backend servers are running
   - In production mode: verify the Express server is running on port 5000
   - Check browser console for CORS errors or network issues
   - If using `serve` instead of Express, ensure the Express server is also running for API functionality

4. **Cross-device file access**
   - Ensure your device's firewall allows access to the server port (5000 for Express, 3000 for serve)
   - Use your device's IP address (not localhost) when accessing from other devices

5. **Production build issues**
   - The most common issue is broken symlinks between build/uploads and public/uploads
   - Always run `./start.sh` before serving in production to fix these symlink issues
   - For comprehensive fix, use `npm run production:serve` or `npm run production`

## Maintenance

### Regular Maintenance Tasks

1. **Clean up uploads directory** 
   - Periodically remove unwanted images to save space
   - Use the management interface or delete files directly from the uploads directory

2. **Update dependencies**
   ```
   npm update
   npm audit fix
   ```

3. **Backup your images**
   ```
   # Example backup command
   cp -r public/uploads /backup/location/
   ```

4. **Update from git repository**
   ```
   # Update codebase while preserving your uploads
   npm run update
   ```
   This will:
   - Backup your uploads directory
   - Pull the latest code from git
   - Restore your uploads
   - Rebuild the application
   - Preserve your uploaded images

## License

MIT
