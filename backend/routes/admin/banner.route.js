//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const bannerController = require("../../controllers/admin/banner.controller");

//get banner
route.get("/getBanner", checkAccessWithSecretKey(), bannerController.getBanner);

//banner create
route.post("/createBanner", checkAccessWithSecretKey(), bannerController.createBanner);

//banner update
route.patch("/updateBanner", checkAccessWithSecretKey(), bannerController.updateBanner);

//delete banner
route.delete("/deleteBanner", checkAccessWithSecretKey(), bannerController.deleteBanner);

//banner is active or not
route.patch("/isActive", checkAccessWithSecretKey(), bannerController.isActive);

module.exports = route;
