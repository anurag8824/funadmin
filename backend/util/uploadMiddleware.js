const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const fs = require("fs");
const path = require("path");

const createS3Instance = (hostname, accessKeyId, secretAccessKey) => {
  return new aws.S3({
    accessKeyId,
    secretAccessKey,
    endpoint: new aws.Endpoint(hostname),
    s3ForcePathStyle: true,
  });
};

const digitalOceanS3 = createS3Instance(settingJSON.doHostname, settingJSON.doAccessKey, settingJSON.doSecretKey);

const awsS3 = createS3Instance(settingJSON.awsHostname, settingJSON.awsAccessKey, settingJSON.awsSecretKey);

const localStoragePath = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(localStoragePath)) {
  fs.mkdirSync(localStoragePath, { recursive: true });
}

const storageOptions = {
  local: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, localStoragePath);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  }),

  digitalocean: multerS3({
    s3: digitalOceanS3,
    bucket: settingJSON.doBucketName,
    acl: "public-read",
    key: (req, file, cb) => {
      console.log("request body in uploadMiddleware :  ", req.body);

      const folder = req.body.folderStructure;
      cb(null, `${folder}/${file.originalname}`);
    },
  }),

  aws: multerS3({
    s3: awsS3,
    bucket: settingJSON.awsBucketName,
    acl: "public-read",
    key: (req, file, cb) => {
      const folder = req.body.folderStructure;
      cb(null, `${folder}/${file.originalname}`);
    },
  }),
};

const getActiveStorage = async () => {
  const settings = settingJSON;
  if (settings.storage.local) return "local";
  if (settings.storage.awsS3) return "aws";
  if (settings.storage.digitalOcean) return "digitalocean";
  return "local"; // Fallback to local storage if no storage is active
};

const uploadMiddleware = async (req, res, next) => {
  try {
    console.log("uploadMiddleware: Request received");
    console.log("uploadMiddleware: Content-Type:", req.headers["content-type"]);
    console.log("uploadMiddleware: Content-Length:", req.headers["content-length"]);
    
    const activeStorage = await getActiveStorage(); // Dynamically fetch active storage
    console.log("uploadMiddleware: Active storage:", activeStorage);

    const multerInstance = multer({ 
      storage: storageOptions[activeStorage],
      // Add fileFilter to see what multer receives
      fileFilter: (req, file, cb) => {
        console.log("uploadMiddleware: fileFilter called");
        console.log("uploadMiddleware: file.fieldname:", file.fieldname);
        console.log("uploadMiddleware: file.originalname:", file.originalname);
        console.log("uploadMiddleware: file.mimetype:", file.mimetype);
        cb(null, true);
      }
    });
    
    // Try using .any() first to see all files multer receives
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
            size: file.size
          });
        });
        // Find the 'content' file
        const contentFile = req.files.find(f => f.fieldname === 'content');
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
    next(error); // Pass error to the error handler if any issue occurs
  }
};

module.exports = uploadMiddleware;
