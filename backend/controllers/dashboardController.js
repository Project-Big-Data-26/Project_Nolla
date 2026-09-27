const User = require("../models/User");
const Kelas = require("../models/Kelas");
const Bab = require("../models/Bab");
const Subbab = require("../models/Subbab");
const Pretest = require("../models/MengerjakanPretest");
const MengerjakanKuis = require("../models/MengerjakanKuis");
const MenyelesaikanSubbab = require("../models/MenyelesaikanSubbab");

const getBab = async (req, res) => {
  try {
    // =========================================================
    // 1. AMBIL USER DARI TOKEN
    // =========================================================

    const userId = req.user.id;

    // Ambil data user terbaru dari database
    const user = await User.findById(userId).select("jenjang_id").lean();

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
    if (userJenjangId) {
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

    // =========================================================
    // 5. AMBIL BAB
    // =========================================================

    const babList = await Bab.find({
      kelas_id: { $in: kelasIds },
    })
      .select("_id kelas_id name description display_order")
      .sort({ kelas_id: 1, display_order: 1 })
      .lean();

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
    const completedSubbabIds = new Set();

    if (unlockedSubbabIds.length > 0) {
      const [completionRecords, completedQuizSessions] = await Promise.all([
        MenyelesaikanSubbab.find({
          user_id: userId,
          subbab_id: { $in: unlockedSubbabIds },
        })
          .select("subbab_id")
          .lean(),
        MengerjakanKuis.find({
          user_id: userId,
          subbab_id: { $in: unlockedSubbabIds },
          completed_at: { $ne: null },
        })
          .select("subbab_id")
          .lean(),
      ]);

      for (const record of [...completionRecords, ...completedQuizSessions]) {
        completedSubbabIds.add(record.subbab_id.toString());
      }
    }

    // =========================================================
    // 11. BENTUK RESPONSE BAB
    // =========================================================

    const data = babList.map((bab) => {
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

      const completedCount = babSubbab.filter((subbab) =>
        completedSubbabIds.has(subbab._id.toString()),
      ).length;

      const totalSubbab = babSubbab.length;

      const progress =
        totalSubbab === 0
          ? 0
          : Math.round((completedCount / totalSubbab) * 100);

      return {
        id: bab._id,
        name: bab.name,
        description: bab.description,
        display_order: bab.display_order,
        has_pretest: true,
        progress,
        total_subbab: totalSubbab,
        completed_subbab: completedCount,
        subbab: babSubbab.map((subbab) => ({
          id: subbab._id,
          name: subbab.name,
          description: subbab.description,
          display_order: subbab.display_order,
          completed: completedSubbabIds.has(subbab._id.toString()),
        })),
      };
    });

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
