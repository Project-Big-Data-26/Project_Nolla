import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";
import { toast, Toaster } from "sonner";
import AuthCard from "../../components/AuthCard";
import AuthBrandPanel from "../../components/AuthBrandPanel";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";
  const otp = location.state?.otp || "";

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = (e) => {
    if (errorMessage) setErrorMessage("");
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi baru tidak cocok!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            otp: otp,
            newPassword: formData.newPassword,
          }),
        },
      );

      const result = await response.json();

      if (response.ok && result.status === "success") {
        toast.success("Kata Sandi Berhasil Diperbarui!", {
          description: "Silakan masuk kembali dengan kata sandi baru Anda.",
        });

        setTimeout(() => {
          navigate("/login");
        }, 1200);
      } else {
        setErrorMessage(
          result.message || "Gagal mereset kata sandi. Silakan coba lagi.",
        );
      }
    } catch (error) {
      console.error("Error reset password:", error);
      setErrorMessage(
        "Terjadi kesalahan pada server. Pastikan backend menyala.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Proteksi jika diakses tanpa verifikasi OTP sebelumnya
  if (!email || !otp) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-bg p-4 text-center font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-border max-w-md">
          <h2 className="text-lg font-bold text-red-600 mb-2">Akses Ditolak</h2>
          <p className="text-sm text-neutral-muted mb-6">
            Silakan verifikasi kode OTP dari halaman Lupa Kata Sandi terlebih
            dahulu.
          </p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer hover:bg-primary-hover transition-colors"
          >
            Ke Halaman Lupa Kata Sandi
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthCard>
      <Toaster position="top-center" richColors closeButton />

      {/* LEFT COLUMN: FORM RESET PASSWORD */}
      <div className="flex w-full flex-col justify-between p-6 sm:p-8 lg:p-10 lg:w-1/2">
        <div>
          <div className="mt-2 sm:mt-4">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-neutral-text text-center">
              Atur Ulang Kata Sandi
            </h1>
            <p className="mt-1 sm:mt-1.5 text-xs text-neutral-muted text-center">
              Buat kata sandi baru untuk akun{" "}
              <span className="font-semibold">{email}</span>
            </p>
          </div>

          {errorMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
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
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-primary py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover cursor-pointer disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
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
        title="Kata Sandi Baru"
        description="Setelah diperbarui, gunakan kata sandi baru Anda untuk masuk ke platform."
      />
    </AuthCard>
  );
};

export default ResetPassword;
