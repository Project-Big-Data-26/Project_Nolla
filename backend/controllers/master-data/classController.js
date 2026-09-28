const User = require("../../models/User");
const Kelas = require("../../models/Kelas");
const Jenjang = require("../../models/Jenjang");

const getClassesByToken = async (req, res) => {
  try {
    // Ambil user ID dari access token
    const userId = req.user.id;

    // Cari data user
    const user = await User.findById(userId).select("jenjang_id");

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        status: "error",
        message: "User tidak ditemukan",
      });
    }

    let jenjang = null;
    let kelasQuery = {};

    // Jika user memiliki jenjang
    if (user.jenjang_id) {
      // Ambil data jenjang
      jenjang = await Jenjang.findById(user.jenjang_id).select("name");

      if (!jenjang) {
        return res.status(404).json({
          statusCode: 404,
          status: "error",
          message: "Jenjang tidak ditemukan",
        });
      }

      // Hanya ambil kelas dari jenjang user
      kelasQuery = {
        jenjang_id: user.jenjang_id,
      };
    }

    // Jika jenjangId null:
    // kelasQuery tetap {} sehingga mengambil seluruh kelas
    const classes = await Kelas.find(kelasQuery)
      .select("_id nomor_kelas")
      .sort({ nomor_kelas: 1 });

    // Hilangkan duplikasi berdasarkan nomor_kelas
    const uniqueClasses = [];
    const usedNomorKelas = new Set();

    for (const kelas of classes) {
      if (usedNomorKelas.has(kelas.nomor_kelas)) {
        continue;
      }

      usedNomorKelas.add(kelas.nomor_kelas);

      uniqueClasses.push({
        name: `Kelas ${kelas.nomor_kelas}`,
        nomor_kelas: kelas.nomor_kelas,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      status: "success",
      data: {
        jenjang: jenjang
          ? {
              id: jenjang._id,
              name: jenjang.name,
            }
          : null,
        classes: uniqueClasses,
      },
    });
  } catch (error) {
    console.error("Get classes by token error:", error);

    return res.status(500).json({
      statusCode: 500,
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

module.exports = {
  getClassesByToken,
};
