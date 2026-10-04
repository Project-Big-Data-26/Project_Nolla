const bcrypt = require("bcrypt");
const User = require("../models/User");

const TEST_USERS = [
  {
    name: "Student",
    email: "student@example.com",
    password: "12345678",
    isVerified: true,
    isProfileComplete: true,
  },
  {
    name: "Student 1",
    email: "student1@example.com",
    password: "12345678",
    isVerified: true,
    isProfileComplete: true,
  },
  {
    name: "Student 2",
    email: "student2@example.com",
    password: "12345678",
    isVerified: true,
    isProfileComplete: true,
  },
];

const seedTestUsers = async () => {
  console.log("Memulai seeder akun test...");

  for (const userData of TEST_USERS) {
    const existingUser = await User.findOne({ email: userData.email });

    if (existingUser) {
      existingUser.name = userData.name;
      existingUser.password = await bcrypt.hash(userData.password, 10);
      existingUser.isVerified = true;
      existingUser.isProfileComplete = true;
      await existingUser.save();
      console.log(`✓ akun test sudah ada, diperbarui: ${userData.email}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    await User.create({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      isVerified: userData.isVerified,
      isProfileComplete: userData.isProfileComplete,
    });

    console.log(`✓ akun test dibuat: ${userData.email}`);
  }

  console.log("Seeder akun test selesai.");
};

module.exports = { seedTestUsers, TEST_USERS };
