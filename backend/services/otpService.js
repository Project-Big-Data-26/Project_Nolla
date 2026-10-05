const OTP = require("../models/OTP");
const OtpRateLimit = require("../models/OtpRateLimit");
const generateOTP = require("../utils/generateOTP");
const { sendOTPEmail } = require("./emailService");

const cooldowns = [0, 0, 60_000, 60 * 60_000, 2 * 60_000, 5 * 60_000, 10 * 60_000, 30 * 60_000];

const cooldownFor = (sendCount) =>
  cooldowns[Math.min(sendCount, cooldowns.length - 1)];

const getRemainingCooldownSeconds = (sendCount, lastSentAt, now = new Date()) =>
  Math.max(
    0,
    Math.ceil(
      (lastSentAt.getTime() + cooldownFor(sendCount) - now.getTime()) / 1000,
    ),
  );

const getOtpResendStatus = async (email) => {
  const rateLimit = await OtpRateLimit.findOne({ email })
    .select("sendCount lastSentAt")
    .lean();

  if (!rateLimit) {
    return { canResend: true, resendAfterSeconds: 0 };
  }

  const resendAfterSeconds = getRemainingCooldownSeconds(
    rateLimit.sendCount,
    rateLimit.lastSentAt,
  );
  return {
    canResend: resendAfterSeconds === 0,
    resendAfterSeconds,
  };
};

const reserveSend = async (email) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let rateLimit = await OtpRateLimit.findOne({ email });

    if (!rateLimit) {
      try {
        rateLimit = await OtpRateLimit.create({ email });
      } catch (error) {
        if (error.code !== 11000) throw error;
        continue;
      }
    }

    const now = new Date();
    const retryAfterSeconds = getRemainingCooldownSeconds(
      rateLimit.sendCount,
      rateLimit.lastSentAt,
      now,
    );

    if (retryAfterSeconds > 0) {
      const error = new Error("Terlalu banyak permintaan OTP. Coba lagi nanti.");
      error.statusCode = 429;
      error.retryAfterSeconds = retryAfterSeconds;
      throw error;
    }

    const updated = await OtpRateLimit.findOneAndUpdate(
      {
        _id: rateLimit._id,
        sendCount: rateLimit.sendCount,
        lastSentAt: rateLimit.lastSentAt,
      },
      {
        $inc: { sendCount: 1 },
        $set: { lastSentAt: now },
      },
      { new: true },
    );

    if (updated) {
      return Math.ceil(cooldownFor(updated.sendCount) / 1000);
    }
  }

  const error = new Error("Permintaan OTP sedang diproses. Coba lagi.");
  error.statusCode = 429;
  error.retryAfterSeconds = 1;
  throw error;
};

const sendOtp = async (email, type) => {
  const resendAfterSeconds = await reserveSend(email);
  const otp = generateOTP();
  const expiresInMs = type === "EMAIL_VERIFICATION" ? 10 * 60_000 : 15 * 60_000;

  await OTP.deleteMany({ email, type });
  await OTP.create({
    email,
    otp,
    type,
    expiresAt: new Date(Date.now() + expiresInMs),
  });
  await sendOTPEmail(email, otp, type);

  return { resendAfterSeconds };
};

module.exports = { sendOtp, getOtpResendStatus };