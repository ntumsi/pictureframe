#!/bin/bash

echo "Starting Picture Frame in development mode..."

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

# Start development servers
npm run dev