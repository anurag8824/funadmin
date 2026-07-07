const { selectPlaybackUrls } = require("../services/reels/videoService");

function toAbsoluteMediaUrl(url) {
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

  const base = (process.env.baseURL || "https://api.funtaap.com").replace(
    /\/+$/,
    ""
  );
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
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
