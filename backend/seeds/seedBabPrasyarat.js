const Bab = require("../models/bab");
const BabPrasyarat = require("../models/babprasyarat");
const curriculumData = require("./curriculumData");
const seedBab = require("./seedBab");
const { connectDB, disconnectDB } = require("./seedConnection");

async function seedBabPrasyarat(existingBabMap = null) {
  let babMap = existingBabMap;

  if (!babMap) {
    const result = await seedBab();
    babMap = result.babMap;
  }

  let total = 0;

  for (const item of curriculumData.bab) {
    if (!item.prasyarat.length) {
      continue;
    }

    const babId = babMap[item.id];

    if (!babId) {
      throw new Error(`BAB MongoDB tidak ditemukan untuk ${item.id}`);
    }

    for (const prasyaratId of item.prasyarat) {
      const relasiBabId = babMap[prasyaratId];

      if (!relasiBabId) {
        throw new Error(
          `BAB prasyarat ${prasyaratId} untuk ${item.id} tidak ditemukan di curriculumData`
        );
      }

      await BabPrasyarat.findOneAndUpdate(
        {
          bab_id: babId,
          relasi_bab_id: relasiBabId,
        },
        {
          $set: {
            bab_id: babId,
            relasi_bab_id: relasiBabId,
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

  console.log(`Relasi BAB prasyarat seeded: ${total}`);
  return total;
}

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedBabPrasyarat();
    } catch (error) {
      console.error("Seed bab_prasyarat gagal:", error);
      process.exitCode = 1;
    } finally {
      await disconnectDB();
    }
  })();
}

module.exports = seedBabPrasyarat;