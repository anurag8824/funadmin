//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const songController = require("../../controllers/admin/song.coontroller");

//create songList
route.post("/createSong", checkAccessWithSecretKey(), songController.createSong);

//update songList
route.patch("/updateSong", checkAccessWithSecretKey(), songController.updateSong);

//get all song
route.get("/getSongs", checkAccessWithSecretKey(), songController.getSongs);

//delete song
route.delete("/deletesong", checkAccessWithSecretKey(), songController.deletesong);

module.exports = route;
