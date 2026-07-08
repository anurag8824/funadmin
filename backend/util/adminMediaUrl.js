const { selectPlaybackUrls } = require("../services/reels/videoService");

const MEDIA_FILE_PATTERN =
  /\.(jpg|jpeg|png|gif|webp|bmp|svg|mp4|mov|webm|mkv|m3u8)$/i;

function apiBase() {
  return (process.env.baseURL || "https://api.funtaap.com").replace(/\/+$/, "");
}

function isAbsoluteUrl(url) {
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  );
}

function toUploadPath(url) {
  const trimmed = String(url).trim();

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

function toAbsoluteMediaUrl(url) {
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

function enrichAdminVideo(video) {
  if (!video) return video;

  const playback = selectPlaybackUrls(video);

  // Prefer MP4 in admin panel <video> tag (HLS often fails outside Safari).
  const resolvedUrl =
    video.videoUrl ||
    playback.mp4_720_url ||
    playback.mp4_1080_url ||
    playback.mp4_480_url ||
    playback.hlsMasterUrl ||
    playback.previewUrl ||
    playback.fallbackUrl ||
    "";

  const resolvedImage = video.videoImage || playback.thumbUrl || "";

  return {
    ...video,
    videoUrl: toAbsoluteMediaUrl(resolvedUrl),
    videoImage: toAbsoluteMediaUrl(resolvedImage),
    playbackUrl: toAbsoluteMediaUrl(resolvedUrl),
    userImage: toAbsoluteMediaUrl(video.userImage),
  };
}

function enrichAdminVideos(videos) {
  return (videos || []).map(enrichAdminVideo);
}

function enrichAdminPost(post) {
  if (!post) return post;

  const firstImage = Array.isArray(post.postImage) ? post.postImage[0]?.url : "";
  const resolvedMain = post.mainPostImage || firstImage || "";

  const enrichedPostImages = Array.isArray(post.postImage)
    ? post.postImage.map((image) => ({
        ...image,
        url: toAbsoluteMediaUrl(image?.url),
      }))
    : post.postImage;

  return {
    ...post,
    mainPostImage: toAbsoluteMediaUrl(resolvedMain),
    postImage: enrichedPostImages,
    userImage: toAbsoluteMediaUrl(post.userImage),
  };
}

function enrichAdminPosts(posts) {
  return (posts || []).map(enrichAdminPost);
}

module.exports = {
  toAbsoluteMediaUrl,
  enrichAdminVideo,
  enrichAdminVideos,
  enrichAdminPost,
  enrichAdminPosts,
};
