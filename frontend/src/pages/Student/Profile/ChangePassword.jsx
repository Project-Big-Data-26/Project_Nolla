import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api/axios";
import Navbar from "../../../components/Navbar";
import { ArrowLeft, Check, Eye, EyeOff, Loader2, X } from "lucide-react";

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
            showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
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
  const [hasPassword, setHasPassword] = useState(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);

  useEffect(() => {
    API.get("/profile")
      .then(({ data }) => setHasPassword(Boolean(data.data.hasPassword)))
      .catch((error) => {
        setHasPassword(true);
        setMessage(
          error.response?.data?.message ||
            "Status kata sandi akun gagal diperiksa. Masukkan kata sandi saat ini.",
        );
        setMessageType("error");
      });
  }, []);

  const passwordRules = {
    minLength: newPassword.length >= 8,
    hasLowercase: /[a-z]/.test(newPassword),
    hasUppercase: /[A-Z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    ...(hasPassword === false
      ? {}
      : {
          differentFromCurrent:
            currentPassword.length > 0 && newPassword !== currentPassword,
        }),
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);
  const passwordRuleProgress =
    Object.values(passwordRules).filter(Boolean).length;

  const isConfirmationValid =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    if (hasPassword === null) {
      setMessage(
        "Status kata sandi akun sedang diperiksa. Coba lagi sebentar.",
      );
      setMessageType("error");
      return;
    }

    if (!isPasswordValid) {
      setMessage("Kata sandi baru belum memenuhi ketentuan.");
      setMessageType("error");
      return;
    }

    if (!isConfirmationValid) {
      setMessage("Konfirmasi kata sandi tidak sesuai.");
      setMessageType("error");
      return;
    }

    setSaving(true);
    try {
      const { data } = await API.patch("/auth/password", {
        ...(hasPassword ? { currentPassword } : {}),
        newPassword,
        confirmPassword,
      });
      sessionStorage.setItem(
        "profileRedirectToastMessage",
        data.message || "Kata sandi berhasil diubah.",
      );
      navigate("/profile");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Kata sandi gagal diperbarui. Silakan coba lagi.",
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage("");
    setMessageType("");
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
                    Ganti Kata Sandi
                  </h1>
                  <p className="mt-0.5 text-xs text-neutral-muted">
                    Perbarui kata sandi akunmu untuk menjaga keamanan akun.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 p-6 md:p-8">
                {hasPassword !== false && (
                  <PasswordInput
                    label="Kata Sandi Saat Ini"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    showPassword={showCurrentPassword}
                    setShowPassword={setShowCurrentPassword}
                    placeholder="Masukkan kata sandi saat ini"
                  />
                )}

                <div>
                  <PasswordInput
                    label="Kata Sandi Baru"
                    value={newPassword}
                    onChange={(value) => {
                      setNewPassword(value);
                      if (value.length > 0) setShowPasswordRequirements(true);
                    }}
                    showPassword={showNewPassword}
                    setShowPassword={setShowNewPassword}
                    placeholder="Masukkan kata sandi baru"
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
                          ? "Kata sandi baru sudah memenuhi syarat."
                          : "Kata sandi belum kuat. Harus memenuhi:"}
                      </p>

                      <div
                        className={`grid gap-1 ${hasPassword === false ? "grid-cols-4" : "grid-cols-5"}`}
                        aria-label={`${passwordRuleProgress} dari ${Object.keys(passwordRules).length} syarat terpenuhi`}
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

                      <RuleItem valid={passwordRules.hasLowercase}>
                        Mengandung huruf kecil
                      </RuleItem>

                      <RuleItem valid={passwordRules.hasUppercase}>
                        Mengandung huruf besar
                      </RuleItem>

                      <RuleItem valid={passwordRules.hasNumber}>
                        Mengandung angka
                      </RuleItem>

                      {hasPassword !== false && (
                        <RuleItem valid={passwordRules.differentFromCurrent}>
                          Tidak sama dengan kata sandi saat ini
                        </RuleItem>
                      )}
                    </div>
                  )}
                </div>

                <PasswordInput
                  label="Konfirmasi Kata Sandi Baru"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  showPassword={showConfirmPassword}
                  setShowPassword={setShowConfirmPassword}
                  placeholder="Masukkan kembali kata sandi baru"
                />

                {confirmPassword.length > 0 && (
                  <p
                    className={`-mt-3 text-xs ${
                      isConfirmationValid ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {isConfirmationValid
                      ? "Konfirmasi kata sandi sesuai."
                      : "Konfirmasi kata sandi tidak sesuai."}
                  </p>
                )}

                {message && (
                  <div
                    className={`rounded-xl px-4 py-3 text-sm ${
                      messageType === "success"
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
                  disabled={saving || hasPassword === null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto cursor-pointer"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {hasPassword === null
                    ? "Memeriksa akun..."
                    : saving
                      ? "Menyimpan..."
                      : "Simpan kata sandi"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
