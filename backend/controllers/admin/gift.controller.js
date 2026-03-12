const Gift = require("../../models/gift.model");
const History = require("../../models/history.model");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

//create gift
exports.createGift = async (req, res, next) => {
  try {
    if (!req?.body?.type) {
      if (req?.body?.image) {
        await deleteFromStorage(req?.body?.image);
      }

      if (req?.body?.svgaImage) {
        await deleteFromStorage(req?.body?.svgaImage);
      }

      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const gift = new Gift();

    gift.coin = req?.body?.coin;
    gift.type = req?.body?.type;
    gift.image = req?.body?.image ? req?.body?.image : gift.image;
    gift.svgaImage = req?.body?.type == 3 ? (req?.body?.svgaImage ? req?.body?.svgaImage : "") : "";
    await gift.save();

    return res.status(200).json({ status: true, message: "Gift has been created by the admin.", data: gift });
  } catch (error) {
    if (req?.body?.image) {
      await deleteFromStorage(req?.body?.image);
    }

    if (req?.body?.svgaImage) {
      await deleteFromStorage(req?.body?.svgaImage);
    }

    console.log(error);
    return res.status(200).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//update gift
exports.updateGift = async (req, res, next) => {
  try {
    if (!req.query.giftId) {
      if (req?.body?.image) {
        await deleteFromStorage(req?.body?.image);
      }

      if (req?.body?.svgaImage) {
        await deleteFromStorage(req?.body?.svgaImage);
      }

      return res.status(200).json({ status: false, message: "giftId must be required." });
    }

    const gift = await Gift.findById(req.query.giftId);
    if (!gift) {
      if (req?.body?.image) {
        await deleteFromStorage(req?.body?.image);
      }

      if (req?.body?.svgaImage) {
        await deleteFromStorage(req?.body?.svgaImage);
      }

      return res.status(200).json({ status: false, message: "gift does not found." });
    }

    gift.type = req.body.type ? req.body.type : gift.type;
    gift.coin = req?.body?.coin ? req?.body?.coin : gift.coin;

    if (req?.body?.image) {
      await deleteFromStorage(gift.image);

      gift.image = req?.body?.image ? req?.body?.image : gift.image;
    }

    if (req?.body?.svgaImage) {
      await deleteFromStorage(gift.svgaImage);

      gift.svgaImage = req?.body?.svgaImage ? req?.body?.svgaImage : gift.svgaImage;
    }

    await gift.save();

    return res.status(200).json({ status: true, message: "Gift has been updated by the admin.", data: gift });
  } catch (error) {
    if (req?.body?.image) {
      await deleteFromStorage(req?.body?.image);
    }

    if (req?.body?.svgaImage) {
      await deleteFromStorage(req?.body?.svgaImage);
    }

    console.log(error);
    return res.status(200).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get all gifts
exports.getGifts = async (req, res, next) => {
  try {
    const gift = await Gift.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      status: true,
      message: "Retrive gifts for the admin.",
      data: gift,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//delete gift
exports.deleteGift = async (req, res, next) => {
  try {
    if (!req.query.giftId) {
      return res.status(200).json({ status: false, message: "giftId must be required." });
    }

    const gift = await Gift.findById(req.query.giftId);
    if (!gift) {
      return res.status(200).json({ status: false, message: "gift does not found." });
    }

    if (gift?.image) {
      await deleteFromStorage(gift?.image);
    }

    if (gift?.svgaImage) {
      await deleteFromStorage(gift?.svgaImage);
    }

    await History.deleteMany({ giftId: gift._id });
    await gift.deleteOne();

    res.status(200).json({ status: true, message: "Gift has been deleted by the admin." });
  } catch (error) {
    return res.status(200).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
