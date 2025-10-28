//express
const express = require("express");
const route = express.Router();

//s3multer
const upload = require("../../util/uploadMiddleware");

//upload.js for multiple content
const multipleUpload = require("../../util/uploadMultipleMiddleware");

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const FileController = require("../../controllers/client/file.controller");

//upload content
route.put(
  "/upload-file",
  function (request, response, next) {
    upload(request, response, function (error) {
      if (error) {
        console.log("error in file ", error);
      } else {
        console.log("File uploaded successfully.");
        next();
      }
    });
  },
  checkAccessWithSecretKey(),
  FileController.uploadContent
);

//upload multiple content
route.put(
  "/upload_multiple_files",
  function (request, response, next) {
    multipleUpload(request, response, function (error) {
      if (error) {
        console.log("Error in file multipleUpload: ", error);
        return response.status(400).json({ status: false, message: error.message });
      } else {
        console.log("Multiple Files uploaded successfully.");
        next();
      }
    });
  },
  checkAccessWithSecretKey(),
  FileController.uploadMultipleContent
);

//delete content
route.delete("/deleteContent", checkAccessWithSecretKey(), FileController.deleteContent);

module.exports = route;
