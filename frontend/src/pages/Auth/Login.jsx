import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import AuthCard from "../../components/AuthCard";
import AuthBrandPanel from "../../components/AuthBrandPanel";
import GoogleAuthButton from "../../components/GoogleAuthButton";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // --- FUNGSI LOGIN GOOGLE ---
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  // --- FUNGSI LOGIN EMAIL ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // RADAR 1: Cek apakah tombol benar-benar mengeksekusi fungsi ini
    console.log("TOMBOL MASUK DIKLIK! Data form:", formData);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();

      // RADAR 2: Cek apa balasan dari Backend Myrza
      console.log("RESPON DARI BACKEND:", result);

      if (response.ok && result.status === "success") {
        alert("Login Berhasil! Selamat datang kembali.");
        localStorage.setItem("accessToken", result.data.accessToken);
        localStorage.setItem("refreshToken", result.data.refreshToken);

        const isProfileComplete = result.data.user.isProfileComplete;
        if (!isProfileComplete) {
          window.location.href = "/profile";
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        alert(result.message || "Email atau password salah.");
      }
    } catch (error) {
      console.error("Error saat login:", error);
      alert("Terjadi kesalahan pada server. Pastikan backend menyala.");
    }
  };

  return (
    <AuthCard>
      {/* LEFT COLUMN: FORM LOGIN */}
      <div className="flex w-full flex-col justify-between p-6 sm:p-8 lg:p-10 lg:w-1/2">
        <div>
          {/* HEADER TEXT */}
          <div className="mt-2 sm:mt-4">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-neutral-text text-center">
              Masuk ke Akun Anda
            </h1>
            <p className="mt-1 sm:mt-1.5 text-xs text-neutral-muted text-center">
              Selamat datang kembali! Pilih metode untuk masuk:
            </p>
          </div>

          {/* GOOGLE OAUTH BUTTON */}
          <GoogleAuthButton 
            label="Masuk dengan Google" 
            onClick={handleGoogleLogin} 
          />

          {/* DIVIDER */}
          <div className="relative my-5 sm:my-6 flex items-center justify-center">
            <div className="w-full border-t border-neutral-border"></div>
            <span className="absolute bg-neutral-card px-3 text-[11px] text-neutral-muted">
              atau gunakan email
            </span>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
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
                  className="w-full rounded-xl border border-neutral-border bg-neutral-bg py-2.5 pl-10 pr-10 text-xs text-neutral-text placeholder-neutral-muted transition-colors focus:border-primary focus:bg-neutral-card focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-neutral-muted hover:text-neutral-text cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* REMEMBER ME & FORGOT PASSWORD */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-3.5 w-3.5 rounded border-neutral-border text-primary focus:ring-primary cursor-pointer"
                />
                <span className="text-neutral-muted text-[11px] sm:text-xs">
                  Ingat saya
                </span>
              </label>
              <a
                href="/forgot"
                className="font-semibold text-primary hover:text-primary-hover transition-colors text-[11px] sm:text-xs"
              >
                Lupa Kata Sandi?
              </a>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-primary py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover cursor-pointer"
            >
              Masuk
            </button>
          </form>
        </div>

        {/* FOOTER TEXT */}
        <p className="mt-6 sm:mt-8 text-center text-xs text-neutral-muted">
          Belum memiliki akun?{" "}
          <Link
            to="/register"
            className="font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            Buat akun baru
          </Link>
        </p>
      </div>

      {/* RIGHT COLUMN: BRAND BANNER (WARNA PRIMARY) */}
      <AuthBrandPanel />
    </AuthCard>
  );
};

export default Login;