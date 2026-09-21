const Pertanyaan = require("../models/pertanyaan");
const Subbab = require("../models/subbab");

const seedJenjang = require("./seedJenjang");
const seedKelas = require("./seedKelas");
const seedBab = require("./seedBab");
const seedSubbab = require("./seedSubbab");
const seedBabPrasyarat = require("./seedBabPrasyarat");

const { connectDB, disconnectDB } = require("./seedConnection");

// =========================================================
// QUESTION BANK
// =========================================================

const questionBank = [
  // =========================================================
  // SOAL PRASYARAT
  // =========================================================

  {
    kelas_key: "SD1",
    bab_key: "SD1-B2",
    subbab_name: "A. Cerita Penjumlahan",
    pertanyaan_text:
      "Dina memiliki 7 pensil. Kemudian Ibu memberikan 6 pensil lagi. Berapa jumlah pensil Dina sekarang?",
    options: ["10", "12", "13", "14"],
    correct_answer: "C",
    cognitive_level: "hard",
    cognitive_score: 1200,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B3",
    subbab_name: "A. Cerita Pengurangan",
    pertanyaan_text:
      "Budi memiliki 15 permen. Ia memberikan 7 permen kepada temannya. Berapa permen Budi yang tersisa?",
    options: ["6", "7", "8", "9"],
    correct_answer: "C",
    cognitive_level: "hard",
    cognitive_score: 1200,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B5",
    subbab_name: "D. Membandingkan Bilangan",
    pertanyaan_text:
      "Ada 17 kelereng merah dan 12 kelereng biru. Berapa selisih jumlah kelereng merah dan biru?",
    options: ["3", "4", "5", "6"],
    correct_answer: "C",
    cognitive_level: "hard",
    cognitive_score: 1200,
  },

  // =========================================================
  // SD1-B6 - SUBBAB A
  // Mengenal Konsep Lebih dari, Kurang dari, dan Selisih
  // =========================================================

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name:
      "A. Mengenal Konsep Lebih dari, Kurang dari, dan Selisih",
    pertanyaan_text:
      "Kelompok pertama memiliki 3 bola. Kelompok kedua memiliki 7 bola. Kelompok mana yang memiliki bola lebih banyak?",
    options: [
      "Kelompok pertama",
      "Kelompok kedua",
      "Keduanya sama",
      "Tidak dapat diketahui",
    ],
    correct_answer: "B",
    cognitive_level: "easy",
    cognitive_score: 200,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name:
      "A. Mengenal Konsep Lebih dari, Kurang dari, dan Selisih",
    pertanyaan_text:
      "Siti memiliki 5 permen, sedangkan Rina memiliki 2 permen. Siapa yang memiliki permen lebih sedikit?",
    options: ["Siti", "Rina", "Keduanya sama", "Tidak diketahui"],
    correct_answer: "B",
    cognitive_level: "easy",
    cognitive_score: 200,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name:
      "A. Mengenal Konsep Lebih dari, Kurang dari, dan Selisih",
    pertanyaan_text: "Berapa selisih antara 9 dan 6?",
    options: ["2", "4", "3", "5"],
    correct_answer: "C",
    cognitive_level: "easy",
    cognitive_score: 400,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name:
      "A. Mengenal Konsep Lebih dari, Kurang dari, dan Selisih",
    pertanyaan_text:
      "Kelompok A memiliki 4 apel dan kelompok B memiliki 8 apel. Kelompok mana yang memiliki apel lebih banyak?",
    options: [
      "Kelompok B",
      "Kelompok A",
      "Jumlahnya sama",
      "Tidak diketahui",
    ],
    correct_answer: "A",
    cognitive_level: "easy",
    cognitive_score: 400,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name:
      "A. Mengenal Konsep Lebih dari, Kurang dari, dan Selisih",
    pertanyaan_text:
      "Ani memiliki 5 pensil dan Budi memiliki 8 pensil. Berapa lebih banyak pensil yang dimiliki Budi?",
    options: ["2", "3", "4", "5"],
    correct_answer: "B",
    cognitive_level: "medium",
    cognitive_score: 600,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name:
      "A. Mengenal Konsep Lebih dari, Kurang dari, dan Selisih",
    pertanyaan_text:
      "Ada 9 bola merah dan 6 bola biru. Bola dengan jumlah lebih sedikit adalah bola warna apa?",
    options: ["Merah", "Keduanya sama", "Tidak dapat diketahui", "Biru"],
    correct_answer: "D",
    cognitive_level: "medium",
    cognitive_score: 600,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name:
      "A. Mengenal Konsep Lebih dari, Kurang dari, dan Selisih",
    pertanyaan_text:
      "Ada 12 kelereng di dalam kotak pertama dan 7 kelereng di kotak kedua. Berapa selisih jumlah kelereng kedua kotak?",
    options: ["5", "4", "6", "3"],
    correct_answer: "A",
    cognitive_level: "medium",
    cognitive_score: 800,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name:
      "A. Mengenal Konsep Lebih dari, Kurang dari, dan Selisih",
    pertanyaan_text:
      "Toko A memiliki 10 buku dan toko B memiliki 4 buku. Berapa selisih jumlah buku kedua toko?",
    options: ["4", "7", "6", "5"],
    correct_answer: "C",
    cognitive_level: "medium",
    cognitive_score: 800,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name:
      "A. Mengenal Konsep Lebih dari, Kurang dari, dan Selisih",
    pertanyaan_text:
      "Ada 10 bola di kotak A dan 6 bola di kotak B. Jika 3 bola ditambahkan ke kotak B, kotak mana yang sekarang memiliki lebih banyak bola?",
    options: [
      "Kotak A",
      "Kotak B",
      "Jumlahnya sama",
      "Tidak dapat diketahui",
    ],
    correct_answer: "A",
    cognitive_level: "hard",
    cognitive_score: 1000,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name:
      "A. Mengenal Konsep Lebih dari, Kurang dari, dan Selisih",
    pertanyaan_text:
      "Ani mempunyai 8 apel dan Budi mempunyai 5 apel. Budi mendapat 2 apel lagi. Setelah itu, berapa selisih jumlah apel Ani dan Budi?",
    options: ["2", "1", "3", "4"],
    correct_answer: "B",
    cognitive_level: "hard",
    cognitive_score: 1000,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name:
      "A. Mengenal Konsep Lebih dari, Kurang dari, dan Selisih",
    pertanyaan_text:
      "Ada 12 kelereng merah dan 8 kelereng biru. Jika 3 kelereng merah diambil, berapa selisih kelereng merah dan biru yang tersisa?",
    options: ["2", "3", "1", "4"],
    correct_answer: "C",
    cognitive_level: "hard",
    cognitive_score: 1200,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name:
      "A. Mengenal Konsep Lebih dari, Kurang dari, dan Selisih",
    pertanyaan_text:
      "Tiga kelompok memiliki masing-masing 4, 7, dan 5 benda. Berapa selisih jumlah benda pada kelompok terbanyak dan kelompok paling sedikit?",
    options: ["1", "3", "4", "5"],
    correct_answer: "B",
    cognitive_level: "hard",
    cognitive_score: 1200,
  },

  // =========================================================
  // SD1-B6 - SUBBAB B
  // Penjumlahan yang Hasilnya Kurang dari 20
  // =========================================================

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "B. Penjumlahan yang Hasilnya kurang dari 20",
    pertanyaan_text: "Berapakah hasil dari 2 + 3?",
    options: ["5", "6", "4", "3"],
    correct_answer: "A",
    cognitive_level: "easy",
    cognitive_score: 200,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "B. Penjumlahan yang Hasilnya kurang dari 20",
    pertanyaan_text: "Berapakah hasil dari 4 + 5?",
    options: ["7", "8", "10", "9"],
    correct_answer: "D",
    cognitive_level: "easy",
    cognitive_score: 200,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "B. Penjumlahan yang Hasilnya kurang dari 20",
    pertanyaan_text: "Berapakah hasil dari 6 + 2?",
    options: ["6", "8", "9", "10"],
    correct_answer: "B",
    cognitive_level: "easy",
    cognitive_score: 400,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "B. Penjumlahan yang Hasilnya kurang dari 20",
    pertanyaan_text: "Berapakah hasil dari 7 + 3?",
    options: ["10", "9", "8", "7"],
    correct_answer: "A",
    cognitive_level: "easy",
    cognitive_score: 400,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "B. Penjumlahan yang Hasilnya kurang dari 20",
    pertanyaan_text: "Berapakah hasil dari 8 + 7?",
    options: ["13", "14", "15", "16"],
    correct_answer: "C",
    cognitive_level: "medium",
    cognitive_score: 600,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "B. Penjumlahan yang Hasilnya kurang dari 20",
    pertanyaan_text: "Berapakah hasil dari 9 + 5?",
    options: ["12", "14", "15", "16"],
    correct_answer: "B",
    cognitive_level: "medium",
    cognitive_score: 600,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "B. Penjumlahan yang Hasilnya kurang dari 20",
    pertanyaan_text:
      "Ada 4 kucing di halaman. Kemudian datang 6 kucing lagi. Berapa jumlah kucing sekarang?",
    options: ["8", "9", "11", "10"],
    correct_answer: "D",
    cognitive_level: "medium",
    cognitive_score: 600,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "B. Penjumlahan yang Hasilnya kurang dari 20",
    pertanyaan_text:
      "Sinta memiliki 5 balon. Ayah memberikan 8 balon lagi. Berapa jumlah balon Sinta sekarang?",
    options: ["13", "14", "12", "15"],
    correct_answer: "A",
    cognitive_level: "medium",
    cognitive_score: 800,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "B. Penjumlahan yang Hasilnya kurang dari 20",
    pertanyaan_text: "Berapakah hasil dari 6 + 7 + 3?",
    options: ["14", "15", "16", "17"],
    correct_answer: "C",
    cognitive_level: "hard",
    cognitive_score: 1000,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "B. Penjumlahan yang Hasilnya kurang dari 20",
    pertanyaan_text: "Berapakah hasil dari 9 + 4 + 5?",
    options: ["15", "17", "19", "18"],
    correct_answer: "D",
    cognitive_level: "hard",
    cognitive_score: 1000,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "B. Penjumlahan yang Hasilnya kurang dari 20",
    pertanyaan_text:
      "Ada 3 pensil merah, 6 pensil biru, dan 4 pensil hijau. Berapa jumlah semua pensil?",
    options: ["11", "13", "12", "14"],
    correct_answer: "B",
    cognitive_level: "hard",
    cognitive_score: 1200,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "B. Penjumlahan yang Hasilnya kurang dari 20",
    pertanyaan_text:
      "Pada hari Senin Rani membaca 4 halaman. Hari Selasa 5 halaman dan hari Rabu 7 halaman. Berapa jumlah halaman yang dibaca Rani?",
    options: ["16", "15", "17", "18"],
    correct_answer: "A",
    cognitive_level: "hard",
    cognitive_score: 1200,
  },

  // =========================================================
  // SD1-B6 - SUBBAB C
  // Pengurangan yang Hasilnya Kurang dari 20
  // =========================================================

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "C. Pengurangan yang Hasilnya Kurang dari 20",
    pertanyaan_text: "Berapakah hasil dari 9 - 3?",
    options: ["6", "5", "7", "4"],
    correct_answer: "A",
    cognitive_level: "easy",
    cognitive_score: 200,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "C. Pengurangan yang Hasilnya Kurang dari 20",
    pertanyaan_text: "Berapakah hasil dari 8 - 2?",
    options: ["5", "7", "6", "4"],
    correct_answer: "C",
    cognitive_level: "easy",
    cognitive_score: 200,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "C. Pengurangan yang Hasilnya Kurang dari 20",
    pertanyaan_text: "Berapakah hasil dari 10 - 5?",
    options: ["4", "5", "6", "3"],
    correct_answer: "B",
    cognitive_level: "easy",
    cognitive_score: 400,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "C. Pengurangan yang Hasilnya Kurang dari 20",
    pertanyaan_text: "Berapakah hasil dari 7 - 4?",
    options: ["2", "4", "5", "3"],
    correct_answer: "D",
    cognitive_level: "easy",
    cognitive_score: 400,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "C. Pengurangan yang Hasilnya Kurang dari 20",
    pertanyaan_text: "Berapakah hasil dari 12 - 5?",
    options: ["5", "6", "7", "8"],
    correct_answer: "C",
    cognitive_level: "medium",
    cognitive_score: 600,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "C. Pengurangan yang Hasilnya Kurang dari 20",
    pertanyaan_text: "Berapakah hasil dari 15 - 7?",
    options: ["8", "7", "9", "6"],
    correct_answer: "A",
    cognitive_level: "medium",
    cognitive_score: 600,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "C. Pengurangan yang Hasilnya Kurang dari 20",
    pertanyaan_text: "Berapakah hasil dari 18 - 9?",
    options: ["7", "8", "10", "9"],
    correct_answer: "D",
    cognitive_level: "medium",
    cognitive_score: 600,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "C. Pengurangan yang Hasilnya Kurang dari 20",
    pertanyaan_text:
      "Doni memiliki 14 pensil. Ia menggunakan 6 pensil. Berapa pensil yang masih dimiliki Doni?",
    options: ["6", "8", "9", "7"],
    correct_answer: "B",
    cognitive_level: "medium",
    cognitive_score: 800,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "C. Pengurangan yang Hasilnya Kurang dari 20",
    pertanyaan_text:
      "Ada 16 balon. Sebanyak 7 balon pecah. Berapa balon yang masih ada?",
    options: ["9", "8", "7", "10"],
    correct_answer: "A",
    cognitive_level: "medium",
    cognitive_score: 800,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "C. Pengurangan yang Hasilnya Kurang dari 20",
    pertanyaan_text:
      "Ibu memiliki 17 apel. Sebanyak 5 apel diberikan kepada tetangga. Berapa apel yang tersisa?",
    options: ["10", "11", "12", "13"],
    correct_answer: "C",
    cognitive_level: "medium",
    cognitive_score: 800,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "C. Pengurangan yang Hasilnya Kurang dari 20",
    pertanyaan_text:
      "Budi memiliki 20 kelereng. Ia memberikan 7 kelereng kepada temannya, kemudian memberikan 3 lagi. Berapa kelereng yang tersisa?",
    options: ["8", "9", "11", "10"],
    correct_answer: "D",
    cognitive_level: "hard",
    cognitive_score: 1000,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "C. Pengurangan yang Hasilnya Kurang dari 20",
    pertanyaan_text:
      "Ada 19 balon. Sebanyak 6 balon pecah, lalu 4 balon pecah lagi. Berapa balon yang tersisa?",
    options: ["7", "9", "10", "8"],
    correct_answer: "B",
    cognitive_level: "hard",
    cognitive_score: 1200,
  },

  {
    kelas_key: "SD1",
    bab_key: "SD1-B6",
    subbab_name: "C. Pengurangan yang Hasilnya Kurang dari 20",
    pertanyaan_text:
      "Ada 15 kue. Sebanyak 6 kue dimakan dan 2 kue rusak. Berapa kue yang masih ada?",
    options: ["5", "6", "7", "8"],
    correct_answer: "C",
    cognitive_level: "hard",
    cognitive_score: 1200,
  },
];

