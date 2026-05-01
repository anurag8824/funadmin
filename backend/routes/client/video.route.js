//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const VideoController = require("../../controllers/client/video.controller");
const VideoStreamController = require("../../controllers/client/videoStream.controller");

//upload video by particular user
route.post(
  "/uploadvideo",
  checkAccessWithSecretKey(),
  // upload.fields([
  //   { name: "videoImage", maxCount: 5 },
  //   { name: "videoUrl", maxCount: 5 },
  // ]),
  VideoController.uploadvideo
);

//update video by particular user
route.patch("/updateVideoByUser", checkAccessWithSecretKey(), VideoController.updateVideoByUser);

//get particular user's videos
route.get("/videosOfUser", checkAccessWithSecretKey(), VideoController.videosOfUser);

//if isFakeData on then real+fake videos otherwise fake videos
route.get("/getAllVideos", checkAccessWithSecretKey(), VideoController.getAllVideos);
//lightweight reels feed (metadata-first)
route.get("/getReelsFeedLite", checkAccessWithSecretKey(), VideoController.getReelsFeedLite);
route.get("/reelUploadJobStatus", checkAccessWithSecretKey(), VideoController.getReelUploadJobStatus);
route.post("/retryReelProcessing", checkAccessWithSecretKey(), VideoController.retryReelProcessing);

//delete video
route.delete("/deleteVideoOfUser", checkAccessWithSecretKey(), VideoController.deleteVideoOfUser);

//like or dislike of particular video by the particular user
route.post("/likeOrDislikeOfVideo", checkAccessWithSecretKey(), VideoController.likeOrDislikeOfVideo);

//when user share the video then shareCount of the particular video increased
route.post("/shareCountOfVideo", checkAccessWithSecretKey(), VideoController.shareCountOfVideo);

//delete video
route.delete("/deleteParticularVideo", checkAccessWithSecretKey(), VideoController.deleteParticularVideo);

//get videos of the particular song by particular user
route.get("/fetchVideosOfParticularSong", checkAccessWithSecretKey(), VideoController.fetchVideosOfParticularSong);

//get particular user's videos ( web )
route.get("/fetchUserVideos", checkAccessWithSecretKey(), VideoController.fetchUserVideos);

//get particular user's videos ( web )
route.get("/getVideoLibrary", checkAccessWithSecretKey(), VideoController.getVideoLibrary);

//chunk-wise stream: supports Range header for less data and faster start (reels)
route.get("/streamChunk", checkAccessWithSecretKey(), VideoStreamController.streamChunk);

module.exports = route;
