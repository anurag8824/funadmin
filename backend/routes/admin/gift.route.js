//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const GiftController = require("../../controllers/admin/gift.controller");

//create gift
route.post("/createGift", checkAccessWithSecretKey(), GiftController.createGift);

//update gift
route.patch("/updateGift", checkAccessWithSecretKey(), GiftController.updateGift);

//get gift
route.get("/getGifts", checkAccessWithSecretKey(), GiftController.getGifts);

//delete gift
route.delete("/deleteGift", checkAccessWithSecretKey(), GiftController.deleteGift);

module.exports = route;
