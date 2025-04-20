# Picture Frame App

A full-stack React application for displaying images in a slideshow format, perfect for digital picture frames. The app allows users to upload, view, and delete images through a web interface.

## Features

- Fullscreen slideshow mode with auto-advancing images
- Image management interface for adding and deleting pictures
- Drag-and-drop file uploads
- Bulk delete functionality
- Keyboard navigation (arrow keys to navigate, 'f' to toggle fullscreen)
- Responsive design
- Network access to upload/delete pictures over your local network

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

#### Setup Steps

1. Update your Raspberry Pi:
```
sudo apt update
sudo apt upgrade -y
```

2. Install Node.js and npm:
```
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
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
```
[Desktop Entry]
Type=Application
Name=Kiosk
Exec=chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:5000
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

### Production Mode

1. Build the React application:
```
npm run build
```

2. Start the server:
```
npm run server
```

Or use the provided start script:
```
./start.sh
```

The application will be accessible at http://localhost:5000.

## Accessing on Your Network

To access the application from other devices on your network:

1. Find your device's IP address:
```
hostname -I
```

2. Access the application using `http://YOUR_IP_ADDRESS:5000` 

3. Use this method to upload and manage your pictures from any device on your network

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

- React
- React Router
- Express.js
- Multer (for file uploads)
- Axios
- UUID
- Concurrently

## License

MIT
