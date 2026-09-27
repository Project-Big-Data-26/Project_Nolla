import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Loader2,
  X,
  Mail,
  User as UserIcon,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Upload,
  Sparkles,
} from "lucide-react";
import Navbar from "../components/Navbar";

const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

const jenjangOptions = [
  { value: "", label: "Belum Dipilih" },
  { value: "Semua", label: "Semua" },
  { value: "SD", label: "SD" },
  { value: "SMP", label: "SMP" },
  { value: "SMA", label: "SMA" },
];

function isValidEmail(value) {
  if (!value) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value.trim());
}

export default function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Nilai awal dari localStorage untuk deteksi perubahan
  const initialDataRef = useRef({
    name:
      (typeof window !== "undefined" && localStorage.getItem("user_name")) ||
      "Pelajar Tamu",
    email:
      (typeof window !== "undefined" && localStorage.getItem("user_email")) ||
      "guest@mathmentor.app",
    jenjang:
      (typeof window !== "undefined" &&
        (localStorage.getItem("user_education_level") ||
          localStorage.getItem("user_jenjang"))) ||
      "",
    photo:
      (typeof window !== "undefined" && localStorage.getItem("user_photo")) ||
      null,
  });

  const [name, setName] = useState(initialDataRef.current.name);
  const [email, setEmail] = useState(initialDataRef.current.email);
  const [jenjang, setJenjang] = useState(initialDataRef.current.jenjang);
  const [photoPreview, setPhotoPreview] = useState(initialDataRef.current.photo);
  const [lastUpdated, setLastUpdated] = useState(() => {
    return (
      (typeof window !== "undefined" &&
        localStorage.getItem("user_profile_updated_at")) ||
      "27 Sep 2026"
    );
  });

  // State menu interaktif foto & preview modal full
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showFullPhotoModal, setShowFullPhotoModal] = useState(false);

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Deteksi perubahan data
  const isNameChanged = name.trim() !== initialDataRef.current.name.trim();
  const isEmailChanged = email.trim() !== initialDataRef.current.email.trim();
  const isJenjangChanged = jenjang !== initialDataRef.current.jenjang;
  const isPhotoChanged = photoPreview !== initialDataRef.current.photo;

  // Tombol Simpan Perubahan hanya akan muncul jika ada perubahan pada salah satu field/foto
  const hasChanges =
    isNameChanged || isEmailChanged || isJenjangChanged || isPhotoChanged;

  // Handle upload foto profil dengan pratinjau langsung sebelum disimpan
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        photo: "Format file harus JPG atau PNG.",
      }));
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setErrors((prev) => ({
        ...prev,
        photo: "Ukuran file maksimal 2MB.",
      }));
      return;
    }

    setErrors((prev) => ({ ...prev, photo: undefined }));

    // Pratinjau foto baru langsung ditampilkan pada form sebelum disimpan ke storage/database
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setPhotoPreview(uploadEvent.target.result);
      setShowPhotoMenu(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setErrors((prev) => ({ ...prev, photo: undefined }));
    setShowPhotoMenu(false);
  };

  // Validasi form sebelum submit
  const validate = () => {
    const nextErrors = {};
    if (!name || !name.trim()) {
      nextErrors.name = "Nama tidak boleh kosong.";
    }
    if (!email || !email.trim()) {
      nextErrors.email = "Email tidak boleh kosong.";
    } else if (!isValidEmail(email)) {
      nextErrors.email =
        "Format email tidak valid (harus mengandung '@' dan domain yang valid).";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Tombol kembali langsung mengarahkan ke halaman profil (membatalkan perubahan)
  const handleCancel = () => {
    navigate("/profile");
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaveError("");

    if (!validate()) return;

    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const currentDate = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      localStorage.setItem("user_name", name.trim());
      localStorage.setItem("user_email", email.trim());
      localStorage.setItem("user_education_level", jenjang);
      localStorage.setItem("user_jenjang", jenjang);
      localStorage.setItem("user_profile_updated_at", currentDate);

      if (photoPreview) {
        localStorage.setItem("user_photo", photoPreview);
      } else {
        localStorage.removeItem("user_photo");
      }

      setLastUpdated(currentDate);
      setSaveSuccess(true);

      setTimeout(() => {
        navigate("/profile", { state: { profileUpdated: true } });
      }, 700);
    } catch (err) {
      setSaveError("Gagal menyimpan perubahan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const getJenjangLabel = (val) => {
    if (!val) return "Belum pilih jenjang";
    if (val === "Semua") return "Semua Jenjang";
    return `Siswa ${val}`;
  };

  return (
    <div className="flex min-h-screen bg-neutral-bg font-sans text-neutral-text">
      {/* Sidebar Navigation */}
      <Navbar activePage="Profil" />

      {/* Main Content Column: Batasan persis sejajar dengan halaman Topik & Profil */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto w-full py-6 md:py-8 pb-24 md:pb-8">
          {/* Notifikasi Sukses */}
          {saveSuccess && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-2xs">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span className="font-medium">
                Profil berhasil diperbarui! Mengalihkan ke halaman profil...
              </span>
            </div>
          )}

          {/* Notifikasi Error Foto */}
          {errors.photo && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                <span className="font-medium">{errors.photo}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrors((prev) => ({ ...prev, photo: undefined }))}
                className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Notifikasi Error Global */}
          {saveError && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-2xs">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <span className="font-medium">{saveError}</span>
            </div>
          )}

          {/* CARD UTAMA: Panah Kembali + 'Edit Profil' masuk ke dalam card informasi pengguna */}
          <div className="rounded-2xl border border-neutral-border bg-neutral-card shadow-xs overflow-hidden">
            {/* Header di dalam Card: Tombol Panah Kembali + Edit Profil / Informasi Pengguna */}
            <div className="flex items-center justify-between border-b border-neutral-border px-6 py-5 bg-white">
              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer group"
                  title="Kembali ke Profil"
                  id="btn-back-to-profile"
                >
                  <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                </button>
                <div>
                  <h1 className="font-heading text-lg sm:text-xl font-bold text-neutral-text leading-tight">
                    Edit Profil
                  </h1>
                  <p className="text-xs text-neutral-muted mt-0.5">
                    Informasi Pengguna · Perbarui data pribadi dan foto profil akun Anda
                  </p>
                </div>
              </div>
            </div>

            {/* Form Konten */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* Kolom Kiri: Form Input Fields */}
                <div className="md:col-span-7 space-y-5">
                  {/* Input Nama Lengkap / Username */}
                  <div>
                    <label
                      htmlFor="full-name-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                      Nama Lengkap
                    </label>
                    <div className="relative flex items-center">
                      <UserIcon className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        id="full-name-input"
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (errors.name) {
                            setErrors((prev) => ({ ...prev, name: undefined }));
                          }
                        }}
                        placeholder="Contoh: MD Rafi Islam"
                        className={`w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-neutral-text transition-all outline-none focus:ring-2 focus:ring-primary/10 ${
                          errors.name
                            ? "border-danger focus:border-danger ring-danger/10"
                            : "border-neutral-border focus:border-primary"
                        }`}
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-danger">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Input Email */}
                  <div>
                    <label
                      htmlFor="email-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                      Email
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        id="email-input"
                        type="text"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) {
                            setErrors((prev) => ({
                              ...prev,
                              email: undefined,
                            }));
                          }
                        }}
                        placeholder="nama@email.com"
                        className={`w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-neutral-text transition-all outline-none focus:ring-2 focus:ring-primary/10 ${
                          errors.email
                            ? "border-danger focus:border-danger ring-danger/10"
                            : "border-neutral-border focus:border-primary"
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-danger">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Input Jenjang Belajar */}
                  <div>
                    <label
                      htmlFor="jenjang-select"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                      Jenjang Belajar
                    </label>
                    <div className="relative flex items-center">
                      <GraduationCap className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                      <select
                        id="jenjang-select"
                        value={jenjang}
                        onChange={(e) => setJenjang(e.target.value)}
                        className="w-full rounded-xl border border-neutral-border bg-white pl-10 pr-4 py-2.5 text-sm text-neutral-text transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer"
                      >
                        {jenjangOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-1.5 text-[11px] text-neutral-muted">
                      Khusus jenjang bersifat opsional dan dapat dikosongkan kapan saja.
                    </p>
                  </div>
                </div>

                {/* Kolom Kanan: Pratinjau Foto Profil Baru pada Form Sebelum Disimpan */}
                <div className="md:col-span-5 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l md:border-dashed border-neutral-border pt-6 md:pt-0 md:pl-8">
                  {/* Bulatan Foto Profil */}
                  <div className="relative mb-2 group">
                    <div
                      onClick={() => {
                        if (photoPreview) {
                          setShowPhotoMenu((prev) => !prev);
                        } else {
                          fileInputRef.current?.click();
                        }
                      }}
                      className="h-28 w-28 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm cursor-pointer relative bg-slate-100 flex items-center justify-center transition-all hover:ring-4 hover:ring-primary/15"
                      title={
                        photoPreview
                          ? "Klik untuk opsi foto (Lihat Full, Ganti, atau Hapus)"
                          : "Klik untuk memilih foto profil"
                      }
                      id="avatar-container"
                    >
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Pratinjau Foto Profil"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-slate-200 text-slate-500">
                          <UserIcon className="h-12 w-12 text-slate-400" />
                        </div>
                      )}

                      {/* Hover Overlay Desktop: Jika ada foto, muncul ikon hapus cepat */}
                      {photoPreview && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto();
                          }}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white"
                          title="Hapus foto ini"
                        >
                          <Trash2 className="h-6 w-6 text-red-300 hover:text-red-100 transition-colors" />
                          <span className="text-[10px] font-semibold mt-1">Hapus</span>
                        </div>
                      )}
                    </div>

                    {/* Tombol Edit Pensil di Pojok Kanan Bawah */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary-hover transition-colors cursor-pointer border-2 border-white"
                      title="Ganti foto profil"
                      id="btn-change-photo"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    {/* Menu Opsi Saat Foto Diklik */}
                    {showPhotoMenu && photoPreview && (
                      <div className="absolute z-20 top-full mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 text-xs text-slate-700 animate-in fade-in slide-in-from-top-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowFullPhotoModal(true);
                            setShowPhotoMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                          <span>Lihat Foto Penuh</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            fileInputRef.current?.click();
                            setShowPhotoMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer"
                        >
                          <Upload className="h-4 w-4 text-emerald-600" />
                          <span>Ganti Foto</span>
                        </button>
                        <div className="my-1 border-t border-slate-100"></div>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-red-50 text-danger font-medium transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                          <span>Hapus Foto</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Indikator Pratinjau Foto Baru (Belum Tersimpan) */}
                  {isPhotoChanged && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 mb-1 animate-in fade-in">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      Foto baru (belum tersimpan)
                    </span>
                  )}

                  {/* Info User di Bawah Avatar */}
                  <div className="mt-2 text-center w-full px-2">
                    <h3 className="font-heading text-base font-bold text-neutral-text truncate">
                      {name.trim() || "Nama Pengguna"}
                    </h3>
                    <p className="text-xs text-neutral-muted mt-0.5 truncate">
                      {getJenjangLabel(jenjang)}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600 max-w-full truncate">
                      <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {email.trim() || "nama@email.com"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Card: Tombol Batal Dihapus, Simpan Perubahan Hanya Muncul Jika Ada Perubahan */}
              <div className="border-t border-neutral-border bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-neutral-muted order-2 sm:order-1 text-center sm:text-left">
                  Terakhir diperbarui: {lastUpdated}
                </span>

                {/* HANYA MUNCUL KETIKA ADA PERUBAHAN */}
                <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2 justify-end">
                  {hasChanges ? (
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-primary-hover disabled:opacity-60 cursor-pointer animate-in fade-in"
                      id="btn-save-profile"
                    >
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                      <span>Simpan Perubahan</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Tidak ada perubahan data
                    </span>
                  )}
                </div>
              </div>

              {/* Hidden file input untuk ganti foto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-file-input"
              />
            </form>
          </div>
        </main>
      </div>

      {/* MODAL PREVIEW FULL FOTO PROFIL */}
      {showFullPhotoModal && photoPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          onClick={() => setShowFullPhotoModal(false)}
        >
          <div
            className="relative max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-heading text-sm font-bold text-neutral-text">
                Foto Profil
              </h4>
              <button
                type="button"
                onClick={() => setShowFullPhotoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 flex justify-center">
              <img
                src={photoPreview}
                alt="Foto Profil Lengkap"
                className="max-h-80 w-auto rounded-xl object-contain shadow-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFullPhotoModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}