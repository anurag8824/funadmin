#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash deploy/deploy_reels.sh
#
# Optional env overrides:
#   APP_DIR=/var/www/funadmin/backend
#   BRANCH=main
#   REMOTE=origin

APP_DIR="${APP_DIR:-/var/www/funadmin/backend}"
GIT_DIR="${GIT_DIR:-/var/www/funadmin}"
BRANCH="${BRANCH:-main}"
REMOTE="${REMOTE:-origin}"

echo "==> Starting reels deployment"
echo "    APP_DIR=$APP_DIR"
echo "    GIT_DIR=$GIT_DIR"
echo "    REMOTE=$REMOTE"
echo "    BRANCH=$BRANCH"

if [ ! -d "$APP_DIR" ]; then
  echo "ERROR: APP_DIR does not exist: $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

if [ ! -d "$GIT_DIR/.git" ]; then
  echo "ERROR: Not a git repo: $GIT_DIR"
  exit 1
fi

echo "==> Fetching latest code"
git -C "$GIT_DIR" fetch "$REMOTE" "$BRANCH"

if [ -n "$(git -C "$GIT_DIR" status --porcelain)" ]; then
  echo "WARNING: Local changes found. Stashing before pull."
  git -C "$GIT_DIR" stash push -u -m "auto-stash-before-deploy-$(date +%s)"
fi

echo "==> Pulling latest commit"
git -C "$GIT_DIR" pull --ff-only "$REMOTE" "$BRANCH"

echo "==> Installing dependencies"
npm install

if [ ! -f ".env" ]; then
  echo "ERROR: .env not found in $APP_DIR"
  echo "Please create .env with REDIS_URL and REELS_ASYNC_PROCESSING=true"
  exit 1
fi

echo "==> Validating required env keys"
required_keys=("REDIS_URL" "REELS_ASYNC_PROCESSING" "baseURL" "MongoDb_Connection_String" "JWT_SECRET")
for key in "${required_keys[@]}"; do
  if ! grep -q "^${key}=" .env; then
    echo "ERROR: Missing $key in .env"
    exit 1
  fi
done

if ! grep -q "^REELS_ASYNC_PROCESSING=true" .env; then
  echo "ERROR: REELS_ASYNC_PROCESSING must be true in .env"
  exit 1
fi

echo "==> Checking Redis endpoint from .env"
REDIS_URL_LINE="$(grep '^REDIS_URL=' .env | tail -n 1 || true)"
REDIS_URL="${REDIS_URL_LINE#REDIS_URL=}"
if [ -z "$REDIS_URL" ]; then
  echo "ERROR: REDIS_URL is empty"
  exit 1
fi
echo "    REDIS_URL=$REDIS_URL"

echo "==> Verifying PM2 is installed"
if ! command -v pm2 >/dev/null 2>&1; then
  echo "PM2 not found. Installing globally..."
  npm install -g pm2
fi

echo "==> Starting/restarting PM2 processes"
if pm2 describe funtapp-api >/dev/null 2>&1 || pm2 describe funtapp-reels-worker >/dev/null 2>&1; then
  pm2 restart ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js --update-env
fi

pm2 save

echo "==> PM2 status"
pm2 status

echo "==> Last 40 logs (api)"
pm2 logs funtapp-api --lines 40 --nostream || true

echo "==> Last 40 logs (worker)"
pm2 logs funtapp-reels-worker --lines 40 --nostream || true

echo "==> Deployment completed successfully"
