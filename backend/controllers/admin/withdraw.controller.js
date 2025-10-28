const Withdraw = require("../../models/withdraw.model");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

//store Withdraw
exports.store = async (req, res) => {
  try {
    if (!req?.body?.name || !req?.body?.details || !req.body.image) {
      if (req?.body?.image) {
        await deleteFromStorage(req?.body?.image);
      }

      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const withdraw = new Withdraw();
    withdraw.name = req?.body?.name;
    withdraw.details = req?.body?.details?.split(",");
    withdraw.image = req.body.image ? req.body.image : "";
    await withdraw.save();

    return res.status(200).json({
      status: true,
      message: "Withdraw method created by the admin.",
      data: withdraw,
    });
  } catch (error) {
    if (req?.body?.image) {
      await deleteFromStorage(req?.body?.image);
    }

    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//update Withdraw
exports.update = async (req, res) => {
  try {
    if (!req.query.withdrawId) {
      if (req?.body?.image) {
        await deleteFromStorage(req?.body?.image);
      }

      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const withdraw = await Withdraw.findById(req.query.withdrawId);
    if (!withdraw) {
      if (req?.body?.image) {
        await deleteFromStorage(req?.body?.image);
      }

      return res.status(200).json({ status: false, message: "Withdraw does not found." });
    }

    if (req?.body?.image) {
      await deleteFromStorage(withdraw.image);

      withdraw.image = req?.body?.image ? req?.body?.image : withdraw.image;
    }

    withdraw.name = req?.body?.name ? req?.body?.name : withdraw.name;
    withdraw.details = req?.body?.details.toString() ? req?.body?.details.toString().split(",") : withdraw.details;
    await withdraw.save();

    return res.status(200).json({
      status: true,
      message: "withdraw method updated by the admin.",
      data: withdraw,
    });
  } catch (error) {
    if (req?.body?.image) {
      await deleteFromStorage(req?.body?.image);
    }

    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get Withdraw
exports.get = async (req, res) => {
  try {
    const withdraw = await Withdraw.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({ status: true, message: "Retrive Withdraw methods.", data: withdraw });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete Withdraw
exports.delete = async (req, res) => {
  try {
    if (!req.query.withdrawId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const withdraw = await Withdraw.findById(req.query.withdrawId);
    if (!withdraw) {
      return res.status(200).json({ status: false, message: "Withdraw does not found." });
    }

    if (withdraw?.image) {
      await deleteFromStorage(withdraw?.image);
    }

    await withdraw.deleteOne();

    return res.status(200).json({ status: true, message: "Withdraw method deleted by the admin." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//handle isActive switch
exports.handleSwitch = async (req, res) => {
  try {
    if (!req.query.withdrawId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const withdraw = await Withdraw.findById(req.query.withdrawId);
    if (!withdraw) {
      return res.status(200).json({ status: false, message: "Withdraw does not found." });
    }

    withdraw.isActive = !withdraw.isActive;
    await withdraw.save();

    return res.status(200).json({ status: true, message: "Success", data: withdraw });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
