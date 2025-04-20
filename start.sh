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
fi

# Choose which method to use for serving the app
if [ "$1" == "serve" ]; then
  # Use serve for static file serving (better for Raspberry Pi)
  echo "Starting app with serve..."
  # Note: When using serve, API calls won't work - this is for slideshow viewing only
  npx serve -s build --config serve.json
else
  # Use Express server (original method)
  echo "Starting app with Express server..."
  export NODE_ENV=production
  node server.js
fi