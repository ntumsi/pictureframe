#!/bin/bash

echo "Building Picture Frame app without deployment..."

# Make sure uploads directory and default album exist
mkdir -p ./public/uploads/default
echo "Ensured uploads directory exists"

# Build the React app
echo "Building React app..."
export NODE_ENV=production
npm run build

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

# Set proper permissions on uploads (including album subdirectories)
if [ -d "./public/uploads" ]; then
  echo "Setting permissions for uploads directories..."
  find ./public/uploads -type d -exec chmod 755 {} \;
  find ./public/uploads -type f -exec chmod 644 {} \;
fi

echo "Build completed successfully!"
echo "The build folder is now updated with the latest changes."
echo "To deploy, you can use the start.sh script with the --serve flag."