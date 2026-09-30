const mongoose = require("mongoose");
const crypto = require("crypto");
require("dotenv").config();

const Jenjang = require("../models/Jenjang");
const Kelas = require("../models/Kelas");
const Bab = require("../models/Bab");
const BabPrasyarat = require("../models/BabPrasyarat");
const Subbab = require("../models/Subbab");
const SubbabAdaptive = require("../models/SubbabAdaptive");
const User = require("../models/User");
const Badge = require("../models/Badge");
const OTP = require("../models/OTP");
const Pertanyaan = require("../models/Pengerjaan");
const Pretest = require("../models/Pretest");
const PertanyaanPretest = require("../models/PertanyaanPretest");
const PengerjaanKuis = require("../models/PengerjaanKuis");
const RefreshToken = require("../models/RefreshToken");
const RevokedToken = require("../models/RevokedToken");
const Streak = require("../models/Streak");
const UserBadge = require("../models/UserBadge");
const UserPoint = require("../models/UserPoint");

const models = [
  UserBadge,
  UserPoint,
  Streak,
  PengerjaanKuis,
  PertanyaanPretest,
  Pretest,
  SubbabAdaptive,
  OTP,
  RefreshToken,
  RevokedToken,
  Pertanyaan,
  Badge,
  BabPrasyarat,
  Subbab,
  Bab,
  Kelas,
  Jenjang,
  User,
];

const clearDatabase = async () => {
  for (const Model of models) {
    await Model.deleteMany({});
  }

  console.log("Database berhasil dibersihkan");
};

const seedDatabase = async () => {
  const now = new Date();

  // Jenjang
  const jenjang = await Jenjang.insertMany([
    {
      name: "SD",
    },
    {
      name: "SMP",
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

  await BabPrasyarat.create({
    bab_id: bab[1]._id,
    relasi_bab_id: bab[0]._id,
  });

  // Subbab
  const subbab = await Subbab.insertMany([
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

  const user = await User.create({
    name: "Pengguna Demo",
    email: "demo@example.com",
    password: null,
    isVerified: false,
    isProfileComplete: false,
    jenjangId: jenjang[0]._id,
  });

  const badges = await Badge.insertMany([
    {
      name: "Langkah Pertama",
      description: "Selesaikan aktivitas belajar pertama",
      icon_url: "https://example.com/badges/first-step.png",
      criteria: { activity_count: 1 },
    },
    {
      name: "Konsisten",
      description: "Belajar selama tiga hari berturut-turut",
      icon_url: "https://example.com/badges/consistent.png",
      criteria: { current_streak: 3 },
    },
  ]);

  const pertanyaan = await Pertanyaan.insertMany([
    {
      subbab_id: subbab[0]._id,
      kelas_id: kelas[0]._id,
      pertanyaan_text: "Berapakah hasil dari 2 + 3?",
      pertanyaan_type: "multiple_choice",
      options: [
        { option_id: "A", text: "4" },
        { option_id: "B", text: "5" },
        { option_id: "C", text: "6" },
      ],
      correct_answer: "B",
      cognitive_level: "C1",
      cognitive_score: 200,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      subbab_id: subbab[1]._id,
      kelas_id: kelas[1]._id,
      pertanyaan_text: "Jika x + 2 = 5, berapakah nilai x?",
      pertanyaan_type: "multiple_choice",
      options: [
        { option_id: "A", text: "2" },
        { option_id: "B", text: "3" },
        { option_id: "C", text: "7" },
      ],
      correct_answer: "B",
      cognitive_level: "C2",
      cognitive_score: 400,
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ]);

  const pretest = await Pretest.create({
    user_id: user._id,
    bab_id: bab[0]._id,
    score: "100",
    duration: 60,
    started_at: new Date(now.getTime() - 60 * 1000),
    completed_at: now,
  });

  await PertanyaanPretest.create({
    pretest_id: pretest._id,
    pertanyaan_id: pertanyaan[0]._id,
    selected_answer: "B",
    is_correct: true,
    response_time: 12,
  });

  await PengerjaanKuis.create({
    user_id: user._id,
    bab_id: bab[0]._id,
    cognitive_level: "C1",
    cognitive_score: 200,
    soal: [
      {
        pertanyaan_id: pertanyaan[0]._id,
        pilihan_jawaban: "B",
        is_correct: true,
        response_time: 12,
      },
    ],
    score: "100",
    points_earned: 10,
    duration: 12,
    started_at: new Date(now.getTime() - 12 * 1000),
    completed_at: now,
  });

  await SubbabAdaptive.create({
    user_id: user._id,
    subbab_id: subbab[0]._id,
    initial_cognitive_level: "C1",
    initial_cognitive_score: 200,
    pretest_subbab_correct: 1,
    pretest_subbab_total: 1,
    updated_at: now,
  });

  await Streak.create({
    user_id: user._id,
    current_streak: 1,
    longest_streak: 1,
    last_activity_date: now,
  });

  await UserBadge.create({
    user_id: user._id,
    badge_id: badges[0]._id,
    earned_at: now,
  });

  await UserPoint.create({
    user_id: user._id,
    source_type: "quiz",
    source_id: bab[0]._id,
    points: 10,
    created_at: now,
  });

  await OTP.create({
    email: user.email,
    otp: "000000",
    type: "EMAIL_VERIFICATION",
    expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
  });

  const rawRefreshToken = crypto.randomBytes(64).toString("hex");
  await RefreshToken.create({
    userId: user._id,
    tokenHash: crypto.createHash("sha256").update(rawRefreshToken).digest("hex"),
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
  });

  await RevokedToken.create({
    token: `seed-revoked-${crypto.randomUUID()}`,
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
  });

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
