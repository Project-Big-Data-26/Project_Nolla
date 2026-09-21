import React, { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AuthCard from "../../components/AuthCard";
import AuthBrandPanel from "../../components/AuthBrandPanel";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "user@example.com";

  // State untuk 6 digit OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  // Tangani perubahan isi kotak OTP
  const handleChange = (index, value) => {
    // Hanya menerima karakter angka
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Ambil 1 karakter terakhir
    setOtp(newOtp);

    // Otomatis pindah fokus ke kotak berikutnya jika diisi
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Tangani tombol Backspace untuk kembali ke kotak sebelumnya
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Tangani Paste (misal user copy 6 digit sekaligus)
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    // Fokus ke kotak terakhir setelah paste
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      alert("Harap masukkan 6 digit kode OTP secara lengkap!");
      return;
    }

    console.log("Static OTP Verification:", { email, otp: fullOtp });
    // Simulasi verifikasi sukses -> alihkan ke Dashboard
    navigate("/dashboard");
  };

  return (
    <AuthCard>
      {/* LEFT COLUMN: FORM VERIFY (6 KOTAK OTP) */}
      <div className="flex w-full flex-col justify-between p-6 sm:p-8 lg:p-10 lg:w-1/2">
        <div>
          <div className="mt-2 sm:mt-4">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-neutral-text text-center">
              Verifikasi Email
            </h1>
            <p className="mt-2 text-xs text-neutral-muted text-center leading-relaxed">
              Kode OTP telah dikirimkan ke <br />
              <span className="font-semibold text-neutral-text">{email}</span>
            </p>
          </div>

          {/* FORM VERIFIKASI OTP */}
          <form onSubmit={handleVerify} className="mt-8 space-y-6">
            {/* 6 KOTAK INPUT OTP */}
            <div className="flex items-center justify-center gap-2 sm:gap-2.5">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl border border-neutral-border bg-neutral-bg text-center font-heading text-lg font-bold text-neutral-text shadow-xs transition-colors focus:border-primary focus:bg-neutral-card focus:outline-none"
                />
              ))}
            </div>

            {/* TOMBOL VERIFIKASI */}
            <button
              type="submit"
              className="w-full rounded-xl bg-primary py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover cursor-pointer"
            >
              Verifikasi Email
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

      {/* RIGHT COLUMN: BRAND BANNER */}
      <AuthBrandPanel
        title="Verifikasi Keamanan"
        description="Memastikan akun Anda terhubung secara aman dengan alamat email resmi."
      />
    </AuthCard>
  );
};

export default VerifyEmail;