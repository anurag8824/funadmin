const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

const uploadsDir = path.join(__dirname, "..", "uploads");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function resetDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
  fs.mkdirSync(dirPath, { recursive: true });
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function removeFileIfExists(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // best-effort cleanup
  }
}

function runFfmpeg(command) {
  return new Promise((resolve, reject) => {
    command
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

function probeVideo(inputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata || {});
    });
  });
}

function resolveLocalInputPath(sourceUrl) {
  if (!sourceUrl) return null;
  const baseUrl = process.env.baseURL || "";
  const baseHost = baseUrl ? new URL(baseUrl).hostname : "localhost";

  let parsed;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    return null;
  }

  const isLocal = parsed.hostname === baseHost || parsed.hostname === "localhost";
  const pathname = decodeURIComponent(parsed.pathname || "");
  if (!isLocal || !pathname.startsWith("/uploads/")) return null;

  const relativePath = pathname.replace(/^\/uploads\/?/, "");
  const absolutePath = path.join(uploadsDir, relativePath);
  if (!absolutePath.startsWith(uploadsDir) || !fileExists(absolutePath)) return null;
  return absolutePath;
}

function toPublicUploadUrl(relativeUploadPath) {
  const base = (process.env.baseURL || "").replace(/\/+$/, "");
  const clean = relativeUploadPath.replace(/^\/+/, "");
  return `${base}/uploads/${clean}`;
}

async function createMp4Rendition({ inputPath, outputPath, height }) {
  await runFfmpeg(
    ffmpeg(inputPath)
      .outputOptions([
        "-c:v libx264",
        "-preset veryfast",
        "-crf 23",
        "-maxrate 3000k",
        "-bufsize 6000k",
        `-vf scale=-2:${height}`,
        "-movflags +faststart",
        "-c:a aac",
        "-b:a 128k",
      ])
      .output(outputPath)
  );
}

async function createHls({ inputPath, outputM3u8Path }) {
  await runFfmpeg(
    ffmpeg(inputPath)
      .outputOptions([
        "-c:v libx264",
        "-preset veryfast",
        "-crf 24",
        "-c:a aac",
        "-b:a 128k",
        "-hls_time 4",
        "-hls_playlist_type vod",
        "-hls_flags independent_segments",
        "-hls_segment_filename",
        outputM3u8Path.replace("master.m3u8", "seg_%03d.ts"),
      ])
      .output(outputM3u8Path)
  );
}

async function createHlsVariant({ inputPath, outputM3u8Path, segmentPatternPath, maxrate, bufsize }) {
  await runFfmpeg(
    ffmpeg(inputPath)
      .outputOptions([
        "-c:v libx264",
        "-preset veryfast",
        "-crf 23",
        `-maxrate ${maxrate}`,
        `-bufsize ${bufsize}`,
        "-c:a aac",
        "-b:a 128k",
        "-hls_time 4",
        "-hls_playlist_type vod",
        "-hls_flags independent_segments",
        "-hls_segment_filename",
        segmentPatternPath,
      ])
      .output(outputM3u8Path)
  );
}

