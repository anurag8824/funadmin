//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const reactionController = require("../../controllers/admin/reaction.controller");

//create reaction
route.post("/addReaction", checkAccessWithSecretKey(), reactionController.addReaction);

//update reaction
route.patch("/modifyReaction", checkAccessWithSecretKey(), reactionController.modifyReaction);

//reaction is active or not
route.patch("/hasActiveReaction", checkAccessWithSecretKey(), reactionController.hasActiveReaction);

//get reaction
route.get("/fetchReaction", checkAccessWithSecretKey(), reactionController.fetchReaction);

//delete reaction
route.delete("/removeReaction", checkAccessWithSecretKey(), reactionController.removeReaction);

module.exports = route;
