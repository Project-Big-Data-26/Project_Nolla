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

const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"E-Learning App" <${process.env.SMTP_USER}>`, // Nama pengirim
      to: email, // Email tujuan
      subject: "Kode Verifikasi (OTP) Anda",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Verifikasi Email</h2>
          <p>Halo,</p>
          <p>Terima kasih telah mendaftar. Berikut adalah kode OTP untuk memverifikasi email Anda:</p>
          <h1 style="color: #4CAF50; letter-spacing: 2px;">${otp}</h1>
          <p>Kode ini hanya berlaku selama <strong>10 menit</strong>.</p>
          <p>Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
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

const sendPasswordResetOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: `"E-Learning Project" <${process.env.SMTP_USER}>`,
    to,
    subject: "Kode Reset Password",
    text: `Kode OTP untuk reset password Anda adalah: ${otp}. Kode ini berlaku selama 15 menit.`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Reset Password</h2>

        <p>
          Gunakan kode OTP berikut untuk mengubah password Anda:
        </p>

        <h1 style="letter-spacing: 8px;">
          ${otp}
        </h1>

        <p>
          Kode ini berlaku selama 15 menit.
        </p>

        <p>
          Jika Anda tidak meminta reset password,
          abaikan email ini.
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail, sendPasswordResetOTPEmail };
