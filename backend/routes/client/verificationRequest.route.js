//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const verificationRequestController = require("../../controllers/client/verificationRequest.controller");

//verification request created by the user
route.post("/verificationRequestByUser", checkAccessWithSecretKey(), verificationRequestController.verificationRequestByUser);

//get particular user's verificationRequest
route.get("/verificationRequestOfUser", checkAccessWithSecretKey(), verificationRequestController.verificationRequestOfUser);

module.exports = route;
