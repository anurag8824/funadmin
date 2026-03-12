//express
const express = require("express");
const route = express.Router();

//admin index.js
const admin = require("./admin/route");

//client index.js
const client = require("./client/route");

// simple health check (for load balancers, k8s, monitoring)
route.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

route.use("/admin", admin);
route.use("/client", client);

module.exports = route;
