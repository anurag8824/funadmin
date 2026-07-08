import { baseURL } from "./config";

const MEDIA_FILE_PATTERN =
  /\.(jpg|jpeg|png|gif|webp|bmp|svg|mp4|mov|webm|mkv|m3u8)$/i;

function apiBase(): string {
  return (baseURL || "https://api.funtaap.com/").replace(/\/+$/, "");
}

function isAbsoluteUrl(url: string): boolean {
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  );
}

function toUploadPath(url: string): string {
  const trimmed = url.trim();

  if (trimmed.startsWith("/uploads/")) {
    return trimmed;
  }

  if (!trimmed.includes("/") && MEDIA_FILE_PATTERN.test(trimmed)) {
    return `/uploads/${trimmed}`;
  }

  if (trimmed.startsWith("uploads/")) {
    return `/${trimmed}`;
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = String(url).trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  const base = apiBase();

  if (isAbsoluteUrl(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (
        parsed.pathname.startsWith("/uploads/") ||
        MEDIA_FILE_PATTERN.test(parsed.pathname)
      ) {
        const path = toUploadPath(parsed.pathname);
        return `${base}${path}${parsed.search}`;
      }
    } catch {
      return trimmed;
    }
    return trimmed;
  }

  const path = toUploadPath(trimmed);
  return `${base}${path}`;
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
    resolveMediaUrl(video.assets?.mp4_720_url) ||
    resolveMediaUrl(video.assets?.mp4_1080_url) ||
    resolveMediaUrl(video.assets?.mp4_480_url) ||
    resolveMediaUrl(video.assets?.hlsMasterUrl) ||
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
