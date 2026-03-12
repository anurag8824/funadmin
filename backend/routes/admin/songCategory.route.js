//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const songCategoryController = require("../../controllers/admin/songCategory.controller");

//create songCategory
route.post("/create", checkAccessWithSecretKey(), songCategoryController.create);

//update songCategory
route.patch("/update", checkAccessWithSecretKey(), songCategoryController.update);

//get all songCategory
route.get("/getSongCategory", checkAccessWithSecretKey(), songCategoryController.getSongCategory);

//delete songCategory
route.delete("/deleteSongCategory", checkAccessWithSecretKey(), songCategoryController.destroy);

module.exports = route;
