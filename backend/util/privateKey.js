const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const initializeSettings = require("../index");

/**
 * No-op Firebase Admin stub when credentials are missing or invalid.
 * Prevents "Error sending message" crashes; notifications are simply skipped.
 */
const noopFirebase = {
  messaging: () => ({
    send: () => Promise.resolve(),
  }),
};

/**
 * Get Firebase Admin credential: from env file path or from DB setting (privateKey).
 * Backend needs the SERVICE ACCOUNT KEY JSON (from Firebase Console → Service Accounts → Generate new private key),
 * NOT google-services.json (that file is for the Android app only).
 */
function getServiceAccountCredential() {
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (envPath) {
    const resolved = path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath);
    if (fs.existsSync(resolved)) {
      try {
        const json = JSON.parse(fs.readFileSync(resolved, "utf8"));
        if (json.type === "service_account" && json.private_key && json.client_email) {
          return json;
        }
        console.warn("Firebase: file at FIREBASE_SERVICE_ACCOUNT_PATH missing type/private_key/client_email");
      } catch (e) {
        console.warn("Firebase: failed to read FIREBASE_SERVICE_ACCOUNT_PATH:", e.message);
      }
    } else {
      console.warn("Firebase: FIREBASE_SERVICE_ACCOUNT_PATH file not found:", resolved);
    }
  }
  return global.settingJSON?.privateKey;
}

const initFirebase = async () => {
  try {
    await initializeSettings;
    const credential = getServiceAccountCredential();
    if (!credential || !credential.private_key || !credential.client_email) {
      console.warn(
        "Firebase Admin SDK not initialized: no valid credential. Set FIREBASE_SERVICE_ACCOUNT_PATH in .env (path to service account JSON) or set privateKey in Settings. See BACKEND_FIREBASE_SETUP.md"
      );
      return noopFirebase;
    }
    admin.initializeApp({
      credential: admin.credential.cert(credential),
    });
    console.log("Firebase Admin SDK initialized successfully");
    return admin;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    return noopFirebase;
  }
};

const adminPromise = initFirebase();

module.exports = adminPromise;
