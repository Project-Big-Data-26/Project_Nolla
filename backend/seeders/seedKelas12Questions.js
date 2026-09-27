const mongoose = require("mongoose");
require("dotenv").config();

const Pertanyaan = require("../models/Soal");

const makeChoiceSet = (values) => {
  const optionIds = ["A", "B", "C", "D"];

  return optionIds.map((optionId, index) => ({
    option_id: optionId,
    text: values[index],
  }));
};

const moveCorrectAnswerToOptionB = (values, correctAnswer) => {
  const normalizedValues = [...values];
  const correctIndex = { A: 0, B: 1, C: 2, D: 3 }[correctAnswer];

  if (correctIndex === undefined) {
    throw new Error(`Jawaban benar tidak valid: ${correctAnswer}`);
  }

  [normalizedValues[1], normalizedValues[correctIndex]] = [
    normalizedValues[correctIndex],
    normalizedValues[1],
  ];

  return normalizedValues;
};

const buildQuestion = ({
  subbab_id,
  kelas_id,
  soal_text,
  options,
  correct_answer,
  cognitive_score,
}) => ({
  subbab_id,
  kelas_id,
  soal_text,
  image_url: [],
  soal_type: "multiple_choice",
  options: options.map((option) => ({
    option_id: option.option_id,
    text: option.text,
  })),
  correct_answer,
  cognitive_score,
  cognitive_level:
    cognitive_score >= 1200
      ? "hard"
      : cognitive_score >= 600
        ? "medium"
        : "easy",
  confidence_score: null,
  status: "active",
  created_at: new Date(),
  updated_at: new Date(),
});

// Builder khusus Soal Subbab Utama (60 soal per subbab via 20 loop)
const buildKelas12SubbabQuestions = (
  subbab_id,
  kelas_id,
  subbabName,
  order,
) => {
  const easyScore = 100 + order * 25;
  const mediumScore = 600 + order * 30;
  const hardScore = 1200 + order * 35;

  return [
    // 1 Soal Easy
    buildQuestion({
      subbab_id,
      kelas_id,
      soal_text: `(Variasi ${order} - Easy) Dalam sebuah kotak terdapat ${order + 2} bola merah dan ${order + 3} bola putih. Peluang terambilnya bola merah pada pengambilan pertama secara acak adalah ...`,
      options: makeChoiceSet([
        `${order + 3}/${2 * order + 5}`, // A
        `${order + 2}/${2 * order + 5}`, // B (Jawaban Benar dipindah ke B)
        `1/${order + 2}`, // C
        `1/${2 * order + 5}`, // D
      ]),
      correct_answer: "B",
      cognitive_score: easyScore,
    }),
    // 1 Soal Medium
    buildQuestion({
      subbab_id,
      kelas_id,
      soal_text: `(Variasi ${order} - Medium) Dua buah dadu seimbang dilempar undi bersama-sama sebanyak ${order * 2} kali. Frekuensi harapan munculnya mata dadu berjumlah ganjil adalah ...`,
      options: makeChoiceSet([
        `${36 * order}`, // A
        `${order}`, // B (Jawaban Benar)
        `${9 * order}`, // C
        `${order / 2}`, // D
      ]),
      correct_answer: "B",
      cognitive_score: mediumScore,
    }),
    // 1 Soal Hard
    buildQuestion({
      subbab_id,
      kelas_id,
      soal_text: `(Variasi ${order} - Hard) Dari ${order + 5} siswa putra dan ${order + 3} siswa putri akan dipilih 3 orang utusan sekolah secara acak. Peluang terpilihnya paling sedikit 1 siswa putri adalah ...`,
      options: makeChoiceSet([
        "1/4", // A
        "27/52", // B (Jawaban Benar dipindah ke B)
        "7/13", // C
        "1/2", // D
      ]),
      correct_answer: "B",
      cognitive_score: hardScore,
    }),
  ];
};

