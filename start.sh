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

# Print configuration for debugging
echo "Configuration:"
echo "  NODE_ENV: $NODE_ENV" 
echo "  PORT: ${PORT:-5000}"

# Check if user wants to use serve instead of Express
if [ "$1" = "--serve" ]; then
  echo "Starting app with serve..."
  npx serve -s build --config ./serve.json
else
  # Use the Express server by default (which handles both static files and API)
  echo "Starting app with Express server..."
  node server.js
fi