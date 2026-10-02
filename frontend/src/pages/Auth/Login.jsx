import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast, Toaster } from "sonner";
import AuthCard from "../../components/AuthCard";
import AuthBrandPanel from "../../components/AuthBrandPanel";
import GoogleAuthButton from "../../components/GoogleAuthButton";
import { useAuth } from "../../context/AuthContext"; // 1. IMPORT USEAUTH

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // 2. AMBIL FUNGSI LOGIN DARI CONTEXT

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (errorMessage) setErrorMessage("");
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
    setErrorMessage("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
        }),
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        // 3. PANGGIL FUNGSI LOGIN CONTEXT UNTUK MEMPERBARUI STATE GLOBAL & LOCALSTORAGE
        // Pastikan parameter pertama adalah objek user, parameter kedua adalah token utama
        const userData = result.data.user || { email: formData.email };
        const token = result.data.accessToken;

        login(userData, token);

        // Jika backend mengirim refreshToken, simpan juga ke localStorage
        if (result.data.refreshToken) {
          localStorage.setItem("refreshToken", result.data.refreshToken);
        }

        toast.success("Login Berhasil!");

        const isProfileComplete = result.data.user?.isProfileComplete;

        setTimeout(() => {
          if (!isProfileComplete) {
            navigate("/personalization");
          } else {
            navigate("/topik");
          }
        }, 1200);
      } else {
        const msg =
          result.message || "Email atau password yang Anda masukkan salah.";
        if (result.code === "EMAIL_NOT_VERIFIED") {
          navigate("/verify", {
            state: {
              email: formData.email.trim(),
              action: "register",
              resendAfterSeconds: result.retryAfterSeconds ?? 0,
            },
          });
          return;
        }
        setErrorMessage(msg);
        toast.error("Login Gagal", {
          description: msg,
        });
      }
    } catch (error) {
      console.error("Error saat login:", error);
      const connError = "Gagal terhubung ke server. Pastikan backend menyala.";
      setErrorMessage(connError);
      toast.error("Masalah Jaringan", {
        description: connError,
      });
    }
  };

  return (
    <AuthCard>
      <Toaster position="top-center" richColors closeButton />

      {/* LEFT COLUMN: FORM LOGIN */}
      <div className="flex w-full flex-col justify-between p-6 sm:p-8 lg:p-10 lg:w-1/2">
        <div>
          <div className="mt-2 sm:mt-4">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-neutral-text text-center">
              Masuk ke Akun Anda
            </h1>
            <p className="mt-1 sm:mt-1.5 text-xs text-neutral-muted text-center">
              Selamat datang kembali! Pilih metode untuk masuk:
            </p>
          </div>

          {errorMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="mt-4">
            <GoogleAuthButton
              label="Masuk dengan Google"
              onClick={handleGoogleLogin}
            />
          </div>

          <div className="relative my-5 sm:my-6 flex items-center justify-center">
            <div className="w-full border-t border-neutral-border"></div>
            <span className="absolute bg-neutral-card px-3 text-[11px] text-neutral-muted">
              atau gunakan email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
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
              <Link
                to="/forgot-password"
                className="font-semibold text-primary hover:text-primary-hover transition-colors text-[11px] sm:text-xs"
              >
                Lupa Kata Sandi?
              </Link>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-primary py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover cursor-pointer"
            >
              Masuk
            </button>
          </form>
        </div>

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

      <AuthBrandPanel />
    </AuthCard>
  );
};

export default Login;
