//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const StoryViewController = require("../../controllers/client/storyView.controller");

//get user's story viewers
route.get("/getStoryViewers", checkAccessWithSecretKey(), StoryViewController.getStoryViewers);

module.exports = route;
