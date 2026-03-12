//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const PostController = require("../../controllers/admin/post.controller");

//upload fake post
route.post("/uploadfakePost", checkAccessWithSecretKey(), PostController.uploadfakePost);

//update fake post
route.patch("/updatefakePost", checkAccessWithSecretKey(), PostController.updatefakePost);

//get real or fake posts
route.get("/getPosts", checkAccessWithSecretKey(), PostController.getPosts);

//get particular user's posts
route.get("/getUserPost", checkAccessWithSecretKey(), PostController.getUserPost);

//get particular post details
route.get("/getDetailOfPost", checkAccessWithSecretKey(), PostController.getDetailOfPost);

//delete post
route.delete("/deletePost", checkAccessWithSecretKey(), PostController.deletePost);

module.exports = route;
