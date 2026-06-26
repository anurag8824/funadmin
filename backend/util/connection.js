//mongoose
const mongoose = require("mongoose");

mongoose.connect(process.env.MongoDb_Connection_String, {
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  connectTimeoutMS: 10_000,
  maxPoolSize: 50,
});

const db = mongoose.connection;

module.exports = db;
