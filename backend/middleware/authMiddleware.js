const jwt = require("jsonwebtoken");
const RevokedToken = require("../models/RevokedToken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    // ========================================
    // AMBIL ACCESS TOKEN
    // ========================================

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        statusCode: 401,
        status: "error",
        message: "Access token tidak ditemukan",
      });
    }

    const token = authHeader.split(" ")[1];

    // ========================================
    // CEK REVOKED TOKEN
    // ========================================

    const revokedToken = await RevokedToken.findOne({
      token,
    });

    if (revokedToken) {
      return res.status(401).json({
        statusCode: 401,
        status: "error",
        message: "Access token sudah dicabut",
      });
    }

    // ========================================
    // VERIFY JWT
    // ========================================

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error("Auth token verification error:", error.message);
      return res.status(401).json({
        statusCode: 401,
        status: "error",
        message: "Token tidak valid atau sudah kedaluwarsa",
      });
    }

    if (!decoded.id) {
      return res.status(401).json({
        statusCode: 401,
        status: "error",
        message: "Token tidak memiliki identitas user yang valid",
      });
    }

    let userExists;
    try {
      userExists = await User.exists({ _id: decoded.id });
    } catch (error) {
      console.error("Auth user lookup error:", error);
      return res.status(500).json({
        statusCode: 500,
        status: "error",
        message: "Gagal memvalidasi user",
      });
    }

    if (!userExists) {
      return res.status(401).json({
        statusCode: 401,
        status: "error",
        message: "User tidak ditemukan",
      });
    }

    // ========================================
    // SIMPAN USER KE REQUEST
    // ========================================

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    return res.status(401).json({
      statusCode: 401,
      status: "error",
      message: "Token tidak valid atau sudah kedaluwarsa",
    });
  }
};

module.exports = authMiddleware;
