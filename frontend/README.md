# FuntApp Admin Frontend

Admin panel for managing users, posts, videos, stories, gifts, settings, and uploads.

## Setup

```bash
npm install
cp .env.example .env   # set NEXT_PUBLIC_BACKEND_URL and NEXT_PUBLIC_SECRET_KEY
npm run dev              # http://localhost:5001
```

## First-time admin registration

1. Deploy the backend with `ADMIN_PURCHASE_CODE` set in server `.env`.
2. Open the admin UI — if no admin exists, you will see **Registration**.
3. Enter your email, password, and the **purchase code** from `ADMIN_PURCHASE_CODE`.
4. After registration, use **Login** with the same email and password.

Each purchase code can be used **once**. Add more codes to `ADMIN_PURCHASE_CODE` (comma-separated) or insert into the `purchasecodes` MongoDB collection.

## Environment

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL (must end with `/`) |
| `NEXT_PUBLIC_SECRET_KEY` | Must match backend `secretKey` |
| `NEXT_PUBLIC_PROJECT_NAME` | Display name in the UI |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 5001 |
| `npm run build` | Production build |
| `npm run start` | Production server |