const buildPrerequisiteQuestions = ({
  subbab_id,
  kelas_id,
  bab_id,
  bab_name,
  subbab_name,
}) => {
  const prefix = `[SOAL PRASYARAT - ${bab_name} - ${subbab_name}]`;
  const questionSets = {
    "SMA10-B7": [
      {
        text: `${prefix} Sebuah toko menyediakan 4 model kemeja dan 3 model celana. Banyak pasangan pakaian yang dapat dipilih adalah ...`,
        options: ["7", "12", "16", "24"],
        answer: "B",
      },
      {
        text: `${prefix} Sebuah kode terdiri dari 3 angka yang masing-masing dapat dipilih dari angka 1 sampai 5 dan boleh berulang. Banyak kode yang mungkin adalah ...`,
        options: ["15", "25", "125", "625"],
        answer: "C",
      },
      {
        text: `${prefix} Sebuah restoran memiliki 4 makanan pembuka, 3 makanan utama, dan 2 minuman. Banyak paket berbeda yang dapat dibuat adalah ...`,
        options: ["9", "12", "18", "24"],
        answer: "D",
      },
      {
        text: `${prefix} Dari kota A ke B terdapat 6 jalan dan dari B ke C terdapat 4 jalan. Banyak rute berbeda dari A ke C melalui B adalah ...`,
        options: ["24", "10", "18", "30"],
        answer: "A",
      },
      {
        text: `${prefix} Tersedia 7 model sepatu dan 4 model tas. Banyak pasangan sepatu dan tas yang dapat dipilih adalah ...`,
        options: ["28", "11", "24", "35"],
        answer: "A",
      },
    ],
    "SMA11U-B3": [
      {
        text: `${prefix} Koefisien korelasi dua variabel adalah 0,91. Interpretasi yang paling tepat adalah ...`,
        options: [
          "hubungan negatif sangat kuat",
          "tidak ada hubungan linear",
          "hubungan positif sangat kuat",
          "hubungan positif sangat lemah",
        ],
        answer: "C",
      },
      {
        text: `${prefix} Diagram pencar menunjukkan titik-titik yang cenderung naik dari kiri bawah ke kanan atas dan rapat di sekitar garis lurus. Kesimpulannya adalah ...`,
        options: [
          "korelasi negatif kuat",
          "korelasi positif kuat",
          "tidak ada korelasi",
          "korelasi selalu bernilai nol",
        ],
        answer: "B",
      },
      {
        text: `${prefix} Jika koefisien korelasi dua variabel adalah -0,85, maka hubungan kedua variabel tersebut adalah ...`,
        options: [
          "positif lemah",
          "negatif lemah",
          "tidak memiliki hubungan",
          "negatif sangat kuat",
        ],
        answer: "D",
      },
      {
        text: `${prefix} Koefisien korelasi yang mendekati 0 menunjukkan bahwa ...`,
        options: [
          "tidak terdapat hubungan linear yang berarti",
          "hubungan positif sempurna",
          "hubungan negatif sempurna",
          "kedua variabel pasti sama",
        ],
        answer: "A",
      },
      {
        text: `${prefix} Pada persamaan regresi, koefisien arah bernilai positif. Artinya, ketika nilai x meningkat, nilai y cenderung ...`,
        options: ["menurun", "tetap", "meningkat", "menjadi nol"],
        answer: "C",
      },
    ],
    "SMA12U-B3": [
      {
        text: `${prefix} Sebuah panitia terdiri dari 3 orang yang dipilih dari 8 calon. Banyak panitia yang mungkin adalah ...`,
        options: ["24", "56", "336", "512"],
        answer: "B",
      },
      {
        text: `${prefix} Enam buku berbeda akan disusun berjajar pada sebuah rak. Banyak susunan yang mungkin adalah ...`,
        options: ["36", "120", "720", "1.296"],
        answer: "C",
      },
      {
        text: `${prefix} Dari 9 siswa akan dipilih 4 siswa untuk mengikuti lomba tanpa memperhatikan urutan. Banyak pilihan yang mungkin adalah ...`,
        options: ["36", "84", "108", "126"],
        answer: "D",
      },
      {
        text: `${prefix} Banyak bilangan 5 angka berbeda yang dapat dibentuk dari angka 1 sampai 7 dan berakhir dengan angka ganjil adalah ...`,
        options: ["1.440", "840", "720", "360"],
        answer: "A",
      },
      {
        text: `${prefix} Banyak susunan 3 orang berbeda yang dipilih dari 7 orang untuk menempati jabatan ketua, sekretaris, dan bendahara adalah ...`,
        options: ["35", "210", "343", "504"],
        answer: "B",
      },
    ],
  };

  const questions = questionSets[bab_id] || [];

  return questions.map((question, index) =>
    buildQuestion({
      subbab_id,
      kelas_id,
      soal_text: `${question.text} [Variasi ${index + 1}]`,
      options: makeChoiceSet(
        moveCorrectAnswerToOptionB(question.options, question.answer),
      ),
      correct_answer: "B",
      cognitive_score: 1250 + index * 50,
    }),
  );
};

