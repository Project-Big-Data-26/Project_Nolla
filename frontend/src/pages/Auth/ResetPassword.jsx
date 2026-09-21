import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import AuthCard from "../../components/AuthCard";
import AuthBrandPanel from "../../components/AuthBrandPanel";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      alert("Konfirmasi kata sandi baru tidak cocok!");
      return;
    }

    console.log("Static Reset Password Data:", formData);
    alert(
      "Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru.",
    );
    navigate("/login");
  };

  return (
    <AuthCard>
      {/* LEFT COLUMN: FORM RESET PASSWORD */}
      <div className="flex w-full flex-col justify-between p-6 sm:p-8 lg:p-10 lg:w-1/2">
        <div>
          <div className="mt-2 sm:mt-4">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-neutral-text text-center">
              Atur Ulang Kata Sandi
            </h1>
            <p className="mt-1 sm:mt-1.5 text-xs text-neutral-muted text-center">
              Buat kata sandi baru untuk mengamankan akun Anda:
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-3.5 sm:space-y-4"
          >
            {/* KATA SANDI BARU */}
            <div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-neutral-muted shrink-0" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
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
                  onChange={handleChange}
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

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-primary py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover cursor-pointer"
            >
              Simpan Kata Sandi Baru
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
      <AuthBrandPanel
        title="Kata Sandi Baru"
        description="Setelah diperbarui, gunakan kata sandi baru Anda untuk masuk ke platform."
      />
    </AuthCard>
  );
};

export default ResetPassword;