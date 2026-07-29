const express = require("express");
const route = express.Router();
const ShareLandingController = require("../controllers/shareLanding.controller");

route.get("/.well-known/assetlinks.json", ShareLandingController.assetLinks);
route.get("/video/:id", ShareLandingController.shareVideo);
route.get("/post/:id", ShareLandingController.sharePost);
route.get("/story/:id", ShareLandingController.shareStory);

module.exports = route;
