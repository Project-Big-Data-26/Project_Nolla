import React, { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { toast, Toaster } from "sonner";
import AuthCard from "../../components/AuthCard";
import AuthBrandPanel from "../../components/AuthBrandPanel";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Data dari navigate state
  const email = location.state?.email || "user@example.com";
  const action = location.state?.action || "register"; // 'register' atau 'reset-password'

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    if (errorMessage) setErrorMessage("");

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
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

  const handleVerify = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    setErrorMessage("");

    if (fullOtp.length < 6) {
      setErrorMessage("Harap masukkan 6 digit kode OTP secara lengkap!");
      return;
    }

    setLoading(true);

    try {
      if (action === "reset-password") {
        //Cek OTP ke Backend
        const response = await fetch(
          "http://localhost:5000/api/auth/verify-reset-otp",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, otp: fullOtp }),
          },
        );

        const result = await response.json();

        if (response.ok && result.status === "success") {
          toast.success("Kode OTP Valid!", {
            description: "Silakan buat kata sandi baru Anda.",
          });

          setTimeout(() => {
            navigate("/reset", {
              state: { email: email, otp: fullOtp },
            });
          }, 1200);
        } else {
          // ❌ OTP NGAWUR PASTI DITOLAK DI SINI
          setErrorMessage(
            result.message || "Kode OTP salah atau sudah kedaluwarsa.",
          );
        }
      } else {
        // Alur Verifikasi Email Registrasi biasa
        const response = await fetch(
          "http://localhost:5000/api/auth/verify-email",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, otp: fullOtp }),
          },
        );

        const result = await response.json();

        if (response.ok && result.status === "success") {
          toast.success("Verifikasi Berhasil!", {
            description: "Akun Anda telah aktif.",
          });

          localStorage.setItem("accessToken", result.data.accessToken);
          localStorage.setItem("refreshToken", result.data.refreshToken);

          const isProfileComplete = result.data.user?.isProfileComplete;

          setTimeout(() => {
            if (!isProfileComplete) {
              navigate("/personalization");
            } else {
              navigate("/");
            }
          }, 1200);
        } else {
          setErrorMessage(
            result.message || "Kode OTP salah atau sudah kedaluwarsa.",
          );
        }
      }
    } catch (error) {
      console.error("Error verifikasi OTP:", error);
      setErrorMessage(
        "Terjadi kesalahan pada server. Pastikan backend menyala.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <Toaster position="top-center" richColors closeButton />

      <div className="flex w-full flex-col justify-between p-6 sm:p-8 lg:p-10 lg:w-1/2">
        <div>
          <div className="mt-2 sm:mt-4">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-neutral-text text-center">
              Verifikasi Kode OTP
            </h1>
            <p className="mt-2 text-xs text-neutral-muted text-center leading-relaxed">
              Kode OTP telah dikirimkan ke <br />
              <span className="font-semibold text-neutral-text">{email}</span>
            </p>
          </div>

          {errorMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="mt-6 space-y-6">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover cursor-pointer disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Verifikasi OTP"}
            </button>
          </form>
        </div>

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
        title="Verifikasi Keamanan"
        description="Memastikan verifikasi terhubung secara aman dengan alamat email resmi."
      />
    </AuthCard>
  );
};

export default VerifyEmail;
