/** Upload validation rules (SADD Phase 12). */
const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
const ALLOWED_VIDEO_PATTERN = /\.(mp4)(\?.*)?$/i;

function parsePositiveInt(value) {
  const parsed = parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function validateUploadPayload({ body, settingJSON }) {
  if (!body?.videoTime || !body?.videoUrl || !body?.videoImage) {
    return {
      ok: false,
      status: 200,
      body: { status: false, message: "Oops ! Invalid details.", code: "INVALID_PAYLOAD" },
      cleanup: [body?.videoImage, body?.videoUrl].filter(Boolean),
    };
  }

  const maxDuration = settingJSON?.durationOfShorts
    ? Math.min(settingJSON.durationOfShorts, 90)
    : 90;
  const videoTime = parsePositiveInt(body.videoTime);
  if (!videoTime || videoTime < 1) {
    return {
      ok: false,
      status: 200,
      body: { status: false, message: "Invalid video duration.", code: "INVALID_DURATION" },
      cleanup: [body.videoImage, body.videoUrl].filter(Boolean),
    };
  }
  if (videoTime > maxDuration) {
    return {
      ok: false,
      status: 400,
      body: {
        status: false,
        message: `Video duration cannot exceed ${maxDuration} seconds.`,
        code: "DURATION_EXCEEDED",
      },
      cleanup: [body.videoImage, body.videoUrl].filter(Boolean),
    };
  }

  if (!ALLOWED_VIDEO_PATTERN.test(String(body.videoUrl))) {
    return {
      ok: false,
      status: 400,
      body: {
        status: false,
        message: "Only MP4 video format is supported.",
        code: "INVALID_FILE_TYPE",
      },
      cleanup: [body.videoImage, body.videoUrl].filter(Boolean),
    };
  }

  const declaredBytes = parsePositiveInt(body.fileSizeBytes);
  if (declaredBytes && declaredBytes > MAX_VIDEO_BYTES) {
    return {
      ok: false,
      status: 400,
      body: {
        status: false,
        message: "Video file is too large. Max size: 500MB.",
        code: "FILE_TOO_LARGE",
      },
      cleanup: [body.videoImage, body.videoUrl].filter(Boolean),
    };
  }

  return { ok: true, maxDuration, videoTime };
}

module.exports = {
  validateUploadPayload,
  MAX_VIDEO_BYTES,
};
