const express = require("express");
const route = express.Router();
const checkAccessWithSecretKey = require("../../checkAccess");
const NoteController = require("../../controllers/client/note.controller");

route.get("/feed", checkAccessWithSecretKey(), NoteController.getNotesFeed);
route.post("/setNote", checkAccessWithSecretKey(), NoteController.setNote);

module.exports = route;
