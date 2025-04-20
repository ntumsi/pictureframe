#!/bin/bash

echo "Starting Picture Frame app..."

# Check if app is built
if [ ! -d "./build" ]; then
  echo "Building React app..."
  npm run build
fi

# Set production mode and start the server
export NODE_ENV=production
node server.js