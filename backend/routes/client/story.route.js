//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const StoryController = require("../../controllers/client/story.controller");

//upload story
route.post("/uploadStory", checkAccessWithSecretKey(), StoryController.uploadStory);

//reaction story
route.post("/reactToStory", checkAccessWithSecretKey(), StoryController.reactToStory);

//reply story
route.post("/replyToStory", checkAccessWithSecretKey(), StoryController.replyToStory);

//view story
route.post("/viewStory", checkAccessWithSecretKey(), StoryController.viewStory);

//delete story
route.delete("/deleteStory", checkAccessWithSecretKey(), StoryController.deleteStory);

//get followed user's stories
route.get("/getFollowedUserStories", checkAccessWithSecretKey(), StoryController.getFollowedUserStories);

//get own stories
route.get("/getOwnStories", checkAccessWithSecretKey(), StoryController.getOwnStories);

module.exports = route;
