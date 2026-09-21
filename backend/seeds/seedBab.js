const Bab = require("../models/bab");
const curriculumData = require("./curriculumData");
const seedJenjang = require("./seedJenjang");
const seedKelas = require("./seedKelas");
const { connectDB, disconnectDB } = require("./seedConnection");

async function seedBab(existingKelasMap = null) {
  let kelasMap = existingKelasMap;

  if (!kelasMap) {
    const jenjangMap = await seedJenjang();
    kelasMap = await seedKelas(jenjangMap);
  }

  const babMap = {};

  for (const item of curriculumData.bab) {
    const kelasId = kelasMap[item.kelas_key];

    if (!kelasId) {
      throw new Error(
        `Kelas tidak ditemukan untuk BAB ${item.id}: ${item.kelas_key}`
      );
    }

    const bab = await Bab.findOneAndUpdate(
      {
        kelas_id: kelasId,
        name: item.name,
      },
      {
        $set: {
          kelas_id: kelasId,
          name: item.name,
          description: item.description,
          display_order: item.display_order,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      }
    );

    babMap[item.id] = bab._id;
  }

  console.log(`BAB seeded: ${curriculumData.bab.length}`);
  return { kelasMap, babMap };
}

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedBab();
    } catch (error) {
      console.error("Seed BAB gagal:", error);
      process.exitCode = 1;
    } finally {
      await disconnectDB();
    }
  })();
}

module.exports = seedBab;