//express
const express = require("express");
const route = express.Router();

//AdminMiddleware
const AdminMiddleware = require("../../middleware/admin.middleware");

//require admin's route.js
const admin = require("./admin.route");
const post = require("./post.route");
const setting = require("./setting.route");
const video = require("./video.route");
const song = require("./song.route");
const songCategory = require("./songCategory.route");
const hashTag = require("./hashTag.route");
const verificationRequest = require("./verificationRequest.route");
const gift = require("./gift.route");
const user = require("./user.route");
const dashboard = require("./dashboard.route");
const report = require("./report.route");
const currency = require("./currency.route");
const history = require("./history.route");
const withdraw = require("./withdraw.route");
const withdrawRequest = require("./withDrawRequest.route");
const coinplan = require("./coinplan.route");
const complaint = require("./complaint.route");
const banner = require("./banner.route");
const reportReason = require("./reportReason.route");
const livevideo = require("./livevideo.route");
const reaction = require("./reaction.route");
const story = require("./story.route");
const login = require("./login.route");
const file = require("./file.route");

//exports admin's route.js
route.use("/admin", admin);
route.use("/post", AdminMiddleware, post);
route.use("/setting", AdminMiddleware, setting);
route.use("/video", AdminMiddleware, video);
route.use("/song", AdminMiddleware, song);
route.use("/songCategory", AdminMiddleware, songCategory);
route.use("/hashTag", AdminMiddleware, hashTag);
route.use("/verificationRequest", AdminMiddleware, verificationRequest);
route.use("/gift", AdminMiddleware, gift);
route.use("/user", AdminMiddleware, user);
route.use("/dashboard", AdminMiddleware, dashboard);
route.use("/report", AdminMiddleware, report);
route.use("/currency", AdminMiddleware, currency);
route.use("/history", AdminMiddleware, history);
route.use("/withdraw", AdminMiddleware, withdraw);
route.use("/withdrawRequest", AdminMiddleware, withdrawRequest);
route.use("/coinplan", AdminMiddleware, coinplan);
route.use("/complaint", AdminMiddleware, complaint);
route.use("/banner", AdminMiddleware, banner);
route.use("/reportReason", AdminMiddleware, reportReason);
route.use("/livevideo", AdminMiddleware, livevideo);
route.use("/reaction", AdminMiddleware, reaction);
route.use("/story", AdminMiddleware, story);
route.use("/login", login);
route.use("/file", file);

module.exports = route;
