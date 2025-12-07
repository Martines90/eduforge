#!/bin/bash

# Script to deploy Firebase Functions with environment variables from .env.production file

# Check if .env.production file exists
if [ ! -f ".env.production" ]; then
    echo "Error: .env.production file not found!"
    exit 1
fi

# Load environment variables and format them for Firebase
ENV_VARS=$(grep -v '^#' .env.production | grep -v '^$' | sed 's/^/  /' | tr '\n' ',' | sed 's/,$//')

echo "Deploying with environment variables from .env.production..."
echo ""

# Deploy functions with environment variables
firebase deploy --only functions --set-env-vars "$ENV_VARS"
