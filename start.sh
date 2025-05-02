#!/bin/bash

echo "Starting Picture Frame app..."

# Make sure uploads directory exists
mkdir -p ./public/uploads
echo "Created uploads directory in public/"

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

# Set proper permissions on directories
if [ -d "./public" ]; then
  echo "Setting permissions for public directory..."
  chmod 755 "./public"
fi

# Also make sure any existing copied uploads in build are properly linked
if [ -d "./build" ] && [ -d "./public/uploads" ]; then
  echo "Checking for images in build/uploads directory..."
  
  # Set appropriate permissions on uploads directories
  echo "Setting permissions for uploads directories..."
  chmod -R 755 "./public/uploads"
  if [ -d "./build/uploads" ]; then
    chmod -R 755 "./build/uploads"
  fi
  
  # Handle the find command properly with better syntax for multiple patterns
  find ./build/uploads -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" \) 2>/dev/null | \
  while read file; do
    filename=$(basename "$file")
    if [ ! -f "./public/uploads/$filename" ]; then
      echo "Copying $filename to public/uploads..."
      cp "$file" "./public/uploads/"
      chmod 644 "./public/uploads/$filename"
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

# Check if user wants to use dual server mode
if [ "$1" = "--serve" ]; then
  echo "Starting app with dual server mode (Express + serve)..."
  # We need both servers for dual-server mode
  
  API_PORT="${PORT:-5000}"
  STATIC_PORT="3000"
  
  echo "Access the app on your network at:"
  echo "  Main UI: http://${IP_ADDRESS}:$STATIC_PORT"
  echo "  API server: http://${IP_ADDRESS}:$API_PORT"
  
  # Start Express API server in the background
  echo "Starting Express API server on port $API_PORT..."
  export HOST="0.0.0.0"
  export PORT="$API_PORT"
  node server.js &
  EXPRESS_PID=$!
  echo "Express API server started with PID $EXPRESS_PID"
  
  # Give the API server a moment to start
  sleep 2
  
  # Verify the API server is running
  if kill -0 $EXPRESS_PID 2>/dev/null; then
    echo "API server running on port $API_PORT"
  else
    echo "WARNING: API server may not have started properly"
  fi
  
  # Save the EXPRESS_PID to a file for outside reference
  echo $EXPRESS_PID > .express.pid
  
  # Try both locations for the config file
  CONFIG_PATH="$(pwd)/serve.json"
  
  echo "Starting static server on port $STATIC_PORT..."
  if [ -f "$CONFIG_PATH" ]; then
    echo "Using config from: $CONFIG_PATH"
    echo "Listening on port: $STATIC_PORT (all interfaces)"
    
    # Trap exit to ensure we clean up API server
    trap 'echo "Shutting down Express server..."; kill $(cat .express.pid) 2>/dev/null; rm .express.pid' EXIT
    
    # For serve 14.x, just specify the port
    cd build && npx serve --config "$CONFIG_PATH" --listen "$STATIC_PORT" --no-clipboard
  else
    echo "Config file not found at $CONFIG_PATH"
    echo "Using built-in configuration"
    
    # Trap exit to ensure we clean up API server
    trap 'echo "Shutting down Express server..."; kill $(cat .express.pid) 2>/dev/null; rm .express.pid' EXIT
    
    # Fallback to built-in configuration
    cd build && npx serve --listen "$STATIC_PORT" --no-clipboard
  fi
else
  # Use the Express server by default (which handles both static files and API)
  echo "Starting app with single Express server mode..."
  echo "Access the app on your network at:"
  echo "  http://${IP_ADDRESS}:${PORT:-5000}"
  
  # HOST environment variable will be used by Express if defined
  export HOST="0.0.0.0"
  node server.js
fi