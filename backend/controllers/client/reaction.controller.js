const Reaction = require("../../models/reaction.model");

//get reaction
exports.retrieveReaction = async (req, res) => {
  try {
    const reaction = await Reaction.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({ status: true, message: "Retrive reactions.", data: reaction });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
