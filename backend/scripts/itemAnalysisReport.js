// Laporan mutu butir soal kuis (read-only). Contoh:
//   npm run report:items -- --out reports/items.json [--subbab <id>] [--rapid-guess-ms 3000] [--min-responses 30]
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const MengerjakanKuis = require("../models/MengerjakanKuis");
const Soal = require("../models/Soal");
const User = require("../models/User");
const {
  CRITERION,
  analyzeItemBank,
  toItemResponses,
} = require("../services/itemAnalysis");

const parseArgs = (argv) => {
  const args = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error(`Argumen tidak valid: ${key ?? ""}`);
    }
    args[key.slice(2)] = value;
  }
  if (!args.out) throw new Error("--out <file.json> wajib diisi");
  if (args.subbab && !mongoose.isValidObjectId(args.subbab)) {
    throw new Error("--subbab harus ObjectId");
  }
  for (const key of ["rapid-guess-ms", "min-responses"]) {
    if (args[key] !== undefined && !(Number.isInteger(Number(args[key])) && Number(args[key]) > 0)) {
      throw new Error(`--${key} harus bilangan bulat > 0`);
    }
  }
  return args;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const run = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI belum diset di backend/.env.");

  const internalDomains = (process.env.ANALYTICS_INTERNAL_EMAIL_DOMAINS || "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);

  await mongoose.connect(process.env.MONGO_URI);
  try {
    const internalUserIds = internalDomains.length
      ? await User.distinct("_id", {
          email: { $regex: `@(${internalDomains.map(escapeRegex).join("|")})$`, $options: "i" },
        })
      : [];

    const attempts = await MengerjakanKuis.find({
      completed_at: { $ne: null },
      user_id: { $nin: internalUserIds },
      ...(args.subbab ? { subbab_id: args.subbab } : {}),
    })
      .select("cognitive_level soal")
      .lean();

    const responses = toItemResponses(attempts);
    const questionIds = [...new Set(responses.map((response) => response.questionId))];
    const questions = await Soal.find({ _id: { $in: questionIds } })
      .select("subbab_id soal_text soal_type options jawaban image_url")
      .lean();

    const segments = analyzeItemBank(
      responses,
      new Map(questions.map((question) => [question._id.toString(), question])),
      {
        rapidGuessThresholdMs: args["rapid-guess-ms"] ? Number(args["rapid-guess-ms"]) : undefined,
        minResponses: args["min-responses"] ? Number(args["min-responses"]) : 1,
      },
    );

    const report = {
      generated_at: new Date().toISOString(),
      source: "mengerjakan_kuis (attempt selesai)",
      filters: {
        subbab_id: args.subbab ?? null,
        excluded_internal_email_domains: internalDomains,
        excluded_internal_user_count: internalUserIds.length,
        rapid_guess_threshold_ms: args["rapid-guess-ms"] ? Number(args["rapid-guess-ms"]) : null,
        min_responses_per_segment: args["min-responses"] ? Number(args["min-responses"]) : 1,
      },
      criterion: CRITERION,
      notes: [
        "Soal dipilih adaptif menurut track rating; difficulty index menggambarkan siswa pada track tersebut, bukan populasi.",
        "Pretest tidak disertakan karena panjang dan urutan soalnya adaptif per tahap.",
        "Waktu hanya dari response_time_ms; nilai null/partial tidak dihitung (lihat timingCoverage).",
        "Tanpa --rapid-guess-ms tidak ada respons yang dibuang sebagai rapid guess.",
      ],
      attempt_count: attempts.length,
      response_count: responses.length,
      segment_count: segments.length,
      segments,
    };

    const outPath = path.resolve(args.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(
      `Laporan ditulis ke ${outPath}: ${attempts.length} attempt, ${responses.length} respons, ${segments.length} segmen.`,
    );
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(`Gagal membuat laporan: ${error.message}`);
  process.exit(1);
});
