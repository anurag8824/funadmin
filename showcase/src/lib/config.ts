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

/** Play Console → App integrity → App signing key certificate → SHA-256. */
const DEFAULT_ANDROID_SHA256_FINGERPRINTS = [
  "D5:FD:DA:E1:92:3F:39:9E:D7:C7:99:CC:F4:A0:75:CF:99:6F:BF:88:6A:35:69:21:F8:58:FD:E7:E9:CC:61:04",
];

/**
 * Comma-separated if multiple fingerprints are required.
 * Falls back to Play App Signing cert when env is unset.
 */
export const ANDROID_SHA256_FINGERPRINTS = (
  process.env.ANDROID_SHA256_FINGERPRINTS ||
  DEFAULT_ANDROID_SHA256_FINGERPRINTS.join(",")
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

/** Apple Developer → Membership → Team ID (10 characters). Not in repo. */
export const IOS_TEAM_ID = process.env.IOS_TEAM_ID?.trim() || "";

/** From iosApp/Configuration/Config.xcconfig when TEAM_ID is empty. */
export const IOS_BUNDLE_ID =
  process.env.IOS_BUNDLE_ID?.trim() || "com.infayou.funtapp.FuntApp";
