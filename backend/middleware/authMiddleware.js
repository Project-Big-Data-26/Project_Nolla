const jwt = require("jsonwebtoken");
const RevokedToken = require("../models/RevokedToken");

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
