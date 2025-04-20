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
export NODE_ENV=production
node server.js