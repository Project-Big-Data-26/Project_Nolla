import { useState } from "react";
import Navbar from "../components/Navbar";
import { ArrowLeft, Check, Eye, EyeOff, Lock, X } from "lucide-react";

function RuleItem({ valid, children }) {
  return (
    <div
      className={`flex items-center gap-2 text-xs ${
        valid ? "text-green-600" : "text-slate-400"
      }`}
    >
      {valid ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <X className="h-3.5 w-3.5" />
      )}
      <span>{children}</span>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  showPassword,
  setShowPassword,
  placeholder,
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#17326b]">
        {label}
      </label>

      <div className="relative mt-2">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-blue-100 px-4 py-3 pr-11 text-sm text-[#17326b] outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
        />

        <button
          type="button"
          onClick={() => setShowPassword((previous) => !previous)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");

  const passwordRules = {
    minLength: newPassword.length >= 8,
    hasLetter: /[A-Za-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    differentFromCurrent:
      currentPassword.length > 0 && newPassword !== currentPassword,
  };

  const isPasswordValid =
    passwordRules.minLength &&
    passwordRules.hasLetter &&
    passwordRules.hasNumber &&
    passwordRules.differentFromCurrent;

  const isConfirmationValid =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = (event) => {
    event.preventDefault();

    setMessage("");

    if (!isPasswordValid) {
      setMessage("Password baru belum memenuhi ketentuan.");
      return;
    }

    if (!isConfirmationValid) {
      setMessage("Konfirmasi password tidak sesuai.");
      return;
    }

    setMessage("Password berhasil diperbarui.");
  };

  const handleCancel = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage("");
  };

  return (
    <div className="flex min-h-screen bg-neutral-bg">
      <Navbar />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-[700px]">
          <div className="mb-6">
            <button
              type="button"
              onClick={handleCancel}
              className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#17326b]"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Profil
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Lock className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-[#17326b]">
                  Ganti Password
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Perbarui password akunmu untuk menjaga keamanan akun.
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <PasswordInput
                label="Password Saat Ini"
                value={currentPassword}
                onChange={setCurrentPassword}
                showPassword={showCurrentPassword}
                setShowPassword={setShowCurrentPassword}
                placeholder="Masukkan password saat ini"
              />

              <div>
                <PasswordInput
                  label="Password Baru"
                  value={newPassword}
                  onChange={setNewPassword}
                  showPassword={showNewPassword}
                  setShowPassword={setShowNewPassword}
                  placeholder="Masukkan password baru"
                />

                {/* Validasi password selalu ditampilkan */}
                <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-600">
                    Password harus memenuhi:
                  </p>

                  <RuleItem valid={passwordRules.minLength}>
                    Minimal 8 karakter
                  </RuleItem>

                  <RuleItem valid={passwordRules.hasLetter}>
                    Mengandung huruf
                  </RuleItem>

                  <RuleItem valid={passwordRules.hasNumber}>
                    Mengandung angka
                  </RuleItem>

                  <RuleItem valid={passwordRules.differentFromCurrent}>
                    Tidak sama dengan password saat ini
                  </RuleItem>
                </div>
              </div>

              <PasswordInput
                label="Konfirmasi Password Baru"
                value={confirmPassword}
                onChange={setConfirmPassword}
                showPassword={showConfirmPassword}
                setShowPassword={setShowConfirmPassword}
                placeholder="Masukkan kembali password baru"
              />

              {confirmPassword.length > 0 && (
                <p
                  className={`-mt-3 text-xs ${
                    isConfirmationValid
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {isConfirmationValid
                    ? "Konfirmasi password sesuai."
                    : "Konfirmasi password tidak sesuai."}
                </p>
              )}

              {message && (
                <div
                  className={`rounded-xl px-4 py-3 text-sm ${
                    message === "Password berhasil diperbarui."
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-500"
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Simpan Password
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Batal
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}