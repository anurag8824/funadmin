const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const fs = require("fs");
const path = require("path");

const localStoragePath = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(localStoragePath)) {
  fs.mkdirSync(localStoragePath, { recursive: true });
}

function getSettings() {
  return global.settingJSON || {};
}

function createS3Instance(hostname, accessKeyId, secretAccessKey) {
  if (!hostname || !accessKeyId || !secretAccessKey) return null;
  return new aws.S3({
    accessKeyId,
    secretAccessKey,
    endpoint: new aws.Endpoint(hostname),
    s3ForcePathStyle: true,
  });
}

function buildStorageOptions(settings) {
  const digitalOceanS3 = createS3Instance(
    settings.doHostname,
    settings.doAccessKey,
    settings.doSecretKey,
  );
  const awsS3Client = createS3Instance(
    settings.awsHostname,
    settings.awsAccessKey,
    settings.awsSecretKey,
  );

  const options = {
    local: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, localStoragePath);
      },
      filename: (req, file, cb) => {
        cb(null, file.originalname);
      },
    }),
  };

  if (digitalOceanS3 && settings.doBucketName) {
    options.digitalocean = multerS3({
      s3: digitalOceanS3,
      bucket: settings.doBucketName,
      acl: "public-read",
      key: (req, file, cb) => {
        const folder = req.body.folderStructure;
        cb(null, `${folder}/${file.originalname}`);
      },
    });
  }

  if (awsS3Client && settings.awsBucketName) {
    options.aws = multerS3({
      s3: awsS3Client,
      bucket: settings.awsBucketName,
      acl: "public-read",
      key: (req, file, cb) => {
        const folder = req.body.folderStructure;
        cb(null, `${folder}/${file.originalname}`);
      },
    });
  }

  return options;
}

const getActiveStorage = async () => {
  const settings = getSettings();
  if (settings.storage?.local) return "local";
  if (settings.storage?.awsS3 && settings.awsHostname) return "aws";
  if (settings.storage?.digitalOcean && settings.doHostname) return "digitalocean";
  return "local";
};

const uploadMiddleware = async (req, res, next) => {
  try {
    console.log("uploadMiddleware: Request received");
    console.log("uploadMiddleware: Content-Type:", req.headers["content-type"]);
    console.log("uploadMiddleware: Content-Length:", req.headers["content-length"]);

    const storageOptions = buildStorageOptions(getSettings());
    const activeStorage = await getActiveStorage();
    console.log("uploadMiddleware: Active storage:", activeStorage);

    const storage = storageOptions[activeStorage] || storageOptions.local;
    const multerInstance = multer({
      storage,
      fileFilter: (req, file, cb) => {
        console.log("uploadMiddleware: fileFilter called");
        console.log("uploadMiddleware: file.fieldname:", file.fieldname);
        console.log("uploadMiddleware: file.originalname:", file.originalname);
        console.log("uploadMiddleware: file.mimetype:", file.mimetype);
        cb(null, true);
      },
    });

    multerInstance.any()(req, res, (err) => {
      if (err) {
        console.log("uploadMiddleware: Multer error:", err);
        console.log("uploadMiddleware: Error code:", err.code);
        console.log("uploadMiddleware: Error field:", err.field);
        console.log("uploadMiddleware: Error message:", err.message);
        return next(err);
      }
      console.log("uploadMiddleware: Multer processed.");
      console.log("uploadMiddleware: req.files array length:", req.files ? req.files.length : 0);
      if (req.files && req.files.length > 0) {
        req.files.forEach((file, index) => {
          console.log(`uploadMiddleware: req.files[${index}]:`, {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          });
        });
        const contentFile = req.files.find((f) => f.fieldname === "content");
        if (contentFile) {
          req.file = contentFile;
          console.log("uploadMiddleware: Found 'content' file and set as req.file");
        } else {
          console.log("uploadMiddleware: No file with fieldname 'content' found");
        }
      } else {
        console.log("uploadMiddleware: req.files is empty or undefined");
      }
      console.log("uploadMiddleware: req.body:", JSON.stringify(req.body));
      next();
    });
  } catch (error) {
    console.log("uploadMiddleware: Exception:", error);
    next(error);
  }
};

module.exports = uploadMiddleware;
