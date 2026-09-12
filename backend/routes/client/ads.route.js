const express = require("express");
const route = express.Router();
const checkAccessWithSecretKey = require("../../checkAccess");
const AdsController = require("../../controllers/client/ads.controller");

route.post("/plan", checkAccessWithSecretKey(), AdsController.postPlan);
route.post("/events", checkAccessWithSecretKey(), AdsController.postEvents);

module.exports = route;
