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

# Always ensure the uploads symlink is set up correctly
echo "Setting up uploads folder symlink..."
if [ -d "./build" ]; then
  # Remove the directory if it exists but is not a symlink
  if [ -d "./build/uploads" ] && [ ! -L "./build/uploads" ]; then
    echo "Removing existing uploads directory in build folder..."
    rm -rf ./build/uploads
  fi
  
  # Create the symlink if it doesn't exist
  if [ ! -e "./build/uploads" ]; then
    echo "Creating symlink for uploads folder..."
    ln -sf ../public/uploads ./build/uploads
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

# Always use the Express server (which handles both static files and API)
echo "Starting app with Express server..."

# Force API URL to localhost:5000 for reliability
export REACT_APP_API_URL=http://localhost:5000/api
export NODE_ENV=production

# Print configuration for debugging
echo "Configuration:"
echo "  NODE_ENV: $NODE_ENV"
echo "  REACT_APP_API_URL: $REACT_APP_API_URL"
echo "  PORT: ${PORT:-5000}"

# Start the server
node server.js