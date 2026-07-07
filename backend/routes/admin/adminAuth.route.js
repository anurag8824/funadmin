const express = require("express");
const route = express.Router();
const AdminAuthController = require("../../controllers/admin/adminAuth.controller");

route.post("/signUp", AdminAuthController.signUp);
route.post("/login", AdminAuthController.login);

module.exports = route;
