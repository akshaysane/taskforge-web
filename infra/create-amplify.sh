#!/usr/bin/env bash
# Create Amplify app for ChoreChamps frontend
# Usage: ./create-amplify.sh <api-url>
# Example: ./create-amplify.sh http://1.2.3.4:3000
set -euo pipefail

API_URL="${1:?Usage: ./create-amplify.sh <api-url>}"
REGION="us-east-1"
APP_NAME="chorechamps-web"
REPO="https://github.com/akshaysane/taskforge-web"
BRANCH="main"

echo "=== Creating Amplify app ==="

# Create the Amplify app
APP_ID=$(aws amplify create-app \
  --name "${APP_NAME}" \
  --repository "${REPO}" \
  --access-token "$(gh auth token)" \
  --environment-variables "VITE_API_URL=${API_URL}" \
  --region "${REGION}" \
  --query "app.appId" \
  --output text)

echo "App created: ${APP_ID}"

# Create the branch (triggers first build)
aws amplify create-branch \
  --app-id "${APP_ID}" \
  --branch-name "${BRANCH}" \
  --framework "React" \
  --stage "PRODUCTION" \
  --region "${REGION}"

echo "Branch created, starting first build..."

# Start a build
aws amplify start-job \
  --app-id "${APP_ID}" \
  --branch-name "${BRANCH}" \
  --job-type "RELEASE" \
  --region "${REGION}"

# Get the default domain
DEFAULT_DOMAIN=$(aws amplify get-app \
  --app-id "${APP_ID}" \
  --region "${REGION}" \
  --query "app.defaultDomain" \
  --output text)

echo ""
echo "=== Amplify app created! ==="
echo "App ID: ${APP_ID}"
echo "Frontend URL: https://${BRANCH}.${DEFAULT_DOMAIN}"
echo ""
echo "Auto-deploys on push to '${BRANCH}' branch."
echo ""
echo "IMPORTANT: Update CORS on the backend to allow this origin:"
echo "  https://${BRANCH}.${DEFAULT_DOMAIN}"
