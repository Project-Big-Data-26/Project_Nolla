const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");
const Jenjang = require("../models/Jenjang");
const Kelas = require("../models/Kelas");
const Bab = require("../models/Bab");
const BabPrasyarat = require("../models/MemilikiPrasyarat");
const Subbab = require("../models/Subbab");
const Pertanyaan = require("../models/Soal");
const Pretest = require("../models/MengerjakanPretest");
const PertanyaanPretest = require("../models/MenjawabSoalPretest");
const UserProficiency = require("../models/MendapatkanDifficulty");
const PengerjaanKuis = require("../models/MengerjakanKuis");
const UserPertanyaan = require("../models/MenjawabSoal");
const MenyelesaikanSubbab = require("../models/MenyelesaikanSubbab");
const OTP = require("../models/OTP");
const RefreshToken = require("../models/RefreshToken");
const RevokedToken = require("../models/RevokedToken");

const data = require("./data/curriculumData");
const {
  seedKelas12Questions,
  seedKelas12PrerequisiteQuestions,
} = require("./seedKelas12Questions");
const { seedTestUsers } = require("./seedTestUsers");

const clearDatabase = async () => {
  // Data aktivitas / relasi user
  await PertanyaanPretest.deleteMany({});
  await Pretest.deleteMany({});
  await UserProficiency.deleteMany({});
  await PengerjaanKuis.deleteMany({});
  await UserPertanyaan.deleteMany({});
  await MenyelesaikanSubbab.deleteMany({});

  // Data authentication
  await OTP.deleteMany({});
  await RefreshToken.deleteMany({});
  await RevokedToken.deleteMany({});
  await User.deleteMany({});

  // Master data soal
  await Pertanyaan.deleteMany({});

  // Master data kurikulum
  await Subbab.deleteMany({});
  await BabPrasyarat.deleteMany({});
  await Bab.deleteMany({});
  await Kelas.deleteMany({});
  await Jenjang.deleteMany({});

  console.log("Database berhasil dibersihkan");
};

