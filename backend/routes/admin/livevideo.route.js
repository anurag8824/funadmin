//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const LivevideoController = require("../../controllers/admin/livevideo.controller");

//upload fake video
route.post("/uploadLivevideo", checkAccessWithSecretKey(), LivevideoController.uploadLivevideo);

//update fake video
route.patch("/updateLivevideo", checkAccessWithSecretKey(), LivevideoController.updateLivevideo);

//get live videos
route.get("/getVideos", checkAccessWithSecretKey(), LivevideoController.getVideos);

//delete video
route.delete("/deleteVideo", checkAccessWithSecretKey(), LivevideoController.deleteVideo);

//video live or not
route.patch("/isLive", checkAccessWithSecretKey(), LivevideoController.isLive);

module.exports = route;