const getKelas12PrerequisiteBabIds = (data, babMap) => {
  const kelas12Keys = new Set(
    data.kelas
      .filter((item) => Number(item.nomor_kelas) === 12)
      .map((item) => item.key),
  );

  const prerequisiteBabIds = new Set();

  for (const item of data.bab) {
    if (!kelas12Keys.has(item.kelas_key) || !Array.isArray(item.prasyarat)) {
      continue;
    }

    if (!item.name.toLowerCase().includes("peluang")) {
      continue;
    }

    for (const prasyaratKey of item.prasyarat) {
      const mappedBabId = babMap.get(prasyaratKey);
      if (mappedBabId) {
        prerequisiteBabIds.add(mappedBabId.toString());
      }
    }
  }

  return Array.from(prerequisiteBabIds);
};

const seedKelas12Questions = async ({ data, babMap, kelasMap, subbab }) => {
  const kelas12Keys = data.kelas
    .filter((item) => item.nomor_kelas === 12)
    .map((item) => item.key);

  const kelas12Ids = kelas12Keys
    .map((key) => kelasMap.get(key))
    .filter(Boolean);

  if (kelas12Ids.length === 0) {
    return { inserted: 0, total: 0 };
  }

  const subbabMap = new Map();

  for (const item of data.bab) {
    const babId = babMap.get(item.id);

    if (!babId || !Array.isArray(item.subbab)) continue;

    for (const subbabItem of item.subbab) {
      const insertedSubbab = subbab.find(
        (doc) =>
          doc.bab_id.toString() === babId.toString() &&
          doc.name === subbabItem.name,
      );

      if (insertedSubbab) {
        subbabMap.set(`${item.id}:${subbabItem.name}`, insertedSubbab._id);
      }
    }
  }

  await Pertanyaan.deleteMany({ kelas_id: { $in: kelas12Ids } });

  const kelas12QuestionData = [];

  for (const item of data.bab) {
    if (!kelas12Keys.includes(item.kelas_key)) continue;
    if (!item.name.toLowerCase().includes("peluang")) continue;

    const babId = babMap.get(item.id);
    const kelasId = kelasMap.get(item.kelas_key);

    if (!babId || !kelasId || !Array.isArray(item.subbab)) continue;

    for (let index = 0; index < item.subbab.length; index += 1) {
      const subbabItem = item.subbab[index];
      const subbabId = subbabMap.get(`${item.id}:${subbabItem.name}`);

      if (!subbabId) continue;

      // 20 Iterasi x 3 tingkat = 60 soal per subbab
      for (let i = 1; i <= 20; i++) {
        const questions = buildKelas12SubbabQuestions(
          subbabId,
          kelasId,
          subbabItem.name,
          i,
        );
        kelas12QuestionData.push(...questions);
      }
    }
  }

  if (kelas12QuestionData.length > 0) {
    await Pertanyaan.insertMany(kelas12QuestionData);
  }

  return {
    inserted: kelas12QuestionData.length,
    total: await Pertanyaan.countDocuments({ kelas_id: { $in: kelas12Ids } }),
  };
};