const seedDatabase = async () => {
  console.log("Memulai seeder...");

  // =========================================================
  // 1. JENJANG
  // =========================================================

  const jenjangData = data.jenjang.map((item, index) => ({
    name: item.name,
    description: getJenjangDescription(item.name),
    display_order: index + 1,
  }));

  const jenjang = await Jenjang.insertMany(jenjangData);

  // Map:
  // SD  -> ObjectId
  // SMP -> ObjectId
  // SMA -> ObjectId
  const jenjangMap = new Map();

  jenjang.forEach((item) => {
    jenjangMap.set(item.name, item._id);
  });

  console.log(`✓ ${jenjang.length} jenjang berhasil dibuat`);

  // =========================================================
  // 2. KELAS
  // =========================================================

  const kelasData = data.kelas.map((item) => ({
    jenjang_id: jenjangMap.get(item.jenjang),
    name: item.name,
    nomor_kelas: item.nomor_kelas,
    jalur: item.jalur ?? null,
  }));

  const kelas = await Kelas.insertMany(kelasData);

  // Map:
  // SD1     -> ObjectId
  // SD2     -> ObjectId
  // SMP7    -> ObjectId
  // SMA11L  -> ObjectId
  // dst.
  const kelasMap = new Map();

  kelas.forEach((item, index) => {
    kelasMap.set(data.kelas[index].key, item._id);
  });

  console.log(`✓ ${kelas.length} kelas berhasil dibuat`);

  // =========================================================
  // 3. BAB
  // =========================================================
  //
  // Bab memiliki prasyarat yang mengacu ke ID Bab lain.
  //
  // Contoh:
  //
  // SD1-B2
  // prasyarat: ["SD1-B1"]
  //
  // Karena ObjectId Bab belum diketahui sebelum insert,
  // kita insert Bab terlebih dahulu tanpa prasyarat.
  // Setelah semua Bab memiliki ObjectId, baru kita update
  // field prasyarat.
  // =========================================================

  const babData = data.bab.map((item) => ({
    kelas_id: kelasMap.get(item.kelas_key),
    name: item.name,
    description: item.description ?? null,
    display_order: item.display_order,
    prasyarat: [],
  }));

  const bab = await Bab.insertMany(babData);

  // Map:
  // SD1-B1 -> ObjectId
  // SD1-B2 -> ObjectId
  // SMP7-B1 -> ObjectId
  // dst.
  const babMap = new Map();

  bab.forEach((item, index) => {
    babMap.set(data.bab[index].id, item._id);
  });

  console.log(`✓ ${bab.length} bab berhasil dibuat`);

  // =========================================================
  // 4. UPDATE PRASYARAT BAB
  // =========================================================

  for (const item of data.bab) {
    if (!item.prasyarat || item.prasyarat.length === 0) {
      continue;
    }

    const prasyaratIds = item.prasyarat
      .map((prasyaratKey) => babMap.get(prasyaratKey))
      .filter(Boolean);

    await Bab.updateOne(
      {
        _id: babMap.get(item.id),
      },
      {
        $set: {
          prasyarat: prasyaratIds,
        },
      },
    );
  }

  console.log("✓ Prasyarat bab berhasil dipetakan");

  // =========================================================
  // 5. SUBBAB
  // =========================================================

  const subbabData = [];

  for (const item of data.bab) {
    const babId = babMap.get(item.id);

    if (!babId) {
      console.warn(`Bab tidak ditemukan: ${item.id}`);
      continue;
    }

    for (const subbab of item.subbab || []) {
      subbabData.push({
        bab_id: babId,
        name: subbab.name,
        description: subbab.description ?? null,
        display_order: subbab.display_order,
      });
    }
  }

  const subbab = await Subbab.insertMany(subbabData);

  const babPrasyaratEntries = [];

  for (const item of data.bab) {
    const babId = babMap.get(item.id);

    if (
      !babId ||
      !Array.isArray(item.prasyarat) ||
      item.prasyarat.length === 0
    ) {
      continue;
    }

    const relasiBabIds = item.prasyarat
      .map((prasyaratKey) => babMap.get(prasyaratKey))
      .filter(Boolean);

    for (const relasiBabId of relasiBabIds) {
      babPrasyaratEntries.push({
        bab_id: babId,
        relasi_bab_id: relasiBabId,
      });
    }
  }

  if (babPrasyaratEntries.length > 0) {
    await BabPrasyarat.deleteMany({
      bab_id: { $in: babPrasyaratEntries.map((item) => item.bab_id) },
    });
    await BabPrasyarat.insertMany(babPrasyaratEntries);
  }

  const mode = process.argv[2];

  let totalPertanyaanKelas12 = 0;
  let totalPertanyaanPrasyaratKelas12 = 0;

  if (mode !== "no-questions") {
    const questionSeedResult = await seedKelas12Questions({
      data,
      babMap,
      kelasMap,
      subbab,
    });

    const prerequisiteQuestionSeedResult =
      await seedKelas12PrerequisiteQuestions({
        data,
        babMap,
        kelasMap,
        subbab,
      });

    totalPertanyaanKelas12 = questionSeedResult.total;
    totalPertanyaanPrasyaratKelas12 = prerequisiteQuestionSeedResult.inserted;
  }

  console.log(`✓ ${subbab.length} subbab berhasil dibuat`);
  console.log(
    `✓ ${babPrasyaratEntries.length} relasi bab prasyarat berhasil dibuat`,
  );

  if (mode === "no-questions") {
    console.log("✓ seed pertanyaan dilewati berdasarkan mode no-questions");
  } else {
    console.log(`✓ ${totalPertanyaanKelas12} soal Kelas 12 berhasil dibuat`);
    console.log(
      `✓ ${totalPertanyaanPrasyaratKelas12} soal prasyarat tambahan Kelas 12 berhasil dibuat`,
    );
  }

  console.log("");
  console.log("=================================");
  console.log("Seeder berhasil dijalankan");
  console.log("=================================");
  console.log(`Jenjang : ${jenjang.length}`);
  console.log(`Kelas   : ${kelas.length}`);
  console.log(`Bab     : ${bab.length}`);
  console.log(`Subbab  : ${subbab.length}`);
  console.log(`Soal K12: ${totalPertanyaanKelas12}`);
  console.log("=================================");
};

const getJenjangDescription = (name) => {
  const descriptions = {
    SD: "Sekolah Dasar",
    SMP: "Sekolah Menengah Pertama",
    SMA: "Sekolah Menengah Atas",
  };

  return descriptions[name] || null;
};

// =========================================================
// RUNNER
// =========================================================

const run = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI belum diset di environment");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const mode = process.argv[2];

    if (mode === "clear") {
      await clearDatabase();
    } else if (mode === "fresh") {
      await clearDatabase();
      await seedDatabase();
      await seedTestUsers();
    } else if (mode === "test-users") {
      await seedTestUsers();
    } else {
      await seedDatabase();
    }

    await mongoose.disconnect();

    console.log("MongoDB disconnected");
    process.exit(0);
  } catch (error) {
    console.error("Seeder gagal:", error);

    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error("Gagal disconnect MongoDB:", disconnectError);
    }

    process.exit(1);
  }
};

run();
