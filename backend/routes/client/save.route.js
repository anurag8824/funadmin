const express = require("express");
const route = express.Router();
const checkAccessWithSecretKey = require("../../checkAccess");
const SaveController = require("../../controllers/client/save.controller");

route.post("/toggle", checkAccessWithSecretKey(), SaveController.toggleSave);
route.get("/getSaved", checkAccessWithSecretKey(), SaveController.getSaved);

module.exports = route;
