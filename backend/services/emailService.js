// File: services/emailService.js
const nodemailer = require("nodemailer");

// Konfigurasi transporter menggunakan variabel env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT, // Biasanya 465 (SSL) atau 587 (TLS)
  secure: process.env.SMTP_PORT == 465, // true jika port 465, false jika selain itu
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOTPEmail = async (email, otp, type = "EMAIL_VERIFICATION") => {
  try {
    const isPasswordReset = type === "PASSWORD_RESET";
    const purpose = isPasswordReset ? "reset password" : "memverifikasi email";
    const validityMinutes = isPasswordReset ? 15 : 10;
    const mailOptions = {
      from: `"Nolla App" <${process.env.SMTP_USER}>`,
      to: email, // Email tujuan
      subject: isPasswordReset ? "Kode Reset Password" : "Kode Verifikasi (OTP) Anda",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>${isPasswordReset ? "Reset Password" : "Verifikasi Email"}</h2>
          <p>Halo,</p>
          <p>Gunakan kode OTP berikut untuk ${purpose}:</p>
          <h1 style="color: #4CAF50; letter-spacing: 2px;">${otp}</h1>
          <p>Kode ini hanya berlaku selama <strong>${validityMinutes} menit</strong>.</p>
          <p>Jika Anda tidak meminta kode ini, abaikan email ini.</p>
        </div>
      `,
    };

    // Proses kirim email
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `📩 [EMAIL SERVICE] Email berhasil dikirim ke ${email} (${info.messageId})`,
    );

    return true;
  } catch (error) {
    console.error("❌ [EMAIL SERVICE] Gagal mengirim email:", error.message);
    // Kita lemparkan error agar bisa ditangkap oleh blok catch di authController
    throw new Error("Gagal mengirim email OTP");
  }
};

module.exports = { sendOTPEmail };
