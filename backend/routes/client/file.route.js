//express
const express = require("express");
const route = express.Router();

//upload.js for multiple content (still uses multer)
const multipleUpload = require("../../util/uploadMultipleMiddleware");

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const FileController = require("../../controllers/client/file.controller");

//upload content: raw body (no multer). Send file bytes in POST body, headers: X-File-Name, X-Folder-Structure
route.put(
  "/upload-file",
  express.raw({ type: "application/octet-stream", limit: "500mb" }),
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
