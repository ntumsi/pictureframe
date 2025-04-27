#!/bin/bash

echo "Starting Picture Frame app..."

# Make sure uploads directory exists
mkdir -p ./public/uploads

# Check if app is built
if [ ! -d "./build" ]; then
  echo "Building React app..."
  export NODE_ENV=production
  npm run build
fi

echo "Using build folder"

# ALWAYS recreate the uploads symlink to ensure it's correct
echo "Setting up uploads folder symlink..."
if [ -d "./build" ]; then
  # First remove the directory or symlink if it exists
  if [ -e "./build/uploads" ]; then
    echo "Removing existing uploads directory or symlink in build folder..."
    rm -rf ./build/uploads
  fi
  
  # Now create a fresh symlink
  echo "Creating fresh symlink for uploads folder..."
  ln -sf ../public/uploads ./build/uploads
  
  # Verify it was created correctly
  if [ -L "./build/uploads" ]; then
    echo "Symlink created successfully"
  else
    echo "WARNING: Failed to create symlink!"
  fi
  
  # Also ensure serve.json is in the build directory
  echo "Ensuring serve.json is in the build directory..."
  cp -f "./serve.json" "./build/serve.json"
  echo "serve.json copied to build directory"
fi

# Also make sure any existing copied uploads in build are properly linked
if [ -d "./build" ] && [ -d "./public/uploads" ]; then
  echo "Checking for images in build/uploads directory..."
  
  # Handle the find command properly with better syntax for multiple patterns
  find ./build/uploads -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" \) 2>/dev/null | \
  while read file; do
    filename=$(basename "$file")
    if [ ! -f "./public/uploads/$filename" ]; then
      echo "Copying $filename to public/uploads..."
      cp "$file" "./public/uploads/"
    fi
  done
  
  # Also verify the file permissions
  echo "Ensuring proper file permissions..."
  find ./public/uploads -type f -exec chmod 644 {} \;
fi

# Set production environment
export NODE_ENV=production

# Get the local IP address (platform-independent)
IP_ADDRESS=$(hostname -I | awk '{print $1}')

# Print configuration for debugging
echo "Configuration:"
echo "  NODE_ENV: $NODE_ENV" 
echo "  PORT: ${PORT:-5000}"
echo "  IP ADDRESS: ${IP_ADDRESS}"
echo ""
echo "Access the app on your network at:"
if [ "$1" = "--serve" ]; then
  # Display serve port (default 3000)
  echo "  http://${IP_ADDRESS}:${PORT:-3000}"
else
  # Display Express port (default 5000)
  echo "  http://${IP_ADDRESS}:${PORT:-5000}"
fi

# Check if user wants to use serve instead of Express
if [ "$1" = "--serve" ]; then
  echo "Starting app with serve..."
  # Try both locations for the config file
  CONFIG_PATH="$(pwd)/serve.json"
  
  PORT="${PORT:-3000}"
  
  if [ -f "$CONFIG_PATH" ]; then
    echo "Using config from: $CONFIG_PATH"
    echo "Listening on port: $PORT (all interfaces)"
    
    # For serve 14.x, we just specify the port, it will bind to 0.0.0.0 by default
    cd build && npx serve --config "$CONFIG_PATH" --listen "$PORT" --no-clipboard
  else
    echo "Config file not found at $CONFIG_PATH"
    echo "Using built-in configuration"
    # Fallback to built-in configuration
    cd build && npx serve --listen "$PORT" --no-clipboard
  fi
else
  # Use the Express server by default (which handles both static files and API)
  echo "Starting app with Express server..."
  # HOST environment variable will be used by Express if defined
  export HOST="0.0.0.0"
  node server.js
fi