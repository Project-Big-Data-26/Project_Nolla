const Bab = require("../models/bab");
const Subbab = require("../models/subbab");
const curriculumData = require("./curriculumData");
const seedBab = require("./seedBab");
const { connectDB, disconnectDB } = require("./seedConnection");

async function seedSubbab(existingBabMap = null) {
  let babMap = existingBabMap;

  if (!babMap) {
    const result = await seedBab();
    babMap = result.babMap;
  }

  let total = 0;

  for (const item of curriculumData.bab) {
    const babId = babMap[item.id];

    if (!babId) {
      throw new Error(`BAB MongoDB tidak ditemukan untuk ${item.id}`);
    }

    for (const subbab of item.subbab) {
      await Subbab.findOneAndUpdate(
        {
          bab_id: babId,
          name: subbab.name,
        },
        {
          $set: {
            bab_id: babId,
            name: subbab.name,
            description: subbab.description,
            display_order: subbab.display_order,
          },
        },
        {
          upsert: true,
          returnDocument: "after",
          setDefaultsOnInsert: true,
        }
      );

      total += 1;
    }
  }

  console.log(`Subbab seeded: ${total}`);
  return total;
}

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedSubbab();
    } catch (error) {
      console.error("Seed subbab gagal:", error);
      process.exitCode = 1;
    } finally {
      await disconnectDB();
    }
  })();
}

module.exports = seedSubbab;