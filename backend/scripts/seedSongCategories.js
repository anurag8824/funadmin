/**
 * Seed default song categories into MongoDB.
 *
 * Run from backend root:
 *   node scripts/seedSongCategories.js
 *
 * Optional:
 *   node scripts/seedSongCategories.js --force   # insert even if categories already exist
 */

require("dotenv").config({ path: ".env" });
const mongoose = require("mongoose");
const SongCategory = require("../models/songCategory.model");

const DEFAULT_CATEGORIES = [
  {
    name: "Trending",
    image: "https://api.funtaap.com/uploads/songCategory/trending.png",
  },
  {
    name: "Pop",
    image: "https://api.funtaap.com/uploads/songCategory/pop.png",
  },
  {
    name: "Hip Hop",
    image: "https://api.funtaap.com/uploads/songCategory/hiphop.png",
  },
  {
    name: "EDM",
    image: "https://api.funtaap.com/uploads/songCategory/edm.png",
  },
  {
    name: "Romantic",
    image: "https://api.funtaap.com/uploads/songCategory/romantic.png",
  },
  {
    name: "Bollywood",
    image: "https://api.funtaap.com/uploads/songCategory/bollywood.png",
  },
  {
    name: "Punjabi",
    image: "https://api.funtaap.com/uploads/songCategory/punjabi.png",
  },
  {
    name: "Devotional",
    image: "https://api.funtaap.com/uploads/songCategory/devotional.png",
  },
  {
    name: "Instrumental",
    image: "https://api.funtaap.com/uploads/songCategory/instrumental.png",
  },
  {
    name: "Others",
    image: "https://api.funtaap.com/uploads/songCategory/others.png",
  },
];

async function main() {
  const mongoUri = process.env.MongoDb_Connection_String;
  if (!mongoUri) {
    throw new Error("MongoDb_Connection_String is missing in .env");
  }

  const force = process.argv.includes("--force");

  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");

  const existingCount = await SongCategory.countDocuments();
  console.log(`Current song categories: ${existingCount}`);

  if (existingCount > 0 && !force) {
    console.log("⚠️ Categories already exist. Skipping insert.");
    console.log("   Use --force to insert missing names only.");
    await mongoose.disconnect();
    return;
  }

  let inserted = 0;
  let skipped = 0;

  for (const category of DEFAULT_CATEGORIES) {
    const exists = await SongCategory.findOne({
      name: { $regex: `^${category.name}$`, $options: "i" },
    }).lean();

    if (exists) {
      skipped += 1;
      console.log(`⏭️  Skip existing: ${category.name}`);
      continue;
    }

    await SongCategory.create({
      name: category.name,
      image: category.image,
    });
    inserted += 1;
    console.log(`➕ Inserted: ${category.name}`);
  }

  const total = await SongCategory.countDocuments();
  console.log("\nDone.");
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Total:    ${total}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("❌ Seed failed:", error.message || error);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
