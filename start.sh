#!/bin/bash

echo "Starting Picture Frame app..."

# Check if app is built
if [ ! -d "./build" ]; then
  echo "Building React app..."
  npm run build
fi

# Choose which method to use for serving the app
if [ "$1" == "serve" ]; then
  # Use serve for static file serving (better for Raspberry Pi)
  echo "Starting app with serve..."
  npx serve -s build --config serve.json
else
  # Use Express server (original method)
  echo "Starting app with Express server..."
  export NODE_ENV=production
  node server.js
fi