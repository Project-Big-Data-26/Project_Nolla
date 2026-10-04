import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import AuthCard from "../../components/AuthCard";
import AuthBrandPanel from "../../components/AuthBrandPanel";
import GoogleAuthButton from "../../components/GoogleAuthButton";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Bersihkan banner error saat pengguna mulai mengetik ulang
    if (errorMessage) setErrorMessage("");

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Validasi Kesesuaian Password
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Kata sandi dan konfirmasi kata sandi tidak cocok!");
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(formData.password)) {
      setErrorMessage(
        "Password minimal 8 karakter dan harus memiliki huruf besar, huruf kecil, serta angka.",
      );
      return;
    }

    const payloadData = {
      name: formData.fullName,
      email: formData.email,
      password: formData.password,
    };

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadData),
      });

      const data = await response.json();

      if (response.ok) {
        // Toast Notifikasi Sukses via Sonner
        toast.success("Pendaftaran Berhasil!", {
          description: "Kode verifikasi OTP telah dikirimkan ke email Anda.",
        });

        // Jeda singkat agar toast sempat terbaca sebelum navigasi
        setTimeout(() => {
          navigate("/verify", {
            state: {
              email: formData.email,
              resendAfterSeconds: data.data?.resendAfterSeconds ?? 0,
            },
          });
        }, 1200);
      } else {
        // Tampilkan error dari backend di banner inline
        setErrorMessage(
          data.message || "Pendaftaran gagal, silakan coba lagi.",
        );
      }
    } catch (error) {
      console.error("Error saat integrasi:", error);
      setErrorMessage(
        "Terjadi kesalahan pada server. Pastikan backend sudah menyala.",
      );
    }
  };

  return (
    <AuthCard>
      {/* Container Toaster Sonner di posisi tengah atas */}
      <Toaster position="top-center" richColors closeButton />

      {/* LEFT COLUMN: FORM REGISTER */}
      <div className="flex w-full flex-col justify-between p-6 sm:p-8 lg:p-10 lg:w-1/2">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-border px-3 py-2 text-xs font-semibold text-neutral-muted transition-colors hover:border-primary hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>

          {/* HEADER TEXT */}
          <div className="mt-2 sm:mt-4">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-neutral-text text-center">
              Buat Akun Baru
            </h1>
            <p className="mt-1 sm:mt-1.5 text-xs text-neutral-muted text-center">
              Mulai perjalanan belajarmu bersama kami hari ini!
            </p>
          </div>

          {/* BANNER ERROR INLINE (Di atas tombol Google Auth) */}
          {errorMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* GOOGLE OAUTH BUTTON */}
          <div className="mt-4">
            <GoogleAuthButton
              label="Daftar dengan Google"
              onClick={() => {
                window.location.href = "http://localhost:5000/api/auth/google";
              }}
            />
          </div>

          {/* DIVIDER */}
          <div className="relative my-5 sm:my-6 flex items-center justify-center">
            <div className="w-full border-t border-neutral-border"></div>
            <span className="absolute bg-neutral-card px-3 text-[11px] text-neutral-muted">
              atau isi formulir
            </span>
          </div>

          {/* REGISTER FORM */}
          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
            {/* FULL NAME FIELD */}
            <div>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 h-4 w-4 text-neutral-muted shrink-0" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nama Lengkap"
                  required
                  className="w-full rounded-xl border border-neutral-border bg-neutral-bg py-2.5 pl-10 pr-4 text-xs text-neutral-text placeholder-neutral-muted transition-colors focus:border-primary focus:bg-neutral-card focus:outline-none"
                />
              </div>
            </div>

            {/* EMAIL FIELD */}
            <div>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 h-4 w-4 text-neutral-muted shrink-0" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Alamat Email"
                  required
                  className="w-full rounded-xl border border-neutral-border bg-neutral-bg py-2.5 pl-10 pr-4 text-xs text-neutral-text placeholder-neutral-muted transition-colors focus:border-primary focus:bg-neutral-card focus:outline-none"
                />
              </div>
            </div>

            {/* PASSWORD FIELD */}
            <div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-neutral-muted shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Kata Sandi"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-neutral-border bg-neutral-bg py-2.5 pl-10 pr-10 text-xs text-neutral-text placeholder-neutral-muted transition-colors focus:border-primary focus:bg-neutral-card focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-neutral-muted hover:text-neutral-text cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 pl-1 text-[11px] text-neutral-muted">
                Minimal 8 karakter, mencakup huruf besar, huruf kecil, dan angka.
              </p>
            </div>

            {/* CONFIRM PASSWORD FIELD */}
            <div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-neutral-muted shrink-0" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Konfirmasi Kata Sandi"
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

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-primary py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover cursor-pointer"
            >
              Daftar Akun
            </button>
          </form>
        </div>

        {/* FOOTER TEXT */}
        <p className="mt-6 sm:mt-8 text-center text-xs text-neutral-muted">
          Sudah memiliki akun?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            Masuk di sini
          </Link>
        </p>
      </div>

      {/* RIGHT COLUMN: BRAND BANNER */}
      <AuthBrandPanel />
    </AuthCard>
  );
};

export default Register;
