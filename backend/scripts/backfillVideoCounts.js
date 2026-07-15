/**
 * One-time backfill of denormalized likeCount / commentCount on videos.
 *
 * Usage (from funadmin-main/backend):
 *   node scripts/backfillVideoCounts.js
 *
 * Loads `.env` and uses MongoDb_Connection_String (same as the API).
 */
require("dotenv").config();
const mongoose = require("mongoose");

async function main() {
  const uri =
    process.env.MongoDb_Connection_String ||
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DB;
  if (!uri) {
    console.error("Missing MongoDb_Connection_String (check backend/.env)");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const videos = db.collection("videos");
  const likes = db.collection("likehistoryofpostorvideos");
  const comments = db.collection("postorvideocomments");

  const cursor = videos.find({}, { projection: { _id: 1 } });
  let updated = 0;
  while (await cursor.hasNext()) {
    const video = await cursor.next();
    const [likeCount, commentCount] = await Promise.all([
      likes.countDocuments({ videoId: video._id }),
      comments.countDocuments({ videoId: video._id }),
    ]);
    await videos.updateOne(
      { _id: video._id },
      { $set: { likeCount, commentCount } },
    );
    updated += 1;
    if (updated % 100 === 0) console.log(`Updated ${updated} videos...`);
  }

  console.log(`Done. Backfilled likeCount/commentCount on ${updated} videos.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
