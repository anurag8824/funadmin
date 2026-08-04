const express = require("express");
const route = express.Router();
const ShareLandingController = require("../controllers/shareLanding.controller");

route.get("/.well-known/assetlinks.json", ShareLandingController.assetLinks);
route.get("/video/:id", ShareLandingController.shareVideo);
route.get("/reel/:id", ShareLandingController.shareVideo);
route.get("/post/:id", ShareLandingController.sharePost);
route.get("/story/:id", ShareLandingController.shareStory);
route.get("/u/:username", ShareLandingController.shareProfile);
route.get("/profile/:id", async (req, res, next) => {
  // Allow /profile/{objectId} to open the same landing by resolving user
  try {
    const User = require("../models/user.model");
    const mongoose = require("mongoose");
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).send("Profile not found");
    }
    const user = await User.findById(id).select("userName").lean();
    if (!user?.userName) {
      return res.status(404).send("Profile not found");
    }
    req.params.username = user.userName;
    return ShareLandingController.shareProfile(req, res, next);
  } catch (e) {
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = route;
