//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const DraftController = require("../../controllers/client/draft.controller");

//save draft (create or update)
route.post("/saveDraft", checkAccessWithSecretKey(), DraftController.saveDraft);

//get all drafts for a user
route.get("/getDrafts", checkAccessWithSecretKey(), DraftController.getDrafts);

//delete a draft
route.delete("/deleteDraft", checkAccessWithSecretKey(), DraftController.deleteDraft);

//update draft fields
route.patch("/updateDraft", checkAccessWithSecretKey(), DraftController.updateDraft);

module.exports = route;
