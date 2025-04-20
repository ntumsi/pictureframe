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

# Make sure the build/uploads directory exists
echo "Setting up uploads directory in build folder..."
mkdir -p ./build/uploads
echo "Created uploads directory in build/"

# Copy files from public/uploads to build/uploads to ensure they're available
echo "Copying images from public/uploads to build/uploads..."
cp -r ./public/uploads/* ./build/uploads/ 2>/dev/null || echo "No files to copy (this is normal for first run)"

# Show the contents of both directories for verification
echo "Contents of public/uploads:"
ls -la ./public/uploads/
echo "Contents of build/uploads:"
ls -la ./build/uploads/

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