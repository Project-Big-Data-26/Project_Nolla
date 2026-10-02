const jwt = require("jsonwebtoken");

const generateAccessToken = (user, expiresIn) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: expiresIn || process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    },
  );
};

module.exports = { generateAccessToken };
