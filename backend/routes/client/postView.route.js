const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");
const postViewController = require("../../controllers/client/postView.controller");

route.post("/createPostView", checkAccessWithSecretKey(), postViewController.createPostView);

module.exports = route;
