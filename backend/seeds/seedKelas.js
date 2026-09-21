const Kelas = require("../models/kelas");
const curriculumData = require("./curriculumData");
const seedJenjang = require("./seedJenjang");
const { connectDB, disconnectDB } = require("./seedConnection");

async function seedKelas(existingJenjangMap = null) {
  const jenjangMap = existingJenjangMap || await seedJenjang();
  const kelasMap = {};

  for (const item of curriculumData.kelas) {
    const jenjangId = jenjangMap[item.jenjang];

    if (!jenjangId) {
      throw new Error(
        `Jenjang tidak ditemukan untuk kelas ${item.key}: ${item.jenjang}`
      );
    }

    const kelas = await Kelas.findOneAndUpdate(
      {
        jenjang_id: jenjangId,
        name: item.name,
      },
      {
        $set: {
          jenjang_id: jenjangId,
          name: item.name,
          nomor_kelas: item.nomor_kelas,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      }
    );

    kelasMap[item.key] = kelas._id;
  }

  console.log(`Kelas seeded: ${curriculumData.kelas.length}`);
  return kelasMap;
}

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedKelas();
    } catch (error) {
      console.error("Seed kelas gagal:", error);
      process.exitCode = 1;
    } finally {
      await disconnectDB();
    }
  })();
}

module.exports = seedKelas;