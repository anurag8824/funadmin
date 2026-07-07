const { selectPlaybackUrls } = require("../services/reels/videoService");

function enrichAdminVideo(video) {
  if (!video) return video;

  const playback = selectPlaybackUrls(video);
  const resolvedUrl =
    video.videoUrl ||
    playback.hlsMasterUrl ||
    playback.mp4_720_url ||
    playback.mp4_1080_url ||
    playback.mp4_480_url ||
    playback.previewUrl ||
    playback.fallbackUrl ||
    "";

  const resolvedImage = video.videoImage || playback.thumbUrl || "";

  return {
    ...video,
    videoUrl: resolvedUrl,
    videoImage: resolvedImage,
    playbackUrl: resolvedUrl,
  };
}

function enrichAdminVideos(videos) {
  return (videos || []).map(enrichAdminVideo);
}

function enrichAdminPost(post) {
  if (!post) return post;

  const firstImage = Array.isArray(post.postImage) ? post.postImage[0]?.url : "";
  const resolvedMain = post.mainPostImage || firstImage || "";

  return {
    ...post,
    mainPostImage: resolvedMain,
  };
}

function enrichAdminPosts(posts) {
  return (posts || []).map(enrichAdminPost);
}

module.exports = {
  enrichAdminVideo,
  enrichAdminVideos,
  enrichAdminPost,
  enrichAdminPosts,
};
