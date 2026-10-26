const crypto = require("crypto");

// Versi konten soal: berubah bila teks, tipe, opsi, kunci, atau gambar berubah.
const getQuestionContentHash = (question) =>
  crypto
    .createHash("sha256")
    .update(
      JSON.stringify([
        question.soal_text ?? null,
        question.soal_type ?? null,
        (question.options ?? []).map((option) => [option.option_id, option.text]),
        question.jawaban ?? null,
        question.image_url ?? [],
      ]),
    )
    .digest("hex");

module.exports = { getQuestionContentHash };
