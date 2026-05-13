//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const ChatController = require("../../controllers/client/chat.controller");

//create chat ( image or audio )
route.post("/createChat", checkAccessWithSecretKey(), ChatController.createChat);
route.delete("/deleteChatMessage", checkAccessWithSecretKey(), ChatController.deleteChatMessage);
route.patch("/editChatMessage", checkAccessWithSecretKey(), ChatController.editChatMessage);
route.post("/reactToMessage", checkAccessWithSecretKey(), ChatController.reactToMessage);

//get old chat between the users
route.get("/getOldChat", checkAccessWithSecretKey(), ChatController.getOldChat);

module.exports = route;