// =========================================================
// SEED FUNCTION
// =========================================================

async function seedPertanyaan(
  existingKelasMap = null,
  existingBabMap = null
) {
  let kelasMap = existingKelasMap;
  let babMap = existingBabMap;

  // Kalau dijalankan sendiri, pastikan curriculum sudah tersedia.
  if (!kelasMap || !babMap) {
    const jenjangMap = await seedJenjang();

    if (!kelasMap) {
      kelasMap = await seedKelas(jenjangMap);
    }

    if (!babMap) {
      const result = await seedBab(kelasMap);
      kelasMap = result.kelasMap;
      babMap = result.babMap;
    }
  }

  // Pastikan subbab dan relasi prasyarat sudah tersedia.
  await seedSubbab(babMap);
  await seedBabPrasyarat(babMap);

  const now = new Date();
  let total = 0;

  for (const item of questionBank) {
    const kelasId = kelasMap[item.kelas_key];
    const babId = babMap[item.bab_key];

    if (!kelasId) {
      throw new Error(
        `Kelas tidak ditemukan untuk soal: ${item.kelas_key}`
      );
    }

    if (!babId) {
      throw new Error(
        `BAB tidak ditemukan untuk soal: ${item.bab_key}`
      );
    }

    const subbab = await Subbab.findOne({
      bab_id: babId,
      name: item.subbab_name,
    });

    if (!subbab) {
      throw new Error(
        `Subbab tidak ditemukan: ${item.subbab_name}`
      );
    }

    const options = item.options.map((text, index) => ({
      option_id: String.fromCharCode(65 + index),
      text,
    }));

    await Pertanyaan.findOneAndUpdate(
      {
        subbab_id: subbab._id,
        pertanyaan_text: item.pertanyaan_text,
      },
      {
        $set: {
          subbab_id: subbab._id,
          kelas_id: kelasId,
          pertanyaan_text: item.pertanyaan_text,
          image_url: [],
          pertanyaan_type: "multiple_choice",
          options,
          correct_answer: item.correct_answer,
          cognitive_level: item.cognitive_level,
          cognitive_score: item.cognitive_score,
          status: "active",
          updated_at: now,
        },
        $setOnInsert: {
          created_at: now,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      }
    );

    total += 1;
  }

  console.log(`Pertanyaan seeded: ${total}`);
  return total;
}

// =========================================================
// RUN STANDALONE
// =========================================================

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedPertanyaan();
    } catch (error) {
      console.error("Seed pertanyaan gagal:", error);
      process.exitCode = 1;
    } finally {
      await disconnectDB();
    }
  })();
}

module.exports = seedPertanyaan;