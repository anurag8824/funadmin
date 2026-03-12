# Firebase Admin (Backend) – Push Notifications

The backend uses **Firebase Admin SDK** to send push notifications (FCM). It does **not** use `google-services.json` (that file is for the **Android app** only).

## What the backend needs

A **Firebase service account key** (JSON file) from the same Firebase project as your app. This is different from `google-services.json`.

## Where to get the service account key

1. Open [Firebase Console](https://console.firebase.google.com/) → your project.
2. Go to **Project settings** (gear) → **Service accounts**.
3. Click **Generate new private key** and download the JSON file.
4. Keep this file **secret** (do not commit to git).

## Where to put it in the backend

**Option A – File in backend folder (recommended)**

1. Copy the downloaded JSON file into the backend folder, e.g.:
   - `funadmin-main/backend/serviceAccountKey.json`
2. In backend `.env` add:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
   ```
   (Use a path relative to the backend folder, or an absolute path.)
3. Restart the backend. It will load the credential from this file and initialize Firebase Admin. Push sends will then work.

**Option B – Store in database (Settings)**

You can store the **entire JSON object** in the Setting document in MongoDB, in the **privateKey** field (as used by the admin panel). If `FIREBASE_SERVICE_ACCOUNT_PATH` is not set, the backend uses `settingJSON.privateKey` from the DB.

If you get **"Invalid JWT Signature"** or **"invalid_grant"** when sending:

- The key may be **revoked** or **expired**. Generate a **new** key in Firebase Console (Service accounts → Generate new private key) and replace the one in the DB or in the file.
- Ensure **server time** is correct (wrong time can cause invalid_grant).

## Security

- Add the service account JSON file to `.gitignore` so it is never committed.
- Do not share or commit the private key.
