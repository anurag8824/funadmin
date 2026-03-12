const Reaction = require("../../models/reaction.model");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

//create reaction
exports.addReaction = async (req, res) => {
  try {
    if (!req.body.image) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const reaction = new Reaction();
    reaction.image = req.body.image ? req.body.image : reaction.image;
    await reaction.save();

    return res.status(200).json({
      status: true,
      message: "Reaction has been created by admin!",
      data: reaction,
    });
  } catch (error) {
    if (req?.body?.image) {
      await deleteFromStorage(req?.body?.image);
    }

    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//update reaction
exports.modifyReaction = async (req, res) => {
  try {
    if (!req.body.reactionId) {
      if (req?.body?.image) {
        await deleteFromStorage(req?.body?.image);
      }

      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const reaction = await Reaction.findById(req.body.reactionId);
    if (!reaction) {
      if (req?.body?.image) {
        await deleteFromStorage(req?.body?.image);
      }

      return res.status(200).json({ status: false, message: "Oops ! Reaction does not found!" });
    }

    if (req?.body?.image) {
      await deleteFromStorage(reaction.image);

      reaction.image = req?.body?.image ? req?.body?.image : reaction.image;
    }

    await reaction.save();

    return res.status(200).json({
      status: true,
      message: "Reaction has been updated by admin!",
      data: reaction,
    });
  } catch (error) {
    console.log(error);

    if (req?.body?.image) {
      await deleteFromStorage(req?.body?.image);
    }

    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//reaction is active or not
exports.hasActiveReaction = async (req, res) => {
  try {
    if (!req.query.reactionId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const reaction = await Reaction.findById(req.query.reactionId);
    if (!reaction) {
      return res.status(200).json({ status: false, message: "Oops ! Reaction does not found!" });
    }

    reaction.isActive = !reaction.isActive;
    await reaction.save();

    return res.status(200).json({
      status: true,
      message: "Reaction has been updated by admin!",
      data: reaction,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get reaction
exports.fetchReaction = async (req, res) => {
  try {
    const reaction = await Reaction.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({ status: true, message: "Retrive reactions.", data: reaction });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete reaction
exports.removeReaction = async (req, res) => {
  try {
    if (!req.query.reactionId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const reaction = await Reaction.findById(req.query.reactionId);
    if (!reaction) {
      return res.status(200).json({ status: false, message: "Oops ! Reaction does not found!" });
    }

    if (reaction?.image) {
      await deleteFromStorage(reaction.image);
    }

    await reaction.deleteOne();

    return res.status(200).json({
      status: true,
      message: "Reaction has been deleted by admin!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
