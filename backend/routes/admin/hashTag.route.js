//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const HashTagController = require("../../controllers/admin/hashTag.controller");

//create hashTag
route.post("/create", checkAccessWithSecretKey(), HashTagController.create);

//update hashTag
route.patch("/update", checkAccessWithSecretKey(), HashTagController.update);

//get hashTag
route.get("/getbyadmin", checkAccessWithSecretKey(), HashTagController.getbyadmin);

//delete hashTag
route.delete("/delete", checkAccessWithSecretKey(), HashTagController.delete);

//get all hashTag for deopdown
route.get("/getHashtag", checkAccessWithSecretKey(), HashTagController.getHashtag);

module.exports = route;
