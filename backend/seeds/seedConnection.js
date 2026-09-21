require("dotenv").config();

const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI belum ditemukan di file .env");
  }

  await mongoose.connect(uri);

  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}

async function disconnectDB() {
  await mongoose.disconnect();
  console.log("MongoDB disconnected.");
}

module.exports = { connectDB, disconnectDB };