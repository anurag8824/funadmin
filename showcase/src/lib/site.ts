/** Safe for client and server — no secrets. */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://funtapp.com";

export const ANDROID_PACKAGE_NAME = "com.infayou.funtapp";

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.infayou.funtapp";

export const APP_SCHEME = "funtap";

export function webPostUrl(postId: string): string {
  return `${SITE_URL}/post/${postId}`;
}

export function appPostDeepLink(postId: string): string {
  return `${APP_SCHEME}://post/${postId}`;
}
