const Jenjang = require("../models/jenjang");
const curriculumData = require("./curriculumData");
const { connectDB, disconnectDB } = require("./seedConnection");

async function seedJenjang() {
  const jenjangMap = {};

  for (const item of curriculumData.jenjang) {
    const jenjang = await Jenjang.findOneAndUpdate(
      { name: item.name },
      { $set: { name: item.name } },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      }
    );

    jenjangMap[item.name] = jenjang._id;
  }

  console.log(`Jenjang seeded: ${curriculumData.jenjang.length}`);
  return jenjangMap;
}

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedJenjang();
    } catch (error) {
      console.error("Seed jenjang gagal:", error);
      process.exitCode = 1;
    } finally {
      await disconnectDB();
    }
  })();
}

module.exports = seedJenjang;