function createMasterManifest({ masterPath, variants }) {
  const lines = ["#EXTM3U", "#EXT-X-VERSION:3"];
  for (const variant of variants) {
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},RESOLUTION=${variant.resolution}`,
      variant.playlistName
    );
  }
  fs.writeFileSync(masterPath, `${lines.join("\n")}\n`, "utf8");
}

async function createThumbnail({ inputPath, outputThumbPath }) {
  await runFfmpeg(
    ffmpeg(inputPath)
      .outputOptions(["-ss 00:00:01", "-vframes 1", "-vf scale=-2:720"])
      .output(outputThumbPath)
  );
}

async function createPreview({ inputPath, outputPreviewPath }) {
  await runFfmpeg(
    ffmpeg(inputPath)
      .outputOptions([
        "-ss 00:00:00",
        "-t 00:00:03",
        "-c:v libx264",
        "-preset veryfast",
        "-crf 25",
        "-an",
        "-vf scale=-2:720",
        "-movflags +faststart",
      ])
      .output(outputPreviewPath)
  );
}

async function createStep(stepName, runner, outputPath) {
  try {
    await runner();
    return { ok: true, stepName, outputPath, error: "" };
  } catch (error) {
    removeFileIfExists(outputPath);
    return { ok: false, stepName, outputPath, error: error.message || `${stepName} failed` };
  }
}

async function processReelVideo({ videoId, sourceUrl, fallbackThumbUrl = "" }) {
  const inputPath = resolveLocalInputPath(sourceUrl);
  if (!inputPath) {
    // External source (S3/DO/CDN) - leave original URLs as fallback.
    return {
      processingMode: "passthrough",
      assets: {
        hlsMasterUrl: "",
        mp4_1080_url: sourceUrl || "",
        mp4_720_url: sourceUrl || "",
        mp4_480_url: sourceUrl || "",
        thumbUrl: fallbackThumbUrl || "",
        previewUrl: "",
      },
    };
  }

  const relOutDir = path.join("reels", String(videoId));
  const absOutDir = path.join(uploadsDir, relOutDir);
  resetDir(absOutDir);

  const mp4_1080_rel = path.join(relOutDir, "1080.mp4");
  const mp4_720_rel = path.join(relOutDir, "720.mp4");
  const mp4_480_rel = path.join(relOutDir, "480.mp4");
  const hls_rel = path.join(relOutDir, "master.m3u8");
  const hls_1080_rel = path.join(relOutDir, "1080p.m3u8");
  const hls_720_rel = path.join(relOutDir, "720p.m3u8");
  const hls_480_rel = path.join(relOutDir, "480p.m3u8");
  const thumb_rel = path.join(relOutDir, "thumb.jpg");
  const preview_rel = path.join(relOutDir, "preview.mp4");

  const meta = await probeVideo(inputPath);
  const durationSec = Number(meta?.format?.duration || 0);
  const sizeBytes = Number(meta?.format?.size || 0);
  if (!durationSec || durationSec > 95) {
    throw new Error("Invalid video duration for reels processing");
  }
  if (!sizeBytes || sizeBytes > 500 * 1024 * 1024) {
    throw new Error("Video file size exceeds processing limit");
  }

  const results = [];
  results.push(
    await createStep("mp4_1080", () => createMp4Rendition({ inputPath, outputPath: path.join(uploadsDir, mp4_1080_rel), height: 1920 }), path.join(uploadsDir, mp4_1080_rel))
  );
  results.push(
    await createStep("mp4_720", () => createMp4Rendition({ inputPath, outputPath: path.join(uploadsDir, mp4_720_rel), height: 1280 }), path.join(uploadsDir, mp4_720_rel))
  );
  results.push(
    await createStep("mp4_480", () => createMp4Rendition({ inputPath, outputPath: path.join(uploadsDir, mp4_480_rel), height: 854 }), path.join(uploadsDir, mp4_480_rel))
  );

  if (fileExists(path.join(uploadsDir, mp4_1080_rel))) {
    results.push(
      await createStep(
        "hls_1080",
        () =>
          createHlsVariant({
            inputPath: path.join(uploadsDir, mp4_1080_rel),
            outputM3u8Path: path.join(uploadsDir, hls_1080_rel),
            segmentPatternPath: path.join(uploadsDir, relOutDir, "1080p_%03d.ts"),
            maxrate: "5000k",
            bufsize: "10000k",
          }),
        path.join(uploadsDir, hls_1080_rel)
      )
    );
  }
  if (fileExists(path.join(uploadsDir, mp4_720_rel))) {
    results.push(
      await createStep(
        "hls_720",
        () =>
          createHlsVariant({
            inputPath: path.join(uploadsDir, mp4_720_rel),
            outputM3u8Path: path.join(uploadsDir, hls_720_rel),
            segmentPatternPath: path.join(uploadsDir, relOutDir, "720p_%03d.ts"),
            maxrate: "2800k",
            bufsize: "5600k",
          }),
        path.join(uploadsDir, hls_720_rel)
      )
    );
  }
  if (fileExists(path.join(uploadsDir, mp4_480_rel))) {
    results.push(
      await createStep(
        "hls_480",
        () =>
          createHlsVariant({
            inputPath: path.join(uploadsDir, mp4_480_rel),
            outputM3u8Path: path.join(uploadsDir, hls_480_rel),
            segmentPatternPath: path.join(uploadsDir, relOutDir, "480p_%03d.ts"),
            maxrate: "1400k",
            bufsize: "2800k",
          }),
        path.join(uploadsDir, hls_480_rel)
      )
    );
  }

  const availableVariants = [];
  if (fileExists(path.join(uploadsDir, hls_1080_rel))) availableVariants.push({ playlistName: "1080p.m3u8", bandwidth: 5200000, resolution: "1080x1920" });
  if (fileExists(path.join(uploadsDir, hls_720_rel))) availableVariants.push({ playlistName: "720p.m3u8", bandwidth: 3000000, resolution: "720x1280" });
  if (fileExists(path.join(uploadsDir, hls_480_rel))) availableVariants.push({ playlistName: "480p.m3u8", bandwidth: 1600000, resolution: "480x854" });
  if (availableVariants.length > 0) {
    createMasterManifest({
      masterPath: path.join(uploadsDir, hls_rel),
      variants: availableVariants,
    });
  }

  results.push(await createStep("thumb", () => createThumbnail({ inputPath, outputThumbPath: path.join(uploadsDir, thumb_rel) }), path.join(uploadsDir, thumb_rel)));
  results.push(await createStep("preview", () => createPreview({ inputPath, outputPreviewPath: path.join(uploadsDir, preview_rel) }), path.join(uploadsDir, preview_rel)));

  const failedSteps = results.filter((r) => !r.ok).map((r) => `${r.stepName}: ${r.error}`);
  const hasAnyPlayable = fileExists(path.join(uploadsDir, hls_rel)) || fileExists(path.join(uploadsDir, mp4_720_rel)) || fileExists(path.join(uploadsDir, mp4_480_rel)) || fileExists(path.join(uploadsDir, mp4_1080_rel));
  if (!hasAnyPlayable) {
    throw new Error(`No playable outputs generated. ${failedSteps.join(" | ")}`);
  }
  const processingStatus = failedSteps.length > 0 ? "degraded" : "ready";

  return {
    processingMode: "transcoded-local",
    processingStatus,
    warnings: failedSteps,
    assets: {
      hlsMasterUrl: fileExists(path.join(uploadsDir, hls_rel)) ? toPublicUploadUrl(hls_rel) : "",
      mp4_1080_url: fileExists(path.join(uploadsDir, mp4_1080_rel)) ? toPublicUploadUrl(mp4_1080_rel) : "",
      mp4_720_url: fileExists(path.join(uploadsDir, mp4_720_rel)) ? toPublicUploadUrl(mp4_720_rel) : "",
      mp4_480_url: fileExists(path.join(uploadsDir, mp4_480_rel)) ? toPublicUploadUrl(mp4_480_rel) : "",
      thumbUrl: fileExists(path.join(uploadsDir, thumb_rel)) ? toPublicUploadUrl(thumb_rel) : fallbackThumbUrl,
      previewUrl: fileExists(path.join(uploadsDir, preview_rel)) ? toPublicUploadUrl(preview_rel) : "",
      hlsVariants: {
        hls1080Url: fileExists(path.join(uploadsDir, hls_1080_rel)) ? toPublicUploadUrl(hls_1080_rel) : "",
        hls720Url: fileExists(path.join(uploadsDir, hls_720_rel)) ? toPublicUploadUrl(hls_720_rel) : "",
        hls480Url: fileExists(path.join(uploadsDir, hls_480_rel)) ? toPublicUploadUrl(hls_480_rel) : "",
      },
    },
  };
}

module.exports = {
  processReelVideo,
};

