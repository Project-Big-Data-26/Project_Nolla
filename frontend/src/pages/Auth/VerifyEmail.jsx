import React, { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-neutral-bg p-4 sm:p-6 font-sans text-neutral-text">
      {/* CARD CONTAINER */}
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl sm:rounded-3xl bg-neutral-card shadow-lg border border-neutral-border">
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
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-10 text-white relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
          <div />

          <div className="relative z-10 flex flex-col items-center justify-center my-auto">
            <div className="relative w-64 h-48 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl flex flex-col justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-white/30 rounded-md w-3/4" />
                <div className="h-2.5 bg-white/20 rounded-md w-1/2" />
                <div className="h-2.5 bg-white/20 rounded-md w-5/6" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/30" />
                  <div className="h-2 bg-white/30 rounded w-16" />
                </div>
                <div className="h-4 w-12 bg-white/20 rounded-lg" />
              </div>
            </div>
          </div>

          <div className="relative z-10 text-center">
            <h2 className="font-heading text-lg font-bold text-white">
              Verifikasi Keamanan
            </h2>
            <p className="mt-1 text-xs text-white/80 leading-relaxed">
              Memastikan akun Anda terhubung secara aman dengan alamat email
              resmi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
