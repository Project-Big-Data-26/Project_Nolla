const mongoose = require("mongoose");
require("dotenv").config();

const Jenjang = require("../models/Jenjang");
const Kelas = require("../models/Kelas");
const Bab = require("../models/Bab");
const Subbab = require("../models/Subbab");

const clearDatabase = async () => {
  await Subbab.deleteMany({});
  await Bab.deleteMany({});
  await Kelas.deleteMany({});
  await Jenjang.deleteMany({});

  console.log("Database berhasil dibersihkan");
};

const seedDatabase = async () => {
  // Jenjang
  const jenjang = await Jenjang.insertMany([
    {
      name: "SD",
      description: "Sekolah Dasar",
      display_order: 1,
    },
    {
      name: "SMP",
      description: "Sekolah Menengah Pertama",
      display_order: 2,
    },
  ]);

  // Kelas
  const kelas = await Kelas.insertMany([
    {
      jenjang_id: jenjang[0]._id,
      name: "Kelas 1",
      nomor_kelas: 1,
    },
    {
      jenjang_id: jenjang[1]._id,
      name: "Kelas 7",
      nomor_kelas: 7,
    },
  ]);

  // Bab
  const bab = await Bab.insertMany([
    {
      kelas_id: kelas[0]._id,
      name: "Bilangan",
      description: "Pengenalan bilangan",
      display_order: 1,
    },
    {
      kelas_id: kelas[1]._id,
      name: "Aljabar",
      description: "Pengenalan aljabar",
      display_order: 1,
    },
  ]);

  // Subbab
  await Subbab.insertMany([
    {
      bab_id: bab[0]._id,
      name: "Mengenal Bilangan",
      description: "Pengenalan konsep bilangan",
      display_order: 1,
    },
    {
      bab_id: bab[1]._id,
      name: "Bentuk Aljabar",
      description: "Pengenalan bentuk aljabar",
      display_order: 1,
    },
  ]);

  console.log("Seeder berhasil dijalankan");
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const mode = process.argv[2];

    if (mode === "clear") {
      await clearDatabase();
    } else if (mode === "fresh") {
      await clearDatabase();
      await seedDatabase();
    } else {
      await seedDatabase();
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Seeder gagal:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

run();
