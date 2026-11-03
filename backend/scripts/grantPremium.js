// Beri premium manual (sebelum ada payment gateway). Default dry-run. Contoh:
//   npm run grant:premium -- --email siswa@example.com --days 30
//   npm run grant:premium -- --email siswa@example.com --days 30 --apply
require("dotenv").config();
const mongoose = require("mongoose");

const Langganan = require("../models/Langganan");
const User = require("../models/User");
const { getEntitlement } = require("../services/entitlement");

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = 3660;

const parseArgs = (argv) => {
  const args = { apply: false };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (key === "--apply") {
      args.apply = true;
    } else if (key === "--email" || key === "--days") {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new Error(`${key} membutuhkan nilai`);
      }
      args[key.slice(2)] = value;
      index += 1;
    } else {
      throw new Error(`Argumen tidak dikenal: ${key}`);
    }
  }
  if (!args.email) throw new Error("--email wajib diisi");
  const days = Number(args.days);
  if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
    throw new Error(`--days harus bilangan bulat 1–${MAX_DAYS}`);
  }
  return { ...args, email: args.email.trim().toLowerCase(), days };
};

const formatEntitlement = (entitlement) =>
  entitlement.plan === "premium"
    ? `premium${entitlement.is_trial ? " (trial)" : ""} sampai ${entitlement.active_until.toISOString()}`
    : "free";

const run = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI belum diset di backend/.env.");

  await mongoose.connect(process.env.MONGO_URI);
  try {
    const user = await User.findOne({ email: args.email }).select("_id").lean();
    if (!user) throw new Error(`User dengan email ${args.email} tidak ditemukan`);

    const now = new Date();
    const before = await getEntitlement(user._id, now);
    // Disambung setelah premium yang masih aktif agar sisa hari tidak hilang.
    const startsAt = before.active_until ?? now;
    const endsAt = new Date(startsAt.getTime() + args.days * DAY_MS);

    console.log(`Status sekarang: ${formatEntitlement(before)}`);
    console.log(
      `Periode premium manual: ${startsAt.toISOString()} → ${endsAt.toISOString()} (${args.days} hari)`,
    );

    if (!args.apply) {
      console.log("Dry-run: tidak ada yang disimpan. Tambahkan --apply untuk menyimpan.");
      return;
    }

    await Langganan.create({
      user_id: user._id,
      source: "manual",
      starts_at: startsAt,
      ends_at: endsAt,
    });
    console.log(`Tersimpan. Status baru: ${formatEntitlement(await getEntitlement(user._id))}`);
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(`Gagal memberi premium: ${error.message}`);
  process.exit(1);
});
