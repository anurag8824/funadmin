const express = require("express");
const route = express.Router();
const checkAccessWithSecretKey = require("../../checkAccess");
const ReelAnalyticsController = require("../../controllers/client/reelAnalytics.controller");

route.post("/batch", checkAccessWithSecretKey(), ReelAnalyticsController.postBatch);

module.exports = route;
