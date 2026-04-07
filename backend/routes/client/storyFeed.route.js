const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");
const StoryFeedController = require("../../controllers/client/storyFeed.controller");

route.post("/upload", checkAccessWithSecretKey(), StoryFeedController.uploadStoryFeed);
route.post("/view", checkAccessWithSecretKey(), StoryFeedController.viewStoryFeed);
route.get("/feed", checkAccessWithSecretKey(), StoryFeedController.fetchStoryFeed);

module.exports = route;
