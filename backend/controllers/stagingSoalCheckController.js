// Pintu cek soal khusus staging (APP_ENV=staging): memeriksa tampilan LaTeX/teks/gambar
// di halaman soal dan review. Tanpa login, tanpa sesi kuis, tanpa event analytics.
// Pintu 1: per subbab_id. Pintu 2: per soal_id (cek ulang setelah soal diperbaiki).
const mongoose = require("mongoose");
const Soal = require("../models/Soal");
const Subbab = require("../models/Subbab");
const Bab = require("../models/Bab");
const Kelas = require("../models/Kelas");
const Jenjang = require("../models/Jenjang");
const StagingSoalCheck = require("../models/StagingSoalCheck");
const { toPublicImageUrls } = require("../utils/questionImage");
const { getQuestionContentHash } = require("../utils/questionContent");

// Salinan aturan level dari quizController.js (getQuestionDifficulty) agar file production
// tidak diubah untuk fitur staging. Jaga tetap sama bila ambang level di kuis berubah.
const LEVEL_THRESHOLDS = { hard: 1400, medium: 1000 };
const getQuestionDifficulty = (question) => {
  const score = question.cognitive_score;
  if (score !== null && score !== undefined && Number.isFinite(Number(score))) {
    if (Number(score) >= LEVEL_THRESHOLDS.hard) return "hard";
    if (Number(score) >= LEVEL_THRESHOLDS.medium) return "medium";
    return "easy";
  }
  return question.cognitive_level || "medium";
};

const PAGES = ["question", "review"];

const sendError = (res, statusCode, message) =>
  res.status(statusCode).json({ statusCode, success: false, message });

const checkState = (check, page, currentHash) => {
  const value = check?.[`${page}_check`] ?? null;
  return {
    value,
    checked_at: check?.[`${page}_checked_at`] ?? null,
    // Soal diedit setelah dicek -> hasil cek perlu diulang.
    stale: value !== null && check?.[`${page}_content_hash`] !== currentHash,
  };
};

// Bentuk mengikuti payload kuis (/quiz/start) + review (/quiz/:id/review)
// agar QuestionPage dan QuestionReviewPage bisa dipakai ulang.
const serialize = (question, check, req, sequence) => {
  const hash = getQuestionContentHash(question);
  return {
    question_id: question._id.toString(),
    sequence,
    subbab_id: question.subbab_id.toString(),
    question_text: question.soal_text,
    soal_type: question.soal_type || null,
    options: Array.isArray(question.options)
      ? question.options.map((option) => ({ option_id: option.option_id, text: option.text }))
      : [],
    image_url: toPublicImageUrls(question.image_url, req),
    // Level yang dipakai kuis (dari cognitive_score bila ada) vs nilai tersimpan apa adanya.
    cognitive_level: getQuestionDifficulty(question),
    stored_cognitive_level: question.cognitive_level ?? null,
    cognitive_score: question.cognitive_score ?? null,
    status: question.status ?? null,
    correct_answer: question.jawaban,
    selected_answer: null,
    is_correct: null,
    check: {
      question: checkState(check, "question", hash),
      review: checkState(check, "review", hash),
    },
  };
};

const summarize = (items) => {
  const summary = { total: items.length };
  for (const page of PAGES) {
    const states = items.map((item) => item.check[page]);
    summary[page] = {
      unchecked: states.filter((state) => state.value === null).length,
      ok: states.filter((state) => state.value === true && !state.stale).length,
      broken: states.filter((state) => state.value === false && !state.stale).length,
      stale: states.filter((state) => state.stale).length,
    };
  }
  return summary;
};

// Filter daftar per halaman (keputusan pengguna):
//   review=1 sudah diberi aksi, review=0 belum (hasil cek usang dihitung belum);
//   aprove=1 tampil benar, aprove=0 rusak.
const FLAG_VALUES = { 0: false, 1: true };

const parseCheckFilter = (query = {}) => {
  const page = query.page ?? "question";
  if (!PAGES.includes(page)) return { error: "page harus 'question' atau 'review'" };

  const filter = { page, review: null, aprove: null };
  for (const key of ["review", "aprove"]) {
    if (query[key] === undefined || query[key] === "") continue;
    if (!(query[key] in FLAG_VALUES)) return { error: `${key} harus 0 atau 1` };
    filter[key] = FLAG_VALUES[query[key]];
  }
  return { filter };
};

