//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const ComplaintController = require("../../controllers/client/complaint.controller");

//complaint or suggession by particular user
route.post("/complaintByUser", checkAccessWithSecretKey(), ComplaintController.complaintByUser);

module.exports = route;
