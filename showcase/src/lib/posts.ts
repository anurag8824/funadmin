import { API_BASE_URL, API_SECRET_KEY } from "./config";
import { SITE_URL } from "./site";

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

export type SharePost = {
  id: string;
  caption: string;
  imageUrl: string;
  authorName: string;
  authorUsername: string;
  authorImageUrl: string;
  createdAt?: string;
};

type ApiPostPayload = {
  _id?: string;
  caption?: string;
  mainPostImage?: string;
  postImage?: Array<{ url?: string }>;
  name?: string;
  userName?: string;
  userImage?: string;
  createdAt?: string;
};

type ApiResponse = {
  status?: boolean;
  message?: string;
  data?: ApiPostPayload;
};

export function isValidPostId(postId: string): boolean {
  return OBJECT_ID_PATTERN.test(postId);
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

function mapPost(postId: string, data: ApiPostPayload): SharePost {
  const firstImage = Array.isArray(data.postImage) ? data.postImage[0]?.url : "";
  const imageUrl = toAbsoluteMediaUrl(
    data.mainPostImage || firstImage || data.userImage || "",
  );

  return {
    id: postId,
    caption: (data.caption || "").trim(),
    imageUrl,
    authorName: data.name || data.userName || "FuntApp",
    authorUsername: data.userName || "funtapp",
    authorImageUrl: toAbsoluteMediaUrl(data.userImage || ""),
    createdAt: data.createdAt,
  };
}

export async function fetchPostById(postId: string): Promise<SharePost | null> {
  if (!isValidPostId(postId)) {
    return null;
  }

  if (!API_SECRET_KEY) {
    console.error(
      "[funtapp-showcase] FUNTAPP_API_SECRET_KEY is not set — cannot fetch post metadata.",
    );
    return null;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/client/post/getPostById/${postId}`,
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

    return mapPost(postId, payload.data);
  } catch (error) {
    console.error("[funtapp-showcase] fetchPostById failed:", error);
    return null;
  }
}

export function buildPostShareMeta(post: SharePost) {
  const pageUrl = `${SITE_URL}/post/${post.id}`;
  const title = post.caption
    ? `${post.authorName} on FuntApp`
    : `Post by ${post.authorName}`;
  const description = (
    post.caption || `See this post by ${post.authorName} on FuntApp`
  ).slice(0, 180);

  return {
    pageUrl,
    title,
    description,
    imageUrl: post.imageUrl,
  };
}
