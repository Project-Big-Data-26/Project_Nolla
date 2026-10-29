// File: services/emailService.js
const { Resend } = require("resend");

// Inisialisasi SDK Resend menggunakan API Key dari .env
const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmail = async (email, otp, type = "EMAIL_VERIFICATION") => {
  try {
    const isPasswordReset = type === "PASSWORD_RESET";
    const purpose = isPasswordReset ? "reset password" : "memverifikasi email";
    const validityMinutes = isPasswordReset ? 15 : 10;

    // Proses kirim email via Resend API (HTTPS Port 443)
    const { data, error } = await resend.emails.send({
      from: "Nolla App <no-reply@nolla.id>",
      to: [email],
      subject: isPasswordReset ? "Kode Reset Password" : "Kode Verifikasi (OTP) Anda",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #256c70;">${isPasswordReset ? "Reset Password" : "Verifikasi Email"}</h2>
          <p>Halo,</p>
          <p>Gunakan kode OTP berikut untuk ${purpose}:</p>
          <h1 style="color: #256c70; letter-spacing: 2px; background: #f4f4f4; display: inline-block; padding: 8px 16px; border-radius: 6px;">${otp}</h1>
          <p>Kode ini hanya berlaku selama <strong>${validityMinutes} menit</strong>.</p>
          <p>Jika Anda tidak meminta kode ini, abaikan email ini.</p>
        </div>
      `,
    });

    if (error) {
      console.error("❌ [RESEND API ERROR]:", error);
      throw new Error(error.message || "Gagal mengirim email OTP");
    }

    console.log(`📩 [EMAIL SERVICE] Email OTP terkirim via Resend (ID: ${data.id})`);
    return true;
  } catch (error) {
    console.error("❌ [EMAIL SERVICE] Gagal mengirim email:", error.message);
    throw new Error("Gagal mengirim email OTP");
  }
};

module.exports = { sendOTPEmail };