const matchesCheckFilter = (item, { page, review, aprove }) => {
  const state = item.check[page];
  const effective = state.stale ? null : state.value;
  if (review !== null && (effective !== null) !== review) return false;
  if (aprove !== null && effective !== aprove) return false;
  return true;
};

const JENJANG_ORDER = { SD: 1, SMP: 2, SMA: 3 };
const byOrder = (key) => (left, right) =>
  (left[key] ?? Infinity) - (right[key] ?? Infinity) ||
  String(left.name ?? "").localeCompare(String(right.name ?? ""));

// Soal "sudah direview" = halaman soal dan review sudah diberi status dan belum usang.
// "rusak" = salah satu halaman bernilai false yang belum usang.
const EMPTY_PROGRESS = { soal_count: 0, reviewed_count: 0, broken_count: 0 };

const summarizeSubbabProgress = (soalList, checks) => {
  const checkById = new Map(checks.map((check) => [String(check.soal_id), check]));
  const progress = new Map();

  for (const question of soalList) {
    const key = String(question.subbab_id);
    const entry = progress.get(key) ?? { ...EMPTY_PROGRESS };
    const hash = getQuestionContentHash(question);
    const check = checkById.get(String(question._id));
    const states = PAGES.map((page) => checkState(check, page, hash));

    entry.soal_count += 1;
    if (states.every((state) => state.value !== null && !state.stale)) entry.reviewed_count += 1;
    if (states.some((state) => state.value === false && !state.stale)) entry.broken_count += 1;
    progress.set(key, entry);
  }

  return progress;
};

// Daftar kelas -> bab -> subbab (+ jumlah soal) untuk memilih subbab yang dicek.
const getCheckTree = async (req, res) => {
  try {
    const [jenjang, kelas, bab, subbab, soalList, checks] = await Promise.all([
      Jenjang.find().select("_id name").lean(),
      Kelas.find().select("_id jenjang_id name nomor_kelas").lean(),
      Bab.find().select("_id kelas_id name display_order").lean(),
      Subbab.find().select("_id bab_id name display_order").lean(),
      // Field konten diperlukan untuk hash (deteksi hasil cek usang).
      Soal.find()
        .select("_id subbab_id soal_text soal_type options jawaban image_url")
        .lean(),
      StagingSoalCheck.find().lean(),
    ]);

    const jenjangById = new Map(jenjang.map((item) => [item._id.toString(), item.name]));
    const progressBySubbab = summarizeSubbabProgress(soalList, checks);
    const groupBy = (items, key) => {
      const groups = new Map();
      for (const item of items) {
        const id = String(item[key]);
        if (!groups.has(id)) groups.set(id, []);
        groups.get(id).push(item);
      }
      return groups;
    };
    const subbabByBab = groupBy(subbab, "bab_id");
    const babByKelas = groupBy(bab, "kelas_id");

    const tree = kelas
      .map((item) => ({
        ...item,
        jenjang: jenjangById.get(String(item.jenjang_id)) ?? null,
      }))
      .sort(
        (left, right) =>
          (JENJANG_ORDER[left.jenjang] ?? 9) - (JENJANG_ORDER[right.jenjang] ?? 9) ||
          byOrder("nomor_kelas")(left, right),
      )
      .map((kelasItem) => ({
        kelas_id: kelasItem._id.toString(),
        name: kelasItem.name ?? null,
        jenjang: kelasItem.jenjang,
        bab: (babByKelas.get(kelasItem._id.toString()) ?? [])
          .sort(byOrder("display_order"))
          .map((babItem) => ({
            bab_id: babItem._id.toString(),
            name: babItem.name ?? null,
            subbab: (subbabByBab.get(babItem._id.toString()) ?? [])
              .sort(byOrder("display_order"))
              .map((subbabItem) => ({
                subbab_id: subbabItem._id.toString(),
                name: subbabItem.name ?? null,
                ...(progressBySubbab.get(subbabItem._id.toString()) ?? EMPTY_PROGRESS),
              })),
          })),
      }));

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Daftar kelas, bab, dan subbab berhasil diambil",
      data: { kelas: tree },
    });
  } catch (error) {
    console.error("Staging soal check (tree) error:", error.message);
    return sendError(res, 500, "Gagal mengambil daftar kelas dan subbab");
  }
};

