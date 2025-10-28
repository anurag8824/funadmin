//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const settingController = require("../../controllers/admin/setting.controller");

//update Setting
route.patch("/updateSetting", checkAccessWithSecretKey(), settingController.updateSetting);

//get setting data
route.get("/getSetting", checkAccessWithSecretKey(), settingController.getSetting);

//handle setting switch
route.patch("/handleSwitch", checkAccessWithSecretKey(), settingController.handleSwitch);

//handle water mark setting
route.patch("/modifyWatermarkSetting", checkAccessWithSecretKey(), settingController.modifyWatermarkSetting);

//handle advertisement setting switch
route.patch("/switchAdSetting", checkAccessWithSecretKey(), settingController.switchAdSetting);

//handle update storage
route.patch("/switchStorageOption", checkAccessWithSecretKey(), settingController.switchStorageOption);

//manage user profile picture collection
route.patch("/updateProfilePictureCollection", checkAccessWithSecretKey(), settingController.updateProfilePictureCollection);

module.exports = route;
