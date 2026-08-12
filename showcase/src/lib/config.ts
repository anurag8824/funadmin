/** Server-only configuration. Do not import this file from client components. */

export {
  ANDROID_PACKAGE_NAME,
  APP_SCHEME,
  PLAY_STORE_URL,
  SITE_URL,
  appPostDeepLink,
  webPostUrl,
} from "./site";

export const API_BASE_URL =
  process.env.FUNTAPP_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://api.funtaap.com";

/** Backend `secretKey` header — must match funadmin-main/backend `.env` secretKey. */
export const API_SECRET_KEY = process.env.FUNTAPP_API_SECRET_KEY || "";

/**
 * Play Console → App integrity → App signing key certificate → SHA-256.
 * Comma-separated if multiple fingerprints are required.
 */
export const ANDROID_SHA256_FINGERPRINTS = (
  process.env.ANDROID_SHA256_FINGERPRINTS || ""
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

/** Apple Developer → Membership → Team ID (10 characters). Not in repo. */
export const IOS_TEAM_ID = process.env.IOS_TEAM_ID?.trim() || "";

/** From iosApp/Configuration/Config.xcconfig when TEAM_ID is empty. */
export const IOS_BUNDLE_ID =
  process.env.IOS_BUNDLE_ID?.trim() || "com.infayou.funtapp.FuntApp";
