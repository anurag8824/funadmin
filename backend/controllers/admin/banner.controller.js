const Banner = require("../../models/banner.model");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

//get banner
exports.getBanner = async (req, res) => {
  try {
    const banner = await Banner.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({ status: true, message: "Retrive banner.", data: banner });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//create banner
exports.createBanner = async (req, res) => {
  try {
    if (!req.body.image) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const banner = new Banner();
    banner.image = req.body.image ? req.body.image : banner.image;
    await banner.save();

    return res.status(200).json({
      status: true,
      message: "Banner has been created by admin!",
      data: banner,
    });
  } catch (error) {
    if (req?.body?.image) {
      await deleteFromStorage(req?.body?.image);
    }

    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//update banner
exports.updateBanner = async (req, res) => {
  try {
    if (!req.query.bannerId) {
      if (req?.body?.image) {
        await deleteFromStorage(req?.body?.image);
      }

      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const banner = await Banner.findById(req.query.bannerId);
    if (!banner) {
      if (req?.body?.image) {
        await deleteFromStorage(req?.body?.image);
      }

      return res.status(200).json({ status: false, message: "Oops ! Banner does not found!" });
    }

    if (req?.body?.image) {
      await deleteFromStorage(banner.image);

      banner.image = req?.body?.image ? req?.body?.image : banner.image;
    }

    await banner.save();

    return res.status(200).json({
      status: true,
      message: "Banner has been updated by admin!",
      data: banner,
    });
  } catch (error) {
    console.log(error);

    if (req?.body?.image) {
      await deleteFromStorage(req?.body?.image);
    }

    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete banner
exports.deleteBanner = async (req, res) => {
  try {
    if (!req.query.bannerId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const banner = await Banner.findById(req.query.bannerId);
    if (!banner) {
      return res.status(200).json({ status: false, message: "Oops ! Banner does not found!" });
    }

    if (banner?.image) {
      await deleteFromStorage(banner.image);
    }

    await banner.deleteOne();

    return res.status(200).json({
      status: true,
      message: "Banner has been deleted by admin!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//banner is active or not
exports.isActive = async (req, res) => {
  try {
    if (!req.query.bannerId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const banner = await Banner.findById(req.query.bannerId);
    if (!banner) {
      return res.status(200).json({ status: false, message: "Oops ! Banner does not found!" });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    return res.status(200).json({
      status: true,
      message: "Banner has been updated by admin!",
      data: banner,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
