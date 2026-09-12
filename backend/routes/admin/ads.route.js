const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");
const adsController = require("../../controllers/admin/ads.controller");

route.get("/placements", checkAccessWithSecretKey(), adsController.getPlacements);
route.patch("/placement", checkAccessWithSecretKey(), adsController.upsertPlacement);
route.patch("/kill", checkAccessWithSecretKey(), adsController.setKillSwitch);

route.get("/campaigns", checkAccessWithSecretKey(), adsController.getCampaigns);
route.post("/campaign", checkAccessWithSecretKey(), adsController.createCampaign);
route.patch("/campaign", checkAccessWithSecretKey(), adsController.updateCampaign);
route.delete("/campaign", checkAccessWithSecretKey(), adsController.deleteCampaign);

route.post("/creative", checkAccessWithSecretKey(), adsController.createCreative);
route.patch("/creative", checkAccessWithSecretKey(), adsController.updateCreative);
route.delete("/creative", checkAccessWithSecretKey(), adsController.deleteCreative);

route.get("/stats", checkAccessWithSecretKey(), adsController.getStats);

module.exports = route;
