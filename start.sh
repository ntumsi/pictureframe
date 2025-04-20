#!/bin/bash

echo "Starting Picture Frame app..."

# Make sure uploads directory exists
mkdir -p ./public/uploads

# Check if app is built
if [ ! -d "./build" ]; then
  echo "Building React app..."
  export NODE_ENV=production
  npm run build
  
  # Create symlink from build/uploads to public/uploads
  echo "Setting up uploads folder symlink..."
  if [ ! -L "./build/uploads" ]; then
    # Remove the directory if it exists but is not a symlink
    if [ -d "./build/uploads" ]; then
      rm -rf ./build/uploads
    fi
    # Create the symlink
    ln -sf ../public/uploads ./build/uploads
  fi
else
  echo "Using existing build folder"
  
  # Make sure the symlink exists for the build folder
  if [ ! -L "./build/uploads" ]; then
    echo "Setting up uploads folder symlink..."
    # Remove the directory if it exists but is not a symlink
    if [ -d "./build/uploads" ]; then
      rm -rf ./build/uploads
    fi
    # Create the symlink
    ln -sf ../public/uploads ./build/uploads
  fi
fi

# Always use the Express server (which handles both static files and API)
echo "Starting app with Express server..."

# Force consistent environment variables
export REACT_APP_API_URL=http://localhost:5000/api
export NODE_ENV=production
export PORT=5000

# Print configuration for debugging
echo "Configuration:"
echo "  NODE_ENV: $NODE_ENV"
echo "  REACT_APP_API_URL: $REACT_APP_API_URL"
echo "  PORT: $PORT"
echo "  Server URL: http://localhost:$PORT"
echo "  API URL: $REACT_APP_API_URL"

# Start the server
node server.js