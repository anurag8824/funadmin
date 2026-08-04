const mongoose = require("mongoose");
const Video = require("../models/video.model");
const Post = require("../models/post.model");
const Story = require("../models/story.model");
const User = require("../models/user.model");
const { toAbsoluteMediaUrl } = require("../util/adminMediaUrl");

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.infayou.funtapp";
const WEB_HOST = process.env.SHARE_WEB_HOST || "https://funtapp.com";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeUsername(raw) {
  return String(raw || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

function buildShareHtml({ title, description, image, pageUrl, appSchemeUrl }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safePageUrl = escapeHtml(pageUrl);
  const safeAppScheme = escapeHtml(appSchemeUrl);
  const safePlayStore = escapeHtml(PLAY_STORE_URL);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="FuntApp" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:url" content="${safePageUrl}" />
  ${safeImage ? `<meta property="og:image" content="${safeImage}" />` : ""}
  ${safeImage ? `<meta property="og:image:secure_url" content="${safeImage}" />` : ""}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDescription}" />
  ${safeImage ? `<meta name="twitter:image" content="${safeImage}" />` : ""}
  <meta http-equiv="refresh" content="2;url=${safePlayStore}" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; background:#0b0b0f; color:#fff; margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; text-align:center; padding:24px; }
    .card { max-width:420px; }
    img { width:100%; max-height:320px; object-fit:cover; border-radius:16px; background:#1a1a22; }
    a { color:#a78bfa; }
  </style>
</head>
<body>
  <div class="card">
    ${safeImage ? `<img src="${safeImage}" alt="" />` : ""}
    <h1>${safeTitle}</h1>
    <p>${safeDescription}</p>
    <p>Opening FuntApp… If the app is not installed, you will be taken to the Play Store.</p>
    <p><a href="${safeAppScheme}">Open in app</a> · <a href="${safePlayStore}">Get the app</a></p>
  </div>
  <script>
    (function () {
      var appUrl = ${JSON.stringify(appSchemeUrl)};
      var storeUrl = ${JSON.stringify(PLAY_STORE_URL)};
      var start = Date.now();
      window.location.href = appUrl;
      setTimeout(function () {
        if (Date.now() - start < 1600) {
          window.location.href = storeUrl;
        }
      }, 1200);
    })();
  </script>
</body>
</html>`;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

exports.assetLinks = (req, res) => {
  const fingerprints = (process.env.ANDROID_SHA256_FINGERPRINTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Placeholder until Play App Signing SHA-256 is set via ANDROID_SHA256_FINGERPRINTS.
  if (fingerprints.length === 0) {
    fingerprints.push("REPLACE_WITH_PLAY_APP_SIGNING_SHA256");
  }

  res.setHeader("Content-Type", "application/json");
  return res.status(200).json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.infayou.funtapp",
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]);
};

exports.shareVideo = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(404).send("Video not found");
    }

    const video = await Video.findById(id).populate("userId", "name userName image").lean();
    if (!video) {
      return res.status(404).send("Video not found");
    }

    const userName = video.userId?.name || video.userId?.userName || "FuntApp";
    const title = video.caption?.trim() ? `${userName} on FuntApp` : `Reel by ${userName}`;
    const description = (video.caption || `Watch this reel by ${userName} on FuntApp`).slice(0, 180);
    const image = toAbsoluteMediaUrl(video.videoImage || video.userId?.image || "");
    const pageUrl = `${WEB_HOST}/video/${id}`;
    const appSchemeUrl = `funtap://video/${id}`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(
      buildShareHtml({ title, description, image, pageUrl, appSchemeUrl }),
    );
  } catch (error) {
    console.error("shareVideo error:", error);
    return res.status(500).send("Internal Server Error");
  }
};

exports.sharePost = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(404).send("Post not found");
    }

    const post = await Post.findById(id).populate("userId", "name userName image").lean();
    if (!post) {
      return res.status(404).send("Post not found");
    }

    const userName = post.userId?.name || post.userId?.userName || "FuntApp";
    const firstImage = Array.isArray(post.postImage) ? post.postImage[0]?.url : "";
    const image = toAbsoluteMediaUrl(post.mainPostImage || firstImage || post.userId?.image || "");
    const title = post.caption?.trim() ? `${userName} on FuntApp` : `Post by ${userName}`;
    const description = (post.caption || `See this post by ${userName} on FuntApp`).slice(0, 180);
    const pageUrl = `${WEB_HOST}/post/${id}`;
    const appSchemeUrl = `funtap://post/${id}`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(
      buildShareHtml({ title, description, image, pageUrl, appSchemeUrl }),
    );
  } catch (error) {
    console.error("sharePost error:", error);
    return res.status(500).send("Internal Server Error");
  }
};

exports.shareStory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(404).send("Story not found");
    }

    const story = await Story.findById(id).populate("user", "name userName image").lean();
    if (!story) {
      return res.status(404).send("Story not found");
    }

    const userName = story.user?.name || story.user?.userName || "FuntApp";
    const image = toAbsoluteMediaUrl(
      story.mediaImageUrl || story.sharedContentPreviewUrl || story.user?.image || "",
    );
    const title = `Story by ${userName}`;
    const description = `View ${userName}'s story on FuntApp`;
    const pageUrl = `${WEB_HOST}/story/${id}`;
    const appSchemeUrl = `funtap://story/${id}`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(
      buildShareHtml({ title, description, image, pageUrl, appSchemeUrl }),
    );
  } catch (error) {
    console.error("shareStory error:", error);
    return res.status(500).send("Internal Server Error");
  }
};

/**
 * Profile share landing: /u/:username
 * Opens app via funtap://profile/{id}; falls back to Play Store if not installed.
 */
exports.shareProfile = async (req, res) => {
  try {
    const username = normalizeUsername(req.params.username);
    if (!username || username.length < 3) {
      return res.status(404).send("Profile not found");
    }

    const user = await User.findOne({ userName: username })
      .select("_id name userName image bio")
      .lean();
    if (!user) {
      return res.status(404).send("Profile not found");
    }

    const display = user.name || user.userName || "FuntApp";
    const title = `${display} on FuntApp`;
    const description = (user.bio || `Follow @${user.userName} on FuntApp`).slice(0, 180);
    const image = toAbsoluteMediaUrl(user.image || "");
    const pageUrl = `${WEB_HOST}/u/${user.userName}`;
    const appSchemeUrl = `funtap://profile/${user._id}`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(
      buildShareHtml({ title, description, image, pageUrl, appSchemeUrl }),
    );
  } catch (error) {
    console.error("shareProfile error:", error);
    return res.status(500).send("Internal Server Error");
  }
};
