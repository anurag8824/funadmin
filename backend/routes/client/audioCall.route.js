const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");
const audioCallController = require("../../controllers/client/audioCall.controller");

// Routes
route.post("/create", checkAccessWithSecretKey(), audioCallController.createAudioCall);
route.post("/update-status", checkAccessWithSecretKey(), audioCallController.updateCallStatus);
route.get("/history", checkAccessWithSecretKey(), audioCallController.getCallHistory);
route.get("/:callId", checkAccessWithSecretKey(), audioCallController.getCallDetails);

module.exports = route;
