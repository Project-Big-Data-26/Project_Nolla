import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import AuthCard from "../../components/AuthCard";
import AuthBrandPanel from "../../components/AuthBrandPanel";
import GoogleAuthButton from "../../components/GoogleAuthButton";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (formData.password !== formData.confirmPassword) {
    alert("Kata sandi dan konfirmasi kata sandi tidak cocok!");
    return;
  }

  // 1. KITA BUNGKUS DATANYA DENGAN NAMA YANG DIMINTA MYRZA
  const payloadData = {
    name: formData.fullName, // Pastikan huruf 'N' nya besar!
    email: formData.email,
    password: formData.password
  };

  // 2. RADAR UNTUK CEK APAKAH DATANYA KOSONG ATAU ADA ISINYA
  console.log("DATA YANG MAU DIKIRIM KE BACKEND:", payloadData);

  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadData),
    });

    const data = await response.json();

if (response.ok) {
      alert("Pendaftaran Berhasil! Silakan cek email Anda untuk kode verifikasi OTP.");
      
      // Pindah ke halaman verifikasi sambil membawa data email yang baru didaftarkan
      navigate("/verify", { state: { email: formData.email } }); 
    } else {
      alert(data.message || "Pendaftaran gagal, coba lagi.");
    }
  } catch (error) {
    console.error("Error saat integrasi:", error);
    alert("Terjadi kesalahan pada server. Pastikan backend sudah menyala.");
  }
};

  return (
    <AuthCard>
      {/* LEFT COLUMN: FORM REGISTER */}
      <div className="flex w-full flex-col justify-between p-6 sm:p-8 lg:p-10 lg:w-1/2">
        <div>
          {/* HEADER TEXT */}
          <div className="mt-2 sm:mt-4">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-neutral-text text-center">
              Buat Akun Baru
            </h1>
            <p className="mt-1 sm:mt-1.5 text-xs text-neutral-muted text-center">
              Mulai perjalanan belajarmu bersama kami hari ini!
            </p>
          </div>

          {/* GOOGLE OAUTH BUTTON */}
          {/* Ubah baris pemanggilan tombol Google di Login.jsx menjadi seperti ini: */}
<GoogleAuthButton 
  label="Masuk dengan Google" 
  onClick={() => {
    window.location.href = "http://localhost:5000/api/auth/google";
  }} 
/>

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

            {/* TERMS & CONDITIONS */}
            <div className="flex items-center pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  required
                  className="h-3.5 w-3.5 rounded border-neutral-border text-primary focus:ring-primary cursor-pointer"
                />
                <span className="text-neutral-muted text-[11px] sm:text-xs">
                  Saya menyetujui Syarat & Ketentuan Layanan
                </span>
              </label>
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

      {/* RIGHT COLUMN: BRAND BANNER (WARNA PRIMARY) */}
      <AuthBrandPanel />
    </AuthCard>
  );
};

export default Register;