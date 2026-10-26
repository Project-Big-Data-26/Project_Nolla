// Mengubah index expiresAt_1 lama (non-TTL) di koleksi revokedtokens menjadi TTL.
//   node scripts/migrateRevokedTokenTtl.js            # cek saja (dry run)
//   node scripts/migrateRevokedTokenTtl.js --apply    # terapkan
require("dotenv").config();
const mongoose = require("mongoose");

const COLLECTION = "revokedtokens";

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI belum diset di backend/.env.");
  const apply = process.argv.includes("--apply");

  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
  try {
    const db = mongoose.connection.db;
    const exists = await db.listCollections({ name: COLLECTION }).hasNext();
    if (!exists) {
      console.log(`Koleksi ${COLLECTION} belum ada; index TTL dibuat otomatis saat aplikasi berjalan.`);
      return;
    }

    const indexes = await db.collection(COLLECTION).indexes();
    const current = indexes.find(
      (index) => JSON.stringify(index.key) === JSON.stringify({ expiresAt: 1 }),
    );

    if (current?.expireAfterSeconds === 0) {
      console.log(`Index ${current.name} sudah TTL. Tidak ada perubahan.`);
      return;
    }

    const plan = current
      ? `ubah index ${current.name} menjadi TTL (expireAfterSeconds: 0) via collMod`
      : "buat index TTL { expiresAt: 1 }";
    if (!apply) {
      console.log(`[dry run] Akan ${plan}. Jalankan dengan --apply untuk menerapkan.`);
      return;
    }

    if (current) {
      await db.command({
        collMod: COLLECTION,
        index: { keyPattern: { expiresAt: 1 }, expireAfterSeconds: 0 },
      });
    } else {
      await db
        .collection(COLLECTION)
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    }
    console.log(`Selesai: ${plan}. Token kedaluwarsa akan dihapus oleh TTL monitor MongoDB.`);
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(`Migrasi gagal: ${error.message}`);
  process.exit(1);
});
