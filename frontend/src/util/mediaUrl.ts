import { baseURL } from "./config";

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = String(url).trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  const normalizedBase = baseURL.endsWith("/") ? baseURL : `${baseURL}/`;
  const normalizedPath = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  return `${normalizedBase}${normalizedPath}`;
}

export function resolveVideoPlaybackUrl(video?: {
  videoUrl?: string;
  playbackUrl?: string;
  assets?: {
    hlsMasterUrl?: string;
    mp4_720_url?: string;
    mp4_1080_url?: string;
    mp4_480_url?: string;
    previewUrl?: string;
  };
}): string {
  if (!video) return "";
  return (
    resolveMediaUrl(video.playbackUrl) ||
    resolveMediaUrl(video.videoUrl) ||
    resolveMediaUrl(video.assets?.hlsMasterUrl) ||
    resolveMediaUrl(video.assets?.mp4_720_url) ||
    resolveMediaUrl(video.assets?.mp4_1080_url) ||
    resolveMediaUrl(video.assets?.mp4_480_url) ||
    resolveMediaUrl(video.assets?.previewUrl) ||
    ""
  );
}

export function resolvePostImageUrl(post?: {
  mainPostImage?: string;
  postImage?: Array<{ url?: string }>;
}): string {
  if (!post) return "";
  return (
    resolveMediaUrl(post.mainPostImage) ||
    resolveMediaUrl(post.postImage?.[0]?.url) ||
    ""
  );
}
