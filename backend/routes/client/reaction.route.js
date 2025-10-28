//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const reactionController = require("../../controllers/client/reaction.controller");

//get reaction
route.get("/retrieveReaction", checkAccessWithSecretKey(), reactionController.retrieveReaction);

module.exports = route;
