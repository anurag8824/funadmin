//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const StoryController = require("../../controllers/admin/story.controller");

// Upload Fake Story
route.post("/uploadFakeStory", checkAccessWithSecretKey(), StoryController.uploadFakeStory);

// Update Fake Story
route.patch("/updateFakeStory", checkAccessWithSecretKey(), StoryController.updateFakeStory);

// Get all stories
route.get("/getAllStories", checkAccessWithSecretKey(), StoryController.getAllStories);

// Delete Story
route.delete("/removeStory", checkAccessWithSecretKey(), StoryController.removeStory);

module.exports = route;
