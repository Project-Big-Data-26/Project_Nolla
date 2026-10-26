const User = require("../models/User");
const Kelas = require("../models/Kelas");
const Bab = require("../models/Bab");
const Subbab = require("../models/Subbab");
const Pretest = require("../models/MengerjakanPretest");
const MengerjakanKuis = require("../models/MengerjakanKuis");
const MendapatkanDifficulty = require("../models/MendapatkanDifficulty");
const {
  getBabProgress,
  isSubbabMastered,
} = require("../utils/learningProgress");

const getLearningResults = async (req, res) => {
  try {
    const userId = req.user.id;
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

    const kelasQuery = {};
    if (user.jenjang_id && !user.allJenjang) {
      kelasQuery.jenjang_id = user.jenjang_id;
    }
    if (nomorKelas !== null) {
      kelasQuery.nomor_kelas = nomorKelas;
    }

    const kelasData = await Kelas.find(kelasQuery)
      .select("_id name nomor_kelas jenjang_id")
      .sort({ nomor_kelas: 1 })
      .lean();
    const kelasById = new Map(
      kelasData.map((item) => [item._id.toString(), item]),
    );

    const babList = await Bab.find({
      kelas_id: { $in: kelasData.map((item) => item._id) },
    })
      .select("_id kelas_id name description display_order")
      .sort({ kelas_id: 1, display_order: 1 })
      .lean();

    const babIds = babList.map((bab) => bab._id);
    const subbabList = babIds.length
      ? await Subbab.find({ bab_id: { $in: babIds } })
          .select("_id bab_id name description display_order")
          .sort({ bab_id: 1, display_order: 1 })
          .lean()
      : [];
    const completedPretests = babIds.length
      ? await Pretest.find({
          user_id: userId,
          bab_id: { $in: babIds },
          completed_at: { $ne: null },
        })
          .select("bab_id")
          .lean()
      : [];
    const completedPretestBabIds = new Set(
      completedPretests.map((pretest) => pretest.bab_id.toString()),
    );
    const unlockedSubbabList = subbabList.filter((subbab) =>
      completedPretestBabIds.has(subbab.bab_id.toString()),
    );
    const subbabIds = unlockedSubbabList.map((subbab) => subbab._id);

    const [quizSessions, difficultyRecords] = subbabIds.length
      ? await Promise.all([
          MengerjakanKuis.find({
            user_id: userId,
            subbab_id: { $in: subbabIds },
          })
            .select("subbab_id completed_at")
            .lean(),
          MendapatkanDifficulty.find({
            user_id: userId,
            subbab_id: { $in: subbabIds },
          })
            .select("subbab_id current_cognitive_score")
            .lean(),
        ])
      : [[], []];

    const startedSubbabIds = new Set(
      quizSessions.map((session) => session.subbab_id.toString()),
    );
    const quizzedSubbabIds = new Set(
      quizSessions
        .filter((session) => session.completed_at)
        .map((session) => session.subbab_id.toString()),
    );
    const difficultyBySubbabId = new Map(
      difficultyRecords.map((record) => [
        record.subbab_id.toString(),
        record,
      ]),
    );

    const babById = new Map(babList.map((bab) => [bab._id.toString(), bab]));
    const subbabByBabId = new Map();
    for (const subbab of subbabList) {
      const babId = subbab.bab_id.toString();
      const babSubbab = subbabByBabId.get(babId) || [];
      babSubbab.push(subbab);
      subbabByBabId.set(babId, babSubbab);
    }

    const babIdsWithQuiz = new Set(
      unlockedSubbabList
        .filter((subbab) => quizzedSubbabIds.has(subbab._id.toString()))
        .map((subbab) => subbab.bab_id.toString()),
    );

    const data = [...babIdsWithQuiz]
      .map((babId) => {
        const bab = babById.get(babId);
        if (!bab) {
          throw new Error(`BAB ${babId} tidak ditemukan`);
        }
        const kelasDataForBab = kelasById.get(bab.kelas_id.toString());
        if (!kelasDataForBab) {
          throw new Error(`Kelas untuk BAB ${babId} tidak ditemukan`);
        }
        const babSubbab = (subbabByBabId.get(babId) || []).filter((subbab) =>
          completedPretestBabIds.has(subbab.bab_id.toString()),
        );
        const progress = getBabProgress(
          babSubbab,
          difficultyBySubbabId,
          quizzedSubbabIds,
        );
        const completedSubbab = babSubbab.filter((subbab) =>
          isSubbabMastered(
            difficultyBySubbabId.get(subbab._id.toString())
              ?.current_cognitive_score,
            quizzedSubbabIds.has(subbab._id.toString()),
          ),
        ).length;

        return {
          id: bab._id,
          name: bab.name,
          description: bab.description,
          display_order: bab.display_order,
          kelas: {
            id: kelasDataForBab._id,
            name: kelasDataForBab.name,
            nomor_kelas: kelasDataForBab.nomor_kelas,
          },
          class_reference:
            kelasDataForBab.name || `Kelas ${kelasDataForBab.nomor_kelas}`,
          progress,
          total_subbab: babSubbab.length,
          started_subbab: babSubbab.filter((subbab) =>
            startedSubbabIds.has(subbab._id.toString()),
          ).length,
          completed_subbab: completedSubbab,
          status: progress === 100 ? "completed" : "in_progress",
        };
      })
      .sort((a, b) => {
        const classOrder =
          a.kelas.nomor_kelas - b.kelas.nomor_kelas ||
          a.kelas.id.toString().localeCompare(b.kelas.id.toString());
        return classOrder || a.display_order - b.display_order;
      });

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Hasil pembelajaran berhasil diambil.",
      filter: {
        kelas: nomorKelas,
        is_filtered: nomorKelas !== null,
        jenjang: user.jenjang_id || null,
        all_jenjang: !user.jenjang_id,
      },
      summary: {
        completed_bab: data.filter((bab) => bab.status === "completed").length,
        in_progress_bab: data.filter((bab) => bab.status === "in_progress")
          .length,
      },
      data,
    });
  } catch (error) {
    console.error("Get learning results error:", error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: "Terjadi kesalahan saat mengambil hasil pembelajaran.",
    });
  }
};

module.exports = { getLearningResults };