const getSubbabChecks = async (req, res) => {
  try {
    const { subbab_id: subbabId } = req.params;
    if (!mongoose.isValidObjectId(subbabId)) {
      return sendError(res, 400, "subbab_id tidak valid");
    }

    const { filter, error: filterError } = parseCheckFilter(req.query);
    if (filterError) return sendError(res, 400, filterError);

    const subbab = await Subbab.findById(subbabId).select("_id name").lean();
    if (!subbab) return sendError(res, 404, "Subbab tidak ditemukan");

    const questions = await Soal.find({ subbab_id: subbabId })
      .sort({ created_at: 1, _id: 1 })
      .lean();
    const checks = await StagingSoalCheck.find({
      soal_id: { $in: questions.map((question) => question._id) },
    }).lean();
    const checkById = new Map(checks.map((check) => [check.soal_id.toString(), check]));

    // sequence = urutan asli di subbab, tetap walau daftar disaring.
    const items = questions.map((question, index) =>
      serialize(question, checkById.get(question._id.toString()), req, index + 1),
    );
    const filtered = items.filter((item) => matchesCheckFilter(item, filter));

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Daftar cek soal subbab berhasil diambil",
      data: {
        subbab_id: subbab._id.toString(),
        subbab_name: subbab.name ?? null,
        // Ringkasan selalu untuk seluruh subbab; questions sudah disaring.
        summary: summarize(items),
        filter,
        questions: filtered,
      },
    });
  } catch (error) {
    console.error("Staging soal check (subbab) error:", error.message);
    return sendError(res, 500, "Gagal mengambil cek soal subbab");
  }
};

const getSoalCheck = async (req, res) => {
  try {
    const { soal_id: soalId } = req.params;
    if (!mongoose.isValidObjectId(soalId)) {
      return sendError(res, 400, "soal_id tidak valid");
    }

    const question = await Soal.findById(soalId).lean();
    if (!question) return sendError(res, 404, "Soal tidak ditemukan");

    const check = await StagingSoalCheck.findOne({ soal_id: question._id }).lean();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Cek soal berhasil diambil",
      data: { question: serialize(question, check, req, 1) },
    });
  } catch (error) {
    console.error("Staging soal check (soal) error:", error.message);
    return sendError(res, 500, "Gagal mengambil cek soal");
  }
};

// Body: { page: "question" | "review", value: true | false | null }.
// Nilai boleh ditimpa (pintu 2 = cek ulang); null = reset ke belum dicek.
const updateSoalCheck = async (req, res) => {
  try {
    const { soal_id: soalId } = req.params;
    if (!mongoose.isValidObjectId(soalId)) {
      return sendError(res, 400, "soal_id tidak valid");
    }

    const { page, value } = req.body ?? {};
    if (!PAGES.includes(page)) {
      return sendError(res, 400, "page harus 'question' atau 'review'");
    }
    if (value !== true && value !== false && value !== null) {
      return sendError(res, 400, "value harus true, false, atau null");
    }

    const question = await Soal.findById(soalId).lean();
    if (!question) return sendError(res, 404, "Soal tidak ditemukan");

    const check = await StagingSoalCheck.findOneAndUpdate(
      { soal_id: question._id },
      {
        $set: {
          subbab_id: question.subbab_id,
          [`${page}_check`]: value,
          [`${page}_checked_at`]: value === null ? null : new Date(),
          [`${page}_content_hash`]: value === null ? null : getQuestionContentHash(question),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Status cek soal berhasil disimpan",
      data: { question: serialize(question, check, req, 1) },
    });
  } catch (error) {
    console.error("Staging soal check (update) error:", error.message);
    return sendError(res, 500, "Gagal menyimpan status cek soal");
  }
};

module.exports = { getCheckTree, getSubbabChecks, getSoalCheck, updateSoalCheck };
