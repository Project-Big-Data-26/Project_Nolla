const User = require("../models/User");
const Kelas = require("../models/Kelas");
const Bab = require("../models/Bab");
const Subbab = require("../models/Subbab");
const Pretest = require("../models/MengerjakanPretest");
const MengerjakanKuis = require("../models/MengerjakanKuis");
const MendapatkanDifficulty = require("../models/MendapatkanDifficulty");
const {
  getBabProgress,
  getCognitiveLevel,
  getSubbabProgress,
  isSubbabCompleted,
} = require("../utils/learningProgress");

const getBab = async (req, res) => {
  try {
    // =========================================================
    // 1. AMBIL USER DARI TOKEN
    // =========================================================

    const userId = req.user.id;

    // Ambil data user terbaru dari database
    const user = await User.findById(userId)
      .select("jenjang_id allJenjang")
      .lean();

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "User tidak ditemukan.",
      });
    }

    // Bisa null
    const userJenjangId = user.jenjang_id;

    // =========================================================
    // 2. AMBIL PARAMETER KELAS
    // =========================================================

    const { kelas } = req.query;

    let nomorKelas = null;

    if (kelas !== undefined) {
      if (!/^\d+$/.test(kelas)) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          message: "Parameter kelas harus berupa angka.",
        });
      }

      nomorKelas = Number(kelas);
    }

    // =========================================================
    // 3. CARI KELAS
    // =========================================================
    //
    // Jika user memiliki jenjangId:
    //   -> hanya kelas dari jenjang tersebut
    //
    // Jika user jenjangId null:
    //   -> semua kelas dari semua jenjang
    //
    // Jika ada ?kelas:
    //   -> filter berdasarkan nomor_kelas
    // =========================================================

    const kelasQuery = {};

    // Hanya tambahkan filter jenjang jika user memiliki jenjangId
    if (userJenjangId && !user.allJenjang) {
      kelasQuery.jenjang_id = userJenjangId;
    }

    // Filter nomor kelas jika parameter diberikan
    if (nomorKelas !== null) {
      kelasQuery.nomor_kelas = nomorKelas;
    }

    const kelasData = await Kelas.find(kelasQuery)
      .select("_id nomor_kelas jenjang_id")
      .sort({ nomor_kelas: 1 })
      .lean();

    // =========================================================
    // 4. TIDAK ADA KELAS YANG SESUAI
    // =========================================================

    if (kelasData.length === 0) {
      return res.status(200).json({
        statusCode: 200,
        success: true,
        message: "Data BAB berhasil diambil.",
        filter: {
          kelas: nomorKelas,
          is_filtered: nomorKelas !== null,
          jenjang: userJenjangId || null,
          all_jenjang: !userJenjangId,
        },
        data: [],
      });
    }

    const kelasIds = kelasData.map((item) => item._id);
    const kelasOrder = new Map(
      kelasData.map((item, index) => [item._id.toString(), index]),
    );

    // =========================================================
    // 5. AMBIL BAB
    // =========================================================

    const babList = await Bab.find({
      kelas_id: { $in: kelasIds },
    })
      .select("_id kelas_id name description display_order")
      .sort({ kelas_id: 1, display_order: 1 })
      .lean();

    babList.sort((babA, babB) => {
      const kelasDifference =
        kelasOrder.get(babA.kelas_id.toString()) -
        kelasOrder.get(babB.kelas_id.toString());

      return (
        kelasDifference ||
        (babA.display_order ?? 0) - (babB.display_order ?? 0)
      );
    });

    if (babList.length === 0) {
      return res.status(200).json({
        statusCode: 200,
        success: true,
        message: "Data BAB berhasil diambil.",
        filter: {
          kelas: nomorKelas,
          is_filtered: nomorKelas !== null,
          jenjang: userJenjangId || null,
          all_jenjang: !userJenjangId,
        },
        data: [],
      });
    }

    const babIds = babList.map((bab) => bab._id);

    // =========================================================
    // 6. AMBIL SUBBAB
    // =========================================================

    const subbabList = await Subbab.find({
      bab_id: { $in: babIds },
    })
      .select("_id bab_id name description display_order")
      .sort({ bab_id: 1, display_order: 1 })
      .lean();

    // =========================================================
    // 7. CEK PRETEST USER
    // =========================================================

    const pretestList = await Pretest.find({
      user_id: userId,
      bab_id: { $in: babIds },
      completed_at: { $ne: null },
    })
      .select("_id bab_id completed_at")
      .lean();

    const completedPretestBabIds = new Set(
      pretestList.map((pretest) => pretest.bab_id.toString()),
    );

    // =========================================================
    // 8. FILTER SUBBAB YANG SUDAH TERBUKA
    // =========================================================

    const unlockedSubbabList = subbabList.filter((subbab) =>
      completedPretestBabIds.has(subbab.bab_id.toString()),
    );

    // =========================================================
    // 9. CEK SUBBAB YANG SUDAH SELESAI
    // =========================================================

    const unlockedSubbabIds = unlockedSubbabList.map((subbab) => subbab._id);
    const startedSubbabIds = new Set();
    const quizzedSubbabIds = new Set();
    const difficultyBySubbabId = new Map();

    if (unlockedSubbabIds.length > 0) {
      const [quizSessions, difficultyRecords] = await Promise.all([
        MengerjakanKuis.find({
          user_id: userId,
          subbab_id: { $in: unlockedSubbabIds },
        })
          .select("subbab_id completed_at")
          .lean(),
        MendapatkanDifficulty.find({
          user_id: userId,
          subbab_id: { $in: unlockedSubbabIds },
        })
          .select("subbab_id current_cognitive_score")
          .lean(),
      ]);

      for (const session of quizSessions) {
        const subbabId = session.subbab_id.toString();
        startedSubbabIds.add(subbabId);
        if (session.completed_at) {
          quizzedSubbabIds.add(subbabId);
        }
      }

      for (const record of difficultyRecords) {
        difficultyBySubbabId.set(record.subbab_id.toString(), record);
      }
    }

    // =========================================================
    // 11. BENTUK RESPONSE BAB
    // =========================================================

    const babData = babList.map((bab) => {
      const babId = bab._id.toString();

      const babSubbab = subbabList.filter(
        (subbab) => subbab.bab_id.toString() === babId,
      );

      const hasPretest = completedPretestBabIds.has(babId);

      // =======================================================
      // BAB BELUM PRETEST
      // =======================================================

      if (!hasPretest) {
        return {
          id: bab._id,
          name: bab.name,
          description: bab.description,
          display_order: bab.display_order,
          has_pretest: false,
          progress: 0,
          total_subbab: babSubbab.length,
          completed_subbab: 0,
          subbab: [],
        };
      }

      // =======================================================
      // BAB SUDAH PRETEST
      // =======================================================

      const totalSubbab = babSubbab.length;
      const startedCount = babSubbab.filter((subbab) =>
        startedSubbabIds.has(subbab._id.toString()),
      ).length;

      const progress = getBabProgress(
        babSubbab,
        difficultyBySubbabId,
        quizzedSubbabIds,
      );
      const completedCount = babSubbab.filter((subbab) => {
        const score = difficultyBySubbabId.get(
          subbab._id.toString(),
        )?.current_cognitive_score;
        return (
          quizzedSubbabIds.has(subbab._id.toString()) &&
          isSubbabCompleted(score)
        );
      }).length;

      return {
        id: bab._id,
        name: bab.name,
        description: bab.description,
        display_order: bab.display_order,
        has_pretest: true,
        progress,
        total_subbab: totalSubbab,
        started_subbab: startedCount,
        completed_subbab: completedCount,
        subbab: babSubbab.map((subbab) => {
          const subbabId = subbab._id.toString();
          const difficulty = difficultyBySubbabId.get(subbabId);

          return {
            id: subbab._id,
            name: subbab.name,
            description: subbab.description,
            display_order: subbab.display_order,
            started: startedSubbabIds.has(subbabId),
            progress: quizzedSubbabIds.has(subbabId)
              ? getSubbabProgress(difficulty?.current_cognitive_score ?? 0)
              : 0,
            completed:
              quizzedSubbabIds.has(subbabId) &&
              isSubbabCompleted(difficulty?.current_cognitive_score),
            current_cognitive_score: Math.round(
              Number(difficulty?.current_cognitive_score ?? 1000),
            ),
            current_cognitive_level: getCognitiveLevel(
              Number(difficulty?.current_cognitive_score ?? 1000),
            ),
          };
        }),
      };
    });
    const data = [
      ...babData.filter((bab) => bab.progress !== 100),
      ...babData.filter((bab) => bab.progress === 100),
    ];

    // =========================================================
    // 12. RESPONSE SUCCESS
    // =========================================================

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Data BAB berhasil diambil.",
      filter: {
        kelas: nomorKelas,
        is_filtered: nomorKelas !== null,
        jenjang: userJenjangId || null,
        all_jenjang: !userJenjangId,
      },
      data,
    });
  } catch (error) {
    console.error("Get BAB Error:", error);

    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: "Terjadi kesalahan saat mengambil data BAB.",
      error: error.message,
    });
  }
};

module.exports = {
  getBab,
};
