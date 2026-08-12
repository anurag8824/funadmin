# FuntApp Showcase Website

Single-page marketing site plus **App Links / Universal Links** support for `funtapp.com`.

## Features

- Instagram-style splash screen launch animation
- Animated phone mockup (Feed, Reels, Live, Chat)
- **`/post/[postId]`** share landing with Open Graph / Twitter cards
- **`/.well-known/assetlinks.json`** for Android App Links
- **`/apple-app-site-association`** for iOS Universal Links (`/post/*`)
- Google Play download CTAs

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `FUNTAPP_API_SECRET_KEY` | Yes (for post pages) | Backend `secretKey` |
| `ANDROID_SHA256_FINGERPRINTS` | Yes (for App Links) | Play App Signing SHA-256 |
| `IOS_TEAM_ID` | Yes (for Universal Links) | Apple Team ID |
| `FUNTAPP_API_BASE_URL` | No | Default `https://api.funtaap.com` |
| `IOS_BUNDLE_ID` | No | Default `com.infayou.funtapp.FuntApp` |

## Getting Started

```bash
cd showcase
cp .env.example .env.local
# Edit .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production URLs

After deploying to `funtapp.com`:

| URL | Purpose |
|-----|---------|
| `https://funtapp.com/.well-known/assetlinks.json` | Android App Links |
| `https://funtapp.com/apple-app-site-association` | iOS Universal Links |
| `https://funtapp.com/post/{postId}` | Post share page + OG preview |

## Deploy on Vercel

1. Push the repo to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Set **Root Directory** to `showcase`
4. Add environment variables from `.env.example`
5. Add custom domain `funtapp.com`
6. Deploy

> **DNS:** Point `funtapp.com` to Vercel. Keep `api.funtaap.com` pointing to your Node backend.

## Verify well-known files

```bash
curl -i https://funtapp.com/.well-known/assetlinks.json
curl -i https://funtapp.com/apple-app-site-association
curl -i https://funtapp.com/post/test123
```

Expect `200`, `Content-Type: application/json`, and no redirects.

## Test Android App Links

```bash
adb shell pm get-app-links com.infayou.funtapp
adb shell pm verify-app-links --re-verify com.infayou.funtapp
adb shell am start -a android.intent.action.VIEW -d "https://funtapp.com/post/YOUR_POST_ID"
```

## Test iOS Universal Links

1. Enable **Associated Domains** in Xcode: `applinks:funtapp.com`
2. Install a release/dev build signed with your team
3. Open `https://funtapp.com/post/YOUR_POST_ID` in Notes/Messages (long-press → Open in FuntApp)

Validate AASA: [Apple App Search Validation Tool](https://search.developer.apple.com/appsearch-validation-tool/)

## Known values from this repo

| Setting | Value |
|---------|-------|
| Android package | `com.infayou.funtapp` |
| iOS bundle ID | `com.infayou.funtapp.FuntApp` |
| Play Store | `https://play.google.com/store/apps/details?id=com.infayou.funtapp` |
| Deep link scheme | `funtap://post/{postId}` |

## Tech Stack

- Next.js 14 (App Router, SSR/ISR)
- Tailwind CSS
- Framer Motion
