const { connectDatabase, closeDatabase } = require("./seedConnection");
const mongoose = require("mongoose");
const Avatar = require("../models/Avatar");

async function seedAvatar() {
  await connectDatabase();

  await Avatar.insertMany([
    { img_url: "" },
  ]);

  console.log("Avatar berhasil ditambahkan");

  await mongoose.disconnect();
}

seedAvatar();