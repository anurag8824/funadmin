//express
const express = require("express");
const app = express();

//cors
const cors = require("cors");

app.use(cors());
app.use(express.json({ limit: "100mb" }));

//logging middleware
const logger = require("morgan");
app.use(logger("dev"));

//path
const path = require("path");

//dotenv
require("dotenv").config({ path: ".env" });

const { ensureSettingsLoaded, updateSettingFile } = require("./util/bootstrapSettings");

//Declare global variable
global.settingJSON = global.settingJSON || {};
global.updateSettingFile = updateSettingFile;

//connection.js
const db = require("./util/connection");

db.on("error", () => {
  console.log("Connection Error: ");
});

db.once("open", async () => {
  console.log("Mongo: successfully connected to db");
  await ensureSettingsLoaded();

  try {
    const routes = require("./routes/route");
    app.use(routes);
    console.log("✅ API routes mounted successfully");
  } catch (err) {
    console.error("❌ CRITICAL: Failed to mount API routes:", err);
    app.use((req, res) => {
      res.status(503).json({
        status: false,
        message: "API temporarily unavailable (route bootstrap failed). Check server logs.",
      });
    });
  }
});

//socket io
const http = require("http");
const server = http.createServer(app);
global.io = require("socket.io")(server, {
  // More tolerant heartbeat for mobile/background transitions.
  pingInterval: 25000,
  pingTimeout: 60000,
  connectTimeout: 45000,
});

//socket.js
require("./socket");

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//set port and listen the request
server.listen(process?.env.PORT, () => {
  console.log("Hello World ! listening on " + process?.env.PORT);
});
