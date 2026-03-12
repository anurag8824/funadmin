//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const settingController = require("../../controllers/client/setting.controller");

//get setting data
route.get("/getSetting", checkAccessWithSecretKey(), settingController.getSetting);

//get ad setting
route.get("/fetchAdSetting", checkAccessWithSecretKey(), settingController.fetchAdSetting);

//get only profilePhotoList from settings
route.get("/listProfilePhotos", checkAccessWithSecretKey(), settingController.listProfilePhotos);

module.exports = route;
