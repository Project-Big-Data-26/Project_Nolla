require("dotenv").config();
const mongoose = require("mongoose");
const Payment = require("../models/Payment");

const mongoURI =
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/project_assessment?directConnection=true";

const ensurePaymentsCollection = async () => {
  try {
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 10000 });

    const collectionExists = await mongoose.connection.db
      .listCollections({ name: Payment.collection.collectionName }, { nameOnly: true })
      .hasNext();

    if (!collectionExists) {
      await Payment.createCollection();
      console.log(`Koleksi '${Payment.collection.collectionName}' berhasil dibuat.`);
    } else {
      console.log(`Koleksi '${Payment.collection.collectionName}' sudah tersedia.`);
    }

    await Payment.createIndexes();
    console.log("Indeks koleksi pembayaran berhasil dipastikan.");
  } catch (error) {
    console.error("Gagal menyiapkan koleksi pembayaran:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
};

ensurePaymentsCollection();
