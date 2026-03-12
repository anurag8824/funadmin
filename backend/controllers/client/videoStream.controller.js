const fs = require("fs");
const path = require("path");
const Video = require("../../models/video.model");
const mongoose = require("mongoose");

const uploadsDir = path.join(__dirname, "..", "..", "uploads");

/**
 * Stream video with Range (chunk) support so clients can request only the bytes they need.
 * Reduces initial data and speeds up start of playback.
 * GET /client/video/streamChunk?videoUrl=...  OR  ?videoId=...
 * Client can send header: Range: bytes=0-1048575
 */
exports.streamChunk = async (req, res) => {
  try {
    let videoUrl = req.query.videoUrl;
    const videoId = req.query.videoId;

    if (!videoUrl && !videoId) {
      return res.status(400).json({ status: false, message: "videoUrl or videoId is required." });
    }

    if (!videoUrl && videoId) {
      if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return res.status(400).json({ status: false, message: "Invalid videoId." });
      }
      const video = await Video.findById(videoId).select("videoUrl").lean();
      if (!video || !video.videoUrl) {
        return res.status(404).json({ status: false, message: "Video not found." });
      }
      videoUrl = video.videoUrl;
    }

    const baseUrl = process.env.baseURL || "";
    const baseHost = baseUrl ? new URL(baseUrl).hostname : "localhost";

    let parsed;
    try {
      parsed = new URL(videoUrl);
    } catch {
      return res.status(400).json({ status: false, message: "Invalid videoUrl." });
    }

    const isLocal = parsed.hostname === baseHost || parsed.hostname === "localhost";
    const pathname = decodeURIComponent(parsed.pathname || "");
    const isUploads = pathname.startsWith("/uploads/");

    if (isLocal && isUploads) {
      const relativePath = pathname.replace(/^\/uploads\/?/, "");
      const filePath = path.join(uploadsDir, relativePath);

      if (!filePath.startsWith(uploadsDir) || !fs.existsSync(filePath)) {
        return res.status(404).json({ status: false, message: "File not found." });
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;

      const rangeHeader = req.headers.range;
      let start = 0;
      let end = fileSize - 1;

      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
        if (match) {
          start = match[1] ? parseInt(match[1], 10) : 0;
          end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
          end = Math.min(end, fileSize - 1);
        }
      }

      const chunkSize = end - start + 1;
      const ext = path.extname(filePath).toLowerCase();
      const contentType = ext === ".mp4" ? "video/mp4" : ext === ".webm" ? "video/webm" : "video/mp4";

      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000");

      if (rangeHeader && (start > 0 || end < fileSize - 1)) {
        res.status(206);
        res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
        res.setHeader("Content-Length", chunkSize);
        const stream = fs.createReadStream(filePath, { start, end });
        stream.pipe(res);
      } else {
        res.status(200);
        res.setHeader("Content-Length", fileSize);
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
      }
      return;
    }

    // External URL (S3/DO): redirect so client fetches with range from origin (most CDNs support it)
    res.redirect(302, videoUrl);
  } catch (err) {
    console.error("videoStream.streamChunk error:", err);
    res.status(500).json({ status: false, message: err.message || "Internal Server Error" });
  }
};
