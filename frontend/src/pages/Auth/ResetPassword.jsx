import React, { useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import AuthCard from "../../components/AuthCard";
import AuthBrandPanel from "../../components/AuthBrandPanel";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  // State untuk form Password
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // State & Ref untuk 6 Kotak OTP (Kloning dari VerifyEmail)
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  const handlePasswordChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // --- LOGIKA 6 KOTAK OTP ---
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    const newOtp = [...otp];
    pastedData.split("").forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  // --- INTEGRASI API RESET ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join("");

    if (fullOtp.length < 6) {
      alert("Mohon masukkan 6 digit kode OTP secara lengkap.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      alert("Konfirmasi kata sandi baru tidak cocok!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          otp: fullOtp,
          newPassword: formData.newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        alert("Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru.");
        navigate("/login");
      } else {
        alert(result.message || "Gagal mereset kata sandi. Pastikan OTP benar.");
      }
    } catch (error) {
      console.error("Error reset password:", error);
      alert("Terjadi kesalahan pada server. Pastikan backend menyala.");
    } finally {
      setLoading(false);
    }
  };

  // Jika diakses tanpa lewat halaman /forgot
  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-bg p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-border max-w-md">
          <h2 className="text-lg font-bold text-red-600 mb-2">Akses Ditolak</h2>
          <p className="text-sm text-neutral-muted mb-6">Minta kode OTP dari halaman Lupa Kata Sandi terlebih dahulu.</p>
          <button onClick={() => navigate('/forgot')} className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-semibold">Ke Halaman Lupa Kata Sandi</button>
        </div>
      </div>
    );
  }

  return (
    <AuthCard>
      {/* LEFT COLUMN: FORM RESET PASSWORD */}
      <div className="flex w-full flex-col justify-between p-6 sm:p-8 lg:p-10 lg:w-1/2">
        <div>
          <div className="mt-2 sm:mt-4">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-neutral-text text-center">
              Atur Ulang Kata Sandi
            </h1>
            <p className="mt-1 sm:mt-1.5 text-xs text-neutral-muted text-center">
              Masukkan OTP yang dikirim ke <span className="font-semibold">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:space-y-5">
            
            {/* 6 KOTAK OTP (Diadopsi dari VerifyEmail) */}
            <div className="flex items-center justify-center gap-2 sm:gap-2.5 mb-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl border border-neutral-border bg-neutral-bg text-center font-heading text-lg font-bold text-neutral-text shadow-xs transition-colors focus:border-primary focus:bg-neutral-card focus:outline-none"
                />
              ))}
            </div>

            {/* KATA SANDI BARU */}
            <div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-neutral-muted shrink-0" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Kata Sandi Baru"
                  required
                  className="w-full rounded-xl border border-neutral-border bg-neutral-bg py-2.5 pl-10 pr-10 text-xs text-neutral-text placeholder-neutral-muted transition-colors focus:border-primary focus:bg-neutral-card focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 text-neutral-muted hover:text-neutral-text cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* KONFIRMASI KATA SANDI BARU */}
            <div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-neutral-muted shrink-0" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Konfirmasi Kata Sandi Baru"
                  required
                  className="w-full rounded-xl border border-neutral-border bg-neutral-bg py-2.5 pl-10 pr-10 text-xs text-neutral-text placeholder-neutral-muted transition-colors focus:border-primary focus:bg-neutral-card focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 text-neutral-muted hover:text-neutral-text cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-primary py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover cursor-pointer disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
            </button>
          </form>
        </div>

        {/* FOOTER LINK */}
        <div className="mt-6 sm:mt-8 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Login
          </Link>
        </div>
      </div>

      <AuthBrandPanel
        title="Kata Sandi Baru"
        description="Setelah diperbarui, gunakan kata sandi baru Anda untuk masuk ke platform."
      />
    </AuthCard>
  );
};

export default ResetPassword;