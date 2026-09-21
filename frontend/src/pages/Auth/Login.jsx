import React, { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Mail, Lock, Eye, EyeOff } from "lucide-react";

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

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

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
    <div className="flex min-h-screen items-center justify-center bg-neutral-bg p-4 sm:p-6 font-sans text-neutral-text">
      {/* CARD CONTAINER */}
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl sm:rounded-3xl bg-neutral-card shadow-lg border border-neutral-border">
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
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="mt-5 sm:mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl border border-neutral-border bg-neutral-card py-2.5 px-4 text-xs font-semibold text-neutral-text transition-colors hover:bg-neutral-bg cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Masuk dengan Google
            </button>

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
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
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
                  href="#"
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
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-10 text-white relative overflow-hidden">
          {/* BACKGROUND CIRCLE PATTERNS */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />

          {/* TOP SPACER */}
          <div />

          {/* CENTER ILLUSTRATION PLACEHOLDER */}
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
        </div>
      </div>
    </div>
  );
};

export default Login;
