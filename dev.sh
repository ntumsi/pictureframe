#!/bin/bash

echo "Starting Picture Frame in development mode..."

# Make sure uploads directory exists
mkdir -p ./public/uploads
echo "Created uploads directory in public/"

# Force consistent environment variables
export REACT_APP_API_URL=http://localhost:5000/api
export NODE_ENV=development

# Print configuration for debugging
echo "Configuration:"
echo "  NODE_ENV: $NODE_ENV"
echo "  REACT_APP_API_URL: $REACT_APP_API_URL"
echo "  Frontend Port: 3000"
echo "  Backend Port: 5000"
echo "  Frontend URL: http://localhost:3000"
echo "  API URL: $REACT_APP_API_URL"
echo "  Uploads Path: $(pwd)/public/uploads"

# Start development servers
npm run dev