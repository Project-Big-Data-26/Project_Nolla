import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import { ArrowLeft, Check, Eye, EyeOff, Lock, X } from "lucide-react";

function RuleItem({ valid, children }) {
  return (
    <div
      className={`flex items-center gap-2 text-xs ${
        valid ? "text-green-600" : "text-slate-400"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
          valid ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"
        }`}
      >
        {valid ? (
          <Check className="h-2.5 w-2.5" />
        ) : (
          <X className="h-2.5 w-2.5" />
        )}
      </span>
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
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
        {label}
      </label>

      <div className="relative mt-1.5">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-neutral-border bg-white px-4 py-2.5 pr-11 text-sm text-neutral-text outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
        />

        <button
          type="button"
          onClick={() => setShowPassword((previous) => !previous)}
          aria-label={
            showPassword ? "Sembunyikan password" : "Tampilkan password"
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-primary"
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
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);

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
  const passwordRuleProgress =
    Object.values(passwordRules).filter(Boolean).length;

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
    setShowPasswordRequirements(false);
  };

  const handleBack = () => navigate("/profile");

  return (
    <div className="flex min-h-screen bg-neutral-bg font-sans text-neutral-text">
      <Navbar activePage="Profil" />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 pb-24 sm:px-8 lg:px-10 md:pb-8">
          <div className="overflow-hidden rounded-2xl border border-neutral-border bg-neutral-card shadow-xs">
            <div className="flex items-center justify-between border-b border-neutral-border bg-white px-6 py-5">
              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 shadow-2xs transition-colors hover:border-slate-300 hover:bg-slate-100 cursor-pointer"
                  title="Kembali ke Profil"
                >
                  <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                </button>
                <div>
                  <h1 className="font-heading text-lg font-bold leading-tight text-neutral-text sm:text-xl">
                    Ganti Password
                  </h1>
                  <p className="mt-0.5 text-xs text-neutral-muted">
                    Perbarui password akunmu untuk menjaga keamanan akun.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 p-6 md:p-8">
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
                    onChange={(value) => {
                      setNewPassword(value);
                      if (value.length > 0) setShowPasswordRequirements(true);
                    }}
                    showPassword={showNewPassword}
                    setShowPassword={setShowNewPassword}
                    placeholder="Masukkan password baru"
                  />

                  {showPasswordRequirements && (
                    <div
                      role="status"
                      aria-live="polite"
                      className="mt-3 space-y-2"
                    >
                      <p
                        className={`text-xs font-medium ${
                          isPasswordValid
                            ? "text-emerald-700"
                            : "text-slate-600"
                        }`}
                      >
                        {isPasswordValid
                          ? "Password baru sudah memenuhi syarat."
                          : "Password belum kuat. Harus memenuhi:"}
                      </p>

                      <div
                        className="grid grid-cols-4 gap-1"
                        aria-label={`${passwordRuleProgress} dari 4 syarat terpenuhi`}
                      >
                        {Object.values(passwordRules).map((valid, index) => (
                          <span
                            key={index}
                            className={`h-1 rounded-full ${
                              valid
                                ? isPasswordValid
                                  ? "bg-emerald-500"
                                  : "bg-red-500"
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>

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
                  )}
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
                      isConfirmationValid ? "text-green-600" : "text-red-500"
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
              </div>

              <div className="flex flex-col items-center justify-end gap-3 border-t border-neutral-border bg-slate-50/50 px-6 py-4 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-primary-hover sm:w-auto cursor-pointer"
                >
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
