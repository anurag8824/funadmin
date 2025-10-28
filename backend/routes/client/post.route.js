//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const PostController = require("../../controllers/client/post.controller");

//upload post by particular user
route.post("/uploadPost", checkAccessWithSecretKey(), PostController.uploadPost);

//update post by particular user
route.patch("/updatePostByUser", checkAccessWithSecretKey(), PostController.updatePostByUser);

//if isFakeData on then real+fake posts otherwise fake posts
route.get("/getAllPosts", checkAccessWithSecretKey(), PostController.getAllPosts);

//get particular user's posts
route.get("/postsOfUser", checkAccessWithSecretKey(), PostController.postsOfUser);

//delete post
route.delete("/deletePostOfUser", checkAccessWithSecretKey(), PostController.deletePostOfUser);

//like or dislike of particular post by the particular user
route.post("/likeOrDislikeOfPost", checkAccessWithSecretKey(), PostController.likeOrDislikeOfPost);

//when user share the post then shareCount of the particular post increased
route.post("/shareCountOfPost", checkAccessWithSecretKey(), PostController.shareCountOfPost);

//delete post
route.delete("/deleteParticularPost", checkAccessWithSecretKey(), PostController.deleteParticularPost);

//get particular user's posts ( web )
route.get("/postsOfUserWeb", checkAccessWithSecretKey(), PostController.postsOfUserWeb);

//if isFakeData on then real+fake posts otherwise fake posts ( web )
route.get("/retrieveAllPosts", checkAccessWithSecretKey(), PostController.retrieveAllPosts);

module.exports = route;
