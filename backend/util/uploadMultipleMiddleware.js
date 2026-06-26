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
        const folderStructure = req.body?.folderStructure;
        const isDefaultPhoto = folderStructure?.toLowerCase()?.includes("defaultphoto");
        const targetPath = isDefaultPhoto
          ? path.join(localStoragePath, "defaultphoto")
          : path.join(localStoragePath);

        fs.mkdirSync(targetPath, { recursive: true });
        cb(null, targetPath);
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
        const folder = req.body.folderStructure || "uploads";
        cb(null, `${folder}/${file.originalname}`);
      },
    });
  }

  if (awsS3Client && settings.awsBucketName) {
    options.aws = multerS3({
      s3: awsS3Client,
      bucket: settings.awsBucketName,
      key: (req, file, cb) => {
        const folder = req.body.folderStructure || "uploads";
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

const getStorageType = async () => {
  const storageOptions = buildStorageOptions(getSettings());
  const activeStorage = await getActiveStorage();
  return storageOptions[activeStorage] || storageOptions.local;
};

const uploadMultipleMiddleware = async (req, res, next) => {
  const storage = await getStorageType();
  const upload = multer({
    storage: storage,
  }).array("content", 10);

  upload(req, res, next);
};

module.exports = uploadMultipleMiddleware;
