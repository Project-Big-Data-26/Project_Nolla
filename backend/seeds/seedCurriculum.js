const { connectDB, disconnectDB } = require("./seedConnection");
const curriculumData = require("./curriculumData");
const seedJenjang = require("./seedJenjang");
const seedKelas = require("./seedKelas");
const seedBab = require("./seedBab");
const seedSubbab = require("./seedSubbab");
const seedBabPrasyarat = require("./seedBabPrasyarat");

async function seedCurriculum() {
  console.log("=== SEED CURRICULUM DIMULAI ===");

  const jenjangMap = await seedJenjang();
  const kelasMap = await seedKelas(jenjangMap);
  const { babMap } = await seedBab(kelasMap);

  await seedSubbab(babMap);
  await seedBabPrasyarat(babMap);

  console.log("=== SEED CURRICULUM SELESAI ===");
  console.log({
    jenjang: curriculumData.jenjang.length,
    kelas: curriculumData.kelas.length,
    bab: curriculumData.bab.length,
    subbab: curriculumData.bab.reduce(
      (total, bab) => total + bab.subbab.length,
      0
    ),
    babPrasyarat: curriculumData.bab.reduce(
      (total, bab) => total + bab.prasyarat.length,
      0
    ),
  });
}

(async () => {
  try {
    await connectDB();
    await seedCurriculum();
  } catch (error) {
    console.error("Seed curriculum gagal:", error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
})();
