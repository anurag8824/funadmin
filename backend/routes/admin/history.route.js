const express = require("express");
const route = express.Router();

//Controller
const historyController = require("../../controllers/admin/history.controller");

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

module.exports = route;
