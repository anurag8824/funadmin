//get setting
exports.getSetting = async (req, res) => {
  try {
    const setting = settingJSON ? settingJSON : null;
    if (!setting) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    return res.status(200).json({ status: true, message: "Success", data: setting });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get ad setting
exports.fetchAdSetting = async (req, res) => {
  try {
    const setting = settingJSON ? settingJSON : null;
    if (!setting) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    return res.status(200).json({ status: true, message: "Success", adSetting: setting });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get only profilePhotoList from settings
exports.listProfilePhotos = async (req, res) => {
  try {
    const setting = settingJSON ? settingJSON : null;
    if (!setting || !setting.profilePictureCollection) {
      return res.status(200).json({ status: false, message: "profilePhotoList not found in settings." });
    }

    return res.status(200).json({
      status: true,
      message: "Success",
      data: setting.profilePictureCollection,
    });
  } catch (error) {
    console.error("Error in listProfilePhotos:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
