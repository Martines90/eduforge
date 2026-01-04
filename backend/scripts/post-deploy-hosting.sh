#!/bin/bash

# Post-deployment script to grant public access to Next.js SSR Cloud Run service
# This is needed because Firebase Hosting's frameworksBackend feature
# resets IAM permissions on each deployment

set -e

PROJECT_ID="eduforge-d29d9"
REGION="us-central1"
SERVICE_NAME="ssreduforged29d9"

echo "🔐 Granting public access to Cloud Run service: $SERVICE_NAME"

gcloud run services add-iam-policy-binding "$SERVICE_NAME" \
  --region="$REGION" \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --project="$PROJECT_ID" \
  --quiet

echo "✅ Public access granted successfully!"
echo "🌐 Your Next.js app is now publicly accessible"
