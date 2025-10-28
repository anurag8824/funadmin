const express = require("express");
const route = express.Router();

//Controller
const coinplanController = require("../../controllers/admin/coinplan.controller");

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//create coinplan
route.post("/store", checkAccessWithSecretKey(), coinplanController.store);

//update coinplan
route.patch("/update", checkAccessWithSecretKey(), coinplanController.update);

//handle isActive switch
route.patch("/handleSwitch", checkAccessWithSecretKey(), coinplanController.handleSwitch);

//delete coinplan
route.delete("/delete", checkAccessWithSecretKey(), coinplanController.delete);

//get coinplan
route.get("/get", checkAccessWithSecretKey(), coinplanController.get);

//get coinplan histories of users (admin earning)
route.get("/fetchUserCoinplanTransactions", checkAccessWithSecretKey(), coinplanController.fetchUserCoinplanTransactions);


module.exports = route;
