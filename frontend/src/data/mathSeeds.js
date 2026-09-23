const bloomBlueprint = [
  { level: "C1", name: "Mengingat", verb: "mengidentifikasi" },
  { level: "C2", name: "Memahami", verb: "menjelaskan" },
  { level: "C3", name: "Menerapkan", verb: "menggunakan" },
  { level: "C4", name: "Menganalisis", verb: "menganalisis" },
  { level: "C5", name: "Mengevaluasi", verb: "menilai" },
  { level: "C6", name: "Mencipta", verb: "merancang" },
];

const knowledgeBlueprint = [
  { id: "factual", label: "Faktual" },
  { id: "conceptual", label: "Konseptual" },
  { id: "procedural", label: "Prosedural" },
  { id: "metacognitive", label: "Metakognitif" },
];

const difficultyCycle = ["Easy", "Medium", "Hard", "Medium"];

const prompts = {
  C1: [
    "Sebutkan nilai $\\pi$ yang biasa digunakan pada perhitungan lingkaran.",
    "Identifikasi nama sifat yang menyatakan $a+b=b+a$.",
    "Tuliskan rumus luas segitiga.",
    "Sebutkan strategi pengecekan paling dasar setelah menyelesaikan persamaan.",
  ],
  C2: [
    "Jelaskan arti simbol $r$ pada rumus $L=\\pi r^2$.",
    "Jelaskan mengapa jumlah sudut dalam segitiga adalah $180^\\circ$.",
    "Jelaskan dengan kata-katamu sendiri cara menyamakan penyebut pecahan.",
    "Jelaskan kapan estimasi lebih tepat digunakan daripada perhitungan eksak.",
  ],
  C3: [
    "Gunakan rumus $K=2\\pi r$ untuk menghitung keliling lingkaran dengan $r=7$ cm.",
    "Tentukan gradien garis yang melalui titik $(0,1)$ dan $(3,4)$.",
    "Selesaikan persamaan $2x+5=17$ menggunakan prosedur aljabar yang benar.",
    "Pilih dan terapkan strategi yang paling efisien untuk menghitung $25\\%$ dari 320.",
  ],
  C4: [
    "Kelompokkan data $2,2,3,5,8,8$ berdasarkan modus, median, dan rentangnya.",
    "Analisis hubungan antara koefisien $a$ dan bentuk grafik $y=ax^2$.",
    "Temukan kesalahan pada langkah: $2(x+3)=10$, lalu ditulis $2x+3=10$.",
    "Bandingkan dua strategi penyelesaian $x^2-5x+6=0$ dan jelaskan strategi yang lebih efisien.",
  ],
  C5: [
    "Nilai kebenaran klaim bahwa semua bilangan prima adalah ganjil dan berikan bukti penyangkal.",
    "Evaluasi apakah grafik yang diberikan benar-benar merepresentasikan fungsi.",
    "Periksa solusi $x=4$ untuk persamaan $3x-2=10$ dan berikan justifikasi.",
    "Nilai strategi belajarmu saat menyelesaikan soal geometri dan usulkan perbaikannya.",
  ],
  C6: [
    "Buat satu contoh himpunan berisi lima bilangan dengan median 8.",
    "Rancang model matematika untuk memperkirakan biaya perjalanan berdasarkan jarak.",
    "Susun prosedur untuk menentukan tinggi gedung menggunakan kesebangunan segitiga.",
    "Rancang dua cara berbeda untuk memeriksa jawaban sistem persamaan linear.",
  ],
};

const topics = [
  ["Bilangan", "Konstanta dan sifat operasi"],
  ["Geometri", "Bangun datar dan relasi"],
  ["Aljabar", "Persamaan dan prosedur"],
  ["Strategi Matematika", "Refleksi dan pemecahan masalah"],
];

export const mathQuestions = bloomBlueprint.flatMap((bloom, bloomIndex) =>
  knowledgeBlueprint.map((knowledge, knowledgeIndex) => {
    const difficulty = difficultyCycle[(bloomIndex + knowledgeIndex) % difficultyCycle.length];
    const [topic, subtopic] = topics[knowledgeIndex];
    return {
      id: `MTK-${bloom.level}-${knowledgeIndex + 1}`,
      questionText: prompts[bloom.level][knowledgeIndex],
      type: bloom.level === "C6" ? "essay" : knowledgeIndex === 2 ? "numeric" : "multiple_choice",
      subject: "Matematika",
      gradeBand: bloomIndex < 2 ? "SD" : bloomIndex < 4 ? "SMP" : "SMA",
      grade: (bloomIndex < 2 ? [4, 5, 6, 6] : bloomIndex < 4 ? [7, 8, 9, 9] : [10, 11, 12, 12])[knowledgeIndex],
      topic,
      subtopic,
      bloom: bloom.level,
      bloomName: bloom.name,
      knowledgeDimension: knowledge.id,
      knowledgeLabel: knowledge.label,
      difficulty,
      reasoningSteps: Math.min(5, 1 + bloomIndex),
      options: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
      correctAnswer: bloom.level === "C1" ? "Pilihan A" : "Pilihan B",
      explanation: `Soal ini menilai kemampuan ${bloom.verb} pengetahuan ${knowledge.label.toLowerCase()}.`,
      source: "Seeder demonstrasi — wajib direview ahli sebelum menjadi gold label",
    };
  }),
);

export const bloomOptions = bloomBlueprint;
export const knowledgeOptions = knowledgeBlueprint;

export const taxonomyCoverage = bloomBlueprint.map((bloom) => ({
  ...bloom,
  count: mathQuestions.filter((question) => question.bloom === bloom.level).length,
}));
