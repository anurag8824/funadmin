const path = require("path");
const fs = require("fs");

/**
 * Compress video for reels (Instagram-like: smaller file, faster load).
 * Uses FFmpeg - must be installed on the system.
 * Max 720p, ~1.5 Mbps video, 128k audio. H.264 + AAC for compatibility.
 *
 * @param {string} inputPath - Full path to input video file
 * @returns {Promise<{path: string, originalSize: number, compressedSize: number, ratio: number}>} - Compression result with metrics
 */
function compressVideoForReels(inputPath) {
  return new Promise((resolve, reject) => {
    try {
      const ffmpeg = require("fluent-ffmpeg");
      const ext = path.extname(inputPath);
      const tempPath = path.join(path.dirname(inputPath), `compressed_${Date.now()}${ext}`);

      // Get original file size
      const originalStats = fs.statSync(inputPath);
      const originalSize = originalStats.size;
      const originalSizeMB = (originalSize / (1024 * 1024)).toFixed(2);
      
      console.log(`📹 VideoCompress: Starting compression`);
      console.log(`📹 VideoCompress: Input: ${path.basename(inputPath)}`);
      console.log(`📹 VideoCompress: Original size: ${originalSizeMB} MB (${originalSize} bytes)`);

      ffmpeg(inputPath)
        .outputOptions([
          "-c:v libx264",           // H.264 video codec
          "-preset fast",            // Encoding speed vs compression tradeoff
          "-crf 28",                 // Constant Rate Factor (lower = better quality, larger file)
          "-maxrate 1500k",          // Max video bitrate: 1.5 Mbps
          "-bufsize 3000k",          // Buffer size: 3 Mbps (2x maxrate for smooth playback)
          "-vf scale=-2:720",        // Scale to max 720p height, maintain aspect ratio
          "-c:a aac",                // AAC audio codec
          "-b:a 128k",               // Audio bitrate: 128 kbps
          "-movflags +faststart",    // Optimize for streaming (move metadata to beginning)
        ])
        .output(tempPath)
        .on("start", (commandLine) => {
          console.log(`📹 VideoCompress: FFmpeg command: ${commandLine}`);
        })
        .on("progress", (progress) => {
          if (progress.percent) {
            console.log(`📹 VideoCompress: Progress: ${Math.round(progress.percent)}%`);
          }
        })
        .on("end", () => {
          try {
            // Get compressed file size
            const compressedStats = fs.statSync(tempPath);
            const compressedSize = compressedStats.size;
            const compressedSizeMB = (compressedSize / (1024 * 1024)).toFixed(2);
            const compressionRatio = ((compressedSize / originalSize) * 100).toFixed(1);
            const sizeReduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);
            
            console.log(`📹 VideoCompress: Compression completed!`);
            console.log(`📹 VideoCompress: Compressed size: ${compressedSizeMB} MB (${compressedSize} bytes)`);
            console.log(`📹 VideoCompress: Compression ratio: ${compressionRatio}% (${sizeReduction}% reduction)`);
            console.log(`📹 VideoCompress: Size saved: ${((originalSize - compressedSize) / (1024 * 1024)).toFixed(2)} MB`);
            
            // Replace original with compressed
            fs.renameSync(tempPath, inputPath);
            console.log(`📹 VideoCompress: ✅ Video compressed successfully: ${path.basename(inputPath)}`);
            
            resolve({
              path: inputPath,
              originalSize: originalSize,
              compressedSize: compressedSize,
              ratio: compressedSize / originalSize,
              originalSizeMB: parseFloat(originalSizeMB),
              compressedSizeMB: parseFloat(compressedSizeMB),
              sizeReductionPercent: parseFloat(sizeReduction),
            });
          } catch (err) {
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            console.error(`📹 VideoCompress: ❌ Error replacing file:`, err);
            reject(err);
          }
        })
        .on("error", (err) => {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          console.error(`📹 VideoCompress: ❌ Compression error:`, err.message);
          reject(err);
        })
        .run();
    } catch (err) {
      console.error(`📹 VideoCompress: ❌ FFmpeg initialization error:`, err);
      reject(err);
    }
  });
}

module.exports = { compressVideoForReels };
