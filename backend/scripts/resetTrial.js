// Kembalikan akun ke kondisi belum klaim trial (untuk test lokal). Default dry-run.
// Hanya menghapus periode source "trial"; premium manual/berbayar tidak disentuh.
//   npm run reset:trial                                   # cek 3 akun test
//   npm run reset:trial -- --apply                        # hapus trial 3 akun test
//   npm run reset:trial -- --email a@example.com,b@example.com --apply
// Jalankan lewat container agar memakai DB lokal: docker compose exec backend npm run reset:trial
require("dotenv").config();
const mongoose = require("mongoose");

const Langganan = require("../models/Langganan");
const User = require("../models/User");

const DEFAULT_EMAILS = [
  "student@example.com",
  "student1@example.com",
  "student2@example.com",
];

const parseArgs = (argv) => {
  const args = { apply: false, emails: DEFAULT_EMAILS };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--apply") {
      args.apply = true;
    } else if (argv[index] === "--email") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("--email membutuhkan nilai");
      args.emails = value.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
      index += 1;
    } else {
      throw new Error(`Argumen tidak dikenal: ${argv[index]}`);
    }
  }
  return args;
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI belum diset.");

  await mongoose.connect(process.env.MONGO_URI);
  try {
    for (const email of args.emails) {
      const user = await User.findOne({ email }).select("_id").lean();
      if (!user) {
        console.log(`- ${email}: user tidak ditemukan, dilewati`);
        continue;
      }
      const filter = { user_id: user._id, source: "trial" };
      const count = await Langganan.countDocuments(filter);
      if (!args.apply) {
        console.log(`- ${email}: ${count} trial akan dihapus`);
        continue;
      }
      const { deletedCount } = await Langganan.deleteMany(filter);
      console.log(`- ${email}: ${deletedCount} trial dihapus, trial bisa diklaim lagi`);
    }
    if (!args.apply) console.log("Dry-run: tidak ada yang dihapus. Tambahkan --apply.");
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(`Gagal reset trial: ${error.message}`);
  process.exit(1);
});
