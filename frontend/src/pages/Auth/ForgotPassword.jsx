import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import API from "../../api/axios";
import AuthBrandPanel from "../../components/AuthBrandPanel";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown <= 0) return undefined;
    const timer = window.setTimeout(
      () => setResendCountdown((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  const handleChangeEmail = (e) => {
    setEmail(e.target.value);
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await API.post("/auth/forgot-password", {
        email: email.trim(),
      });

      toast.dismiss();
      toast.success(response.data.message);

      // Arahkan ke /verify dengan menyertakan action 'reset-password'
      setTimeout(() => {
        navigate("/verify", {
          state: {
            email: email.trim(),
            action: "reset-password",
            resendAfterSeconds: response.data.data?.resendAfterSeconds ?? 0,
          },
        });
      }, 1200);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Gagal mengirimkan kode OTP. Pastikan email terdaftar.";
      if (err.response?.data?.retryAfterSeconds) {
        setResendCountdown(err.response.data.retryAfterSeconds);
      }
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-bg p-4 sm:p-6 font-sans text-neutral-text">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl sm:rounded-3xl bg-neutral-card shadow-lg border border-neutral-border">
        {/* LEFT COLUMN: FORM FORGOT */}
        <div className="flex w-full flex-col justify-between p-6 sm:p-8 lg:p-10 lg:w-1/2">
          <div>
            <div className="mt-2 sm:mt-4">
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-neutral-text text-center">
                Lupa Kata Sandi
              </h1>
              <p className="mt-1 sm:mt-1.5 text-xs text-neutral-muted text-center">
                Masukkan email Anda untuk menerima kode OTP pemulihan:
              </p>
            </div>

            {/* BANNER ERROR INLINE */}
            {errorMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAG FORM MEMBUNGKUS INPUT DAN TOMBOL SUBMIT */}
            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-3.5 sm:space-y-4"
            >
              <div>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 h-4 w-4 text-neutral-muted shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={handleChangeEmail}
                    placeholder="Alamat Email Terdaftar"
                    required
                    className="w-full rounded-xl border border-neutral-border bg-neutral-bg py-2.5 pl-10 pr-4 text-xs text-neutral-text placeholder-neutral-muted transition-colors focus:border-primary focus:bg-neutral-card focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || resendCountdown > 0}
                className="mt-2 w-full rounded-xl bg-primary py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover cursor-pointer disabled:opacity-50"
              >
                {loading
                  ? "Mengirim OTP..."
                  : resendCountdown > 0
                    ? `Kirim ulang OTP dalam ${Math.floor(resendCountdown / 60)}:${String(resendCountdown % 60).padStart(2, "0")}`
                    : "Kirim Kode OTP"}
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
          title="Pemulihan Akun"
          description="Atur ulang kata sandi dengan aman menggunakan sistem OTP langsung ke email Anda."
        />
      </div>
    </div>
  );
};

export default ForgotPassword;