const seedKelas12PrerequisiteQuestions = async ({
  data,
  babMap,
  kelasMap,
  subbab,
}) => {
  const kelas12Keys = new Set(
    data.kelas
      .filter((item) => Number(item.nomor_kelas) === 12)
      .map((item) => item.key),
  );

  const kelas12Ids = Array.from(kelas12Keys)
    .map((key) => kelasMap.get(key))
    .filter(Boolean);

  const prerequisiteBabIds = getKelas12PrerequisiteBabIds(data, babMap);

  if (!prerequisiteBabIds.length || kelas12Ids.length === 0) {
    return { inserted: 0, total: 0, prerequisiteBabCount: 0 };
  }

  let insertedCount = 0;
  let prerequisiteBabCount = 0;

  for (const babId of prerequisiteBabIds) {
    const babEntry = data.bab.find(
      (item) => babMap.get(item.id)?.toString() === babId.toString(),
    );

    if (!babEntry) continue;

    const babSubbab = subbab.filter(
      (doc) => doc.bab_id.toString() === babId.toString(),
    );

    if (!babSubbab.length) continue;

    prerequisiteBabCount += 1;

    const subbabDoc = [...babSubbab].sort(
      (left, right) =>
        (right.display_order ?? 0) - (left.display_order ?? 0) ||
        left._id.toString().localeCompare(right._id.toString()),
    )[0];

    await Pertanyaan.deleteMany({
      subbab_id: subbabDoc._id,
      soal_text: { $regex: /^\[SOAL PRASYARAT -/ },
    });

    const prerequisiteQuestions = buildPrerequisiteQuestions({
      subbab_id: subbabDoc._id,
      kelas_id: kelasMap.get(babEntry.kelas_key),
      bab_id: babEntry.id,
      bab_name: babEntry.name,
      subbab_name: subbabDoc.name,
    });

    if (prerequisiteQuestions.length > 0) {
      await Pertanyaan.insertMany(prerequisiteQuestions);
      insertedCount += prerequisiteQuestions.length;
    }
  }

  return {
    inserted: insertedCount,
    total: await Pertanyaan.countDocuments({ kelas_id: { $in: kelas12Ids } }),
    prerequisiteBabCount,
  };
};

module.exports = { seedKelas12Questions, seedKelas12PrerequisiteQuestions };

if (require.main === module) {
  const run = async () => {
    try {
      if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI belum diset di environment");
      }

      await mongoose.connect(process.env.MONGO_URI);
      const Kelas = require("../models/Kelas");
      const Bab = require("../models/Bab");
      const Subbab = require("../models/Subbab");
      const curriculumData = require("./data/curriculumData");

      const kelas = await Kelas.find({}).lean();
      const bab = await Bab.find({}).lean();
      const subbab = await Subbab.find({}).lean();

      const kelasMap = new Map();
      for (const item of curriculumData.kelas) {
        const matched = kelas.find(
          (doc) =>
            doc.name === item.name &&
            Number(doc.nomor_kelas) === Number(item.nomor_kelas) &&
            (doc.jalur || null) === (item.jalur ?? null),
        );

        if (matched) {
          kelasMap.set(item.key, matched._id);
        }
      }

      const babMap = new Map();
      for (const item of curriculumData.bab) {
        const kelasId = kelasMap.get(item.kelas_key);
        const matched = bab.find(
          (doc) =>
            doc.name === item.name && String(doc.kelas_id) === String(kelasId),
        );

        if (matched) {
          babMap.set(item.id, matched._id);
        }
      }

      console.log(
        "Menjalankan seeder: 60 Soal (20 Easy, 20 Medium, 20 Hard) per subbab Peluang + 1 Soal Prasyarat Khusus...",
      );

      const result = await seedKelas12Questions({
        data: curriculumData,
        babMap,
        kelasMap,
        subbab,
      });

      const prereqResult = await seedKelas12PrerequisiteQuestions({
        data: curriculumData,
        babMap,
        kelasMap,
        subbab,
      });

      console.log("Seed sukses!");
      console.log(
        JSON.stringify(
          {
            soalSubbabInserted: result.inserted, // 2 subbab x 60 = 120
            prasyaratInserted: prereqResult.inserted, // 1
            totalInsertedDiProsesIni: result.inserted + prereqResult.inserted, // Total 121
          },
          null,
          2,
        ),
      );

      await mongoose.disconnect();
      process.exit(0);
    } catch (error) {
      console.error("Seeder soal gagal:", error);
      try {
        await mongoose.disconnect();
      } catch (disconnectError) {
        console.error("Gagal disconnect MongoDB:", disconnectError);
      }
      process.exit(1);
    }
  };

  run();
}
