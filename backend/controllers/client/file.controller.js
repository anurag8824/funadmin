const fs = require("fs");
const path = require("path");
const aws = require("aws-sdk");

const getActiveStorage = async () => {
  const settings = settingJSON;
  if (settings.storage.local) return "local";
  if (settings.storage.awsS3) return "aws";
  if (settings.storage.digitalOcean) return "digitalocean";
  return "local";
};

const { deleteFromStorage } = require("../../util/storageHelper");
const { compressVideoForReels } = require("../../util/videoCompress");

const localStoragePath = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(localStoragePath)) {
  fs.mkdirSync(localStoragePath, { recursive: true });
}

// upload content: raw body. Body = file bytes, headers: X-File-Name, X-Folder-Structure
exports.uploadContent = async (req, res) => {
  try {
    const fileName = req.headers["x-file-name"] || req.headers["x-filename"];
    const folderStructure = req.headers["x-folder-structure"];

    if (!fileName || !folderStructure) {
      return res.status(400).json({
        status: false,
        message: "Missing X-File-Name or X-Folder-Structure header.",
      });
    }

    let buffer = req.body;
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Please upload a valid file (raw body).",
      });
    }

    const activeStorage = await getActiveStorage();
    let url = "";

    if (activeStorage === "local") {
      const filePath = path.join(localStoragePath, path.basename(fileName));
      fs.writeFileSync(filePath, buffer);

      const isVideo = /\.(mp4|mov|webm|mkv|avi)$/i.test(fileName);
      if (isVideo) {
        try {
          const originalSize = buffer.length;
          const originalSizeMB = (originalSize / (1024 * 1024)).toFixed(2);
          console.log(`📤 FileUpload: Video upload started`);
          console.log(`📤 FileUpload: Original size: ${originalSizeMB} MB (${originalSize} bytes)`);
          
          const compressionResult = await compressVideoForReels(filePath);
          
          // Read compressed file
          const compressedBuffer = fs.readFileSync(filePath);
          const compressedSize = compressedBuffer.length;
          const compressedSizeMB = (compressedSize / (1024 * 1024)).toFixed(2);
          const sizeReduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);
          
          console.log(`📤 FileUpload: ✅ Compression complete`);
          console.log(`📤 FileUpload: Compressed size: ${compressedSizeMB} MB (${compressedSize} bytes)`);
          console.log(`📤 FileUpload: Size reduction: ${sizeReduction}%`);
          console.log(`📤 FileUpload: Bandwidth saved: ${((originalSize - compressedSize) / (1024 * 1024)).toFixed(2)} MB`);
          
          // Update buffer with compressed version
          buffer = compressedBuffer;
        } catch (compressErr) {
          console.warn(`📤 FileUpload: ⚠️ Video compression skipped:`, compressErr.message);
          console.warn(`📤 FileUpload: Using original file (may be larger)`);
        }
      }

      url = `${process.env.baseURL}/uploads/${path.basename(fileName)}`;
    } else if (activeStorage === "digitalocean") {
      const s3 = new aws.S3({
        accessKeyId: settingJSON.doAccessKey,
        secretAccessKey: settingJSON.doSecretKey,
        endpoint: new aws.Endpoint(settingJSON.doHostname),
        s3ForcePathStyle: true,
      });
      const key = `${folderStructure}/${path.basename(fileName)}`;
      await s3.putObject({
        Bucket: settingJSON.doBucketName,
        Key: key,
        Body: buffer,
        ACL: "public-read",
      }).promise();
      url = `${settingJSON?.doEndpoint}/${key}`;
    } else if (activeStorage === "aws") {
      const s3 = new aws.S3({
        accessKeyId: settingJSON.awsAccessKey,
        secretAccessKey: settingJSON.awsSecretKey,
        endpoint: new aws.Endpoint(settingJSON.awsHostname),
        s3ForcePathStyle: true,
      });
      const key = `${folderStructure}/${path.basename(fileName)}`;
      await s3.putObject({
        Bucket: settingJSON.awsBucketName,
        Key: key,
        Body: buffer,
        ACL: "public-read",
      }).promise();
      url = `${settingJSON.awsEndpoint}/${key}`;
    }

    return res.status(200).json({
      status: true,
      message: "File uploaded successfully",
      url,
    });
  } catch (error) {
    console.error("uploadContent error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//upload multiple content
exports.uploadMultipleContent = async (req, res) => {
  try {
    if (!req.body?.folderStructure) {
      return res.status(200).json({ status: false, message: "Oops! Invalid folder structure." });
    }


    const files = req.files || (req.file ? [req.file] : []);
    console.log("req.file:", req.file, "req.files:", req.files);

    if (!files || files.length === 0) {
      return res.status(400).json({ status: false, message: "Please upload valid files." });
    }

    console.log("Multiple Upload started for app side .......", files);

    const activeStorage = await getActiveStorage();
    const folderStructure = req.body?.folderStructure;

    const uploadedFiles = files.map((file) => {
      let fileUrl = "";

      if (activeStorage === "local") {
        fileUrl = `${process.env.baseURL}/uploads/${file.originalname}`;
      } else if (activeStorage === "digitalocean") {
        fileUrl = `${settingJSON?.doEndpoint}/${folderStructure}/${file.originalname}`;
      } else if (activeStorage === "aws") {
        const awsEndpoint = settingJSON.awsEndpoint;

        fileUrl = `${awsEndpoint}/${folderStructure}/${file.originalname}`;
      }

      return fileUrl;
    });

    return res.status(200).json({
      status: true,
      message: "Files uploaded successfully.",
      urls: uploadedFiles,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//delete content
exports.deleteContent = async (req, res) => {
  try {
    const { fileUrl } = req.query;

    if (!fileUrl) {
      return res.status(400).json({
        status: false,
        message: "Missing fileUrl in request query.",
      });
    }

    await deleteFromStorage(fileUrl);

    return res.status(200).json({
      status: true,
      message: "File deleted successfully.",
    });
  } catch (error) {
    console.error("File deletion error:", error.message);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};
