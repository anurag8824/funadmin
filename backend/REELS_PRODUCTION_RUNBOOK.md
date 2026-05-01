# Reels Production Runbook

## Required env vars

- `baseURL` (public backend URL used in generated asset URLs)
- `REDIS_URL` (queue/worker connection)
- `REELS_ASYNC_PROCESSING=true`
- `REELS_DELETE_SOURCE_AFTER_PROCESSING=false` (optional)

## Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 status
```

## API and worker process names

- `funtapp-api`
- `funtapp-reels-worker`

## Nginx

Use `deploy/nginx/funtapp.conf` as site config and point backend path to your server checkout path.

After applying config:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Quick verification

1. Upload one reel from app.
2. Verify job state through:
   - `GET /client/video/reelUploadJobStatus?videoId=<id>`
3. Ensure feed returns:
   - `assets.hlsMasterUrl`
   - `processingStatus`
4. Playback in app should prefer HLS automatically.

