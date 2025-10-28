const getActiveStorage = async () => {
  const settings = settingJSON; // Replace this with actual settings loading logic if necessary

  if (settings.storage.local) return "local";
  if (settings.storage.awsS3) return "aws";
  if (settings.storage.digitalOcean) return "digitalocean";

  return "local"; // Fallback to local storage if no active storage is found
};

const { deleteFromStorage } = require("../../util/storageHelper");

//upload content
exports.uploadContent = async (req, res) => {
  try {
    if (!req.body?.folderStructure || !req.body?.keyName) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    if (!req?.file) {
      return res.status(200).json({ status: false, message: "Please upload a valid files." });
    }

    console.log("Upload started for app side .......", req.file);

    let url = "";
    const activeStorage = await getActiveStorage();

    if (activeStorage === "local") {
      url = `${process.env.baseURL}/uploads/${req.file.originalname}`;
    } else if (activeStorage === "digitalocean") {
      url = `${settingJSON?.doEndpoint}/${req.body.folderStructure}/${req.file.originalname}`;
    } else if (activeStorage === "aws") {
      const awsEndpoint = settingJSON.awsEndpoint;

      url = `${awsEndpoint}/${req.body.folderStructure}/${req.file.originalname}`;
    }

    return res.status(200).json({
      status: true,
      message: "File uploaded successfully",
      url,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//upload multiple content
exports.uploadMultipleContent = async (req, res) => {
  try {
    if (!req.body?.folderStructure) {
      return res.status(200).json({ status: false, message: "Oops! Invalid folder structure." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(200).json({ status: false, message: "Please upload valid files." });
    }

    console.log("Multiple Upload started for app side .......", req.files);

    const activeStorage = await getActiveStorage();
    const folderStructure = req.body?.folderStructure;

    const uploadedFiles = req.files.map((file) => {
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
