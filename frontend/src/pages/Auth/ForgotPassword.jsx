import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import AuthCard from "../../components/AuthCard";
import AuthBrandPanel from "../../components/AuthBrandPanel";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage({ type: "", text: "" });

    try {
      // TODO: `API` belum di-import di file ini — cek path axios instance
      // yang dipakai Login.jsx/Register.jsx, lalu tambahkan importnya di sini.
      const response = await API.post("/auth/forgot-password", {
        email: email.trim(),
      });

      setStatusMessage({
        type: "success",
        text: response.data.message || "Kode OTP telah dikirim ke email Anda.",
      });

      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 1500);
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Gagal mengirimkan kode OTP.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
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

          {statusMessage.text && (
            <div
              className={`mt-4 rounded-xl p-3 text-center text-xs border ${statusMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-red-50 text-red-600 border-red-100"
                }`}
            >
              {statusMessage.text}
            </div>
          )}

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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Alamat Email Terdaftar"
                  required
                  className="w-full rounded-xl border border-neutral-border bg-neutral-bg py-2.5 pl-10 pr-4 text-xs text-neutral-text placeholder-neutral-muted transition-colors focus:border-primary focus:bg-neutral-card focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-primary py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover cursor-pointer disabled:opacity-50"
            >
              {loading ? "Mengirim OTP..." : "Kirim Kode OTP"}
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

      {/* RIGHT COLUMN: BRAND BANNER */}
      <AuthBrandPanel
        title="Pemulihan Akun"
        description="Atur ulang kata sandi dengan aman menggunakan sistem OTP langsung ke email Anda."
      />
    </AuthCard>
  );
};

export default ForgotPassword;