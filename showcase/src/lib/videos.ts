import { API_BASE_URL, API_SECRET_KEY } from "./config";
import { SITE_URL } from "./site";

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

export type ShareVideo = {
  id: string;
  caption: string;
  imageUrl: string;
  authorName: string;
  authorUsername: string;
  authorImageUrl: string;
  createdAt?: string;
};

type ApiVideoPayload = {
  _id?: string;
  caption?: string;
  videoImage?: string;
  name?: string;
  userName?: string;
  userImage?: string;
  createdAt?: string;
};

type ApiResponse = {
  status?: boolean;
  message?: string;
  data?: ApiVideoPayload;
};

export function isValidVideoId(videoId: string): boolean {
  return OBJECT_ID_PATTERN.test(videoId);
}

function toAbsoluteMediaUrl(url: string | undefined): string {
  if (!url) return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  const base = API_BASE_URL.replace(/\/+$/, "");
  if (trimmed.startsWith("/uploads/")) {
    return `${base}${trimmed}`;
  }
  if (trimmed.startsWith("uploads/")) {
    return `${base}/${trimmed}`;
  }
  if (trimmed.startsWith("/")) {
    return `${base}${trimmed}`;
  }

  return `${base}/uploads/${trimmed}`;
}

function mapVideo(videoId: string, data: ApiVideoPayload): ShareVideo {
  return {
    id: videoId,
    caption: (data.caption || "").trim(),
    imageUrl: toAbsoluteMediaUrl(data.videoImage || data.userImage || ""),
    authorName: data.name || data.userName || "FuntApp",
    authorUsername: data.userName || "funtapp",
    authorImageUrl: toAbsoluteMediaUrl(data.userImage || ""),
    createdAt: data.createdAt,
  };
}

export async function fetchVideoById(videoId: string): Promise<ShareVideo | null> {
  if (!isValidVideoId(videoId)) {
    return null;
  }

  if (!API_SECRET_KEY) {
    console.error(
      "[funtapp-showcase] FUNTAPP_API_SECRET_KEY is not set — cannot fetch video metadata.",
    );
    return null;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/client/video/getVideoById/${videoId}`,
      {
        headers: {
          key: API_SECRET_KEY,
          Accept: "application/json",
        },
        next: { revalidate: 60 },
      },
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ApiResponse;
    if (!payload.status || !payload.data) {
      return null;
    }

    return mapVideo(videoId, payload.data);
  } catch (error) {
    console.error("[funtapp-showcase] fetchVideoById failed:", error);
    return null;
  }
}

export function buildVideoShareMeta(
  video: ShareVideo,
  pathPrefix: "video" | "reel" = "video",
) {
  const pageUrl = `${SITE_URL}/${pathPrefix}/${video.id}`;
  const title = video.caption
    ? `${video.authorName} on FuntApp`
    : `Reel by ${video.authorName}`;
  const description = (
    video.caption || `Watch this reel by ${video.authorName} on FuntApp`
  ).slice(0, 180);

  return {
    pageUrl,
    title,
    description,
    imageUrl: video.imageUrl,
  };
}
