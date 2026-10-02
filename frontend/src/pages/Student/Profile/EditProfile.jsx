import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  X,
  Mail,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  Check,
  ChevronDown,
} from "lucide-react";
import Navbar from "../../../components/Navbar";

// Aset Avatar Preset & Default
import defaultAvatar from "../../../assets/avatar/avatar-deafult.png";
import avatar1 from "../../../assets/avatar/avatar1.svg";
import avatar2 from "../../../assets/avatar/avatar2.svg";
import avatar3 from "../../../assets/avatar/avatar3.svg";
import avatar4 from "../../../assets/avatar/avatar4.svg";
import avatar5 from "../../../assets/avatar/avatar5.svg";
import avatar6 from "../../../assets/avatar/avatar6.svg";
import avatar7 from "../../../assets/avatar/avatar7.svg";
import avatar8 from "../../../assets/avatar/avatar8.svg";

const presetAvatars = [
  { id: "default", label: "Default", src: defaultAvatar },
  { id: "avatar1", label: "Avatar 1", src: avatar1 },
  { id: "avatar2", label: "Avatar 2", src: avatar2 },
  { id: "avatar3", label: "Avatar 3", src: avatar3 },
  { id: "avatar4", label: "Avatar 4", src: avatar4 },
  { id: "avatar5", label: "Avatar 5", src: avatar5 },
  { id: "avatar6", label: "Avatar 6", src: avatar6 },
  { id: "avatar7", label: "Avatar 7", src: avatar7 },
  { id: "avatar8", label: "Avatar 8", src: avatar8 },
];

const jenjangOptions = [
  { value: "Semua", label: "Semua" },
  { value: "SD", label: "SD" },
  { value: "SMP", label: "SMP" },
  { value: "SMA", label: "SMA" },
];

const getPopoverPosition = (anchor, preferredWidth, preferredHeight) => {
  if (!anchor || typeof window === "undefined") return null;

  const rect = anchor.getBoundingClientRect();
  const width = Math.min(preferredWidth, Math.max(0, window.innerWidth - 16));
  const maxHeight = Math.min(
    preferredHeight,
    Math.max(0, window.innerHeight - 16),
  );
  const left = Math.min(
    Math.max(rect.right - width, 8),
    window.innerWidth - width - 8,
  );
  let top = rect.bottom + 8;

  if (top + maxHeight > window.innerHeight - 8) {
    top = rect.top - maxHeight - 8;
  }

  top = Math.min(Math.max(top, 8), window.innerHeight - maxHeight - 8);
  return { left, top, width, maxHeight };
};

export default function EditProfile() {
  const navigate = useNavigate();
  const jenjangDropdownRef = useRef(null);
  const jenjangPopoverRef = useRef(null);
  const avatarPickerRef = useRef(null);
  const avatarPopoverRef = useRef(null);

  const savedPhoto =
    (typeof window !== "undefined" && localStorage.getItem("user_photo")) ||
    null;

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
      "Semua",
    photo: savedPhoto || defaultAvatar,
  });

  const [name, setName] = useState(initialDataRef.current.name);
  const [email] = useState(initialDataRef.current.email); // Read-only / view only
  const [jenjang, setJenjang] = useState(initialDataRef.current.jenjang);
  const [photoPreview, setPhotoPreview] = useState(
    initialDataRef.current.photo,
  );
  const [avatarDraft, setAvatarDraft] = useState(initialDataRef.current.photo);
  const [lastUpdated, setLastUpdated] = useState(() => {
    return (
      (typeof window !== "undefined" &&
        localStorage.getItem("user_profile_updated_at")) ||
      "27 Sep 2026"
    );
  });

  // State dropdown jenjang dan preview foto penuh
  const [isJenjangOpen, setIsJenjangOpen] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [jenjangPopoverPosition, setJenjangPopoverPosition] = useState(null);
  const [avatarPopoverPosition, setAvatarPopoverPosition] = useState(null);
  const [showFullPhotoModal, setShowFullPhotoModal] = useState(false);

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Deteksi perubahan data (email tidak bisa diedit)
  const isNameChanged = name.trim() !== initialDataRef.current.name.trim();
  const isJenjangChanged = jenjang !== initialDataRef.current.jenjang;
  const isPhotoChanged = photoPreview !== initialDataRef.current.photo;

  // Tombol Simpan Perubahan hanya akan muncul jika ada perubahan pada salah satu field/foto
  const hasChanges = isNameChanged || isJenjangChanged || isPhotoChanged;

  useEffect(() => {
    const closeJenjangDropdown = (event) => {
      if (
        jenjangDropdownRef.current &&
        !jenjangDropdownRef.current.contains(event.target) &&
        !jenjangPopoverRef.current?.contains(event.target)
      ) {
        setIsJenjangOpen(false);
      }
      if (
        avatarPickerRef.current &&
        !avatarPickerRef.current.contains(event.target) &&
        !avatarPopoverRef.current?.contains(event.target)
      ) {
        setIsAvatarPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", closeJenjangDropdown);
    return () =>
      document.removeEventListener("mousedown", closeJenjangDropdown);
  }, []);

  useEffect(() => {
    if (!isJenjangOpen) return undefined;
    const updatePosition = () => {
      setJenjangPopoverPosition(
        getPopoverPosition(jenjangDropdownRef.current, 256, 230),
      );
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isJenjangOpen]);

  useEffect(() => {
    if (!isAvatarPickerOpen) return undefined;
    const updatePosition = () => {
      const width =
        avatarPickerRef.current?.getBoundingClientRect().width || 320;
      setAvatarPopoverPosition(
        getPopoverPosition(avatarPickerRef.current, width, 340),
      );
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isAvatarPickerOpen]);

  // Validasi form sebelum submit
  const validate = () => {
    const nextErrors = {};
    if (!name || !name.trim()) {
      nextErrors.name = "Nama tidak boleh kosong.";
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
      localStorage.setItem("user_education_level", jenjang);
      localStorage.setItem("user_jenjang", jenjang);
      localStorage.setItem("user_profile_updated_at", currentDate);

      if (photoPreview) {
        localStorage.setItem("user_photo", photoPreview);
      } else {
        localStorage.setItem("user_photo", defaultAvatar);
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
        <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 w-full flex-1 pb-24 md:pb-8">
          {/* Notifikasi Sukses */}
          {saveSuccess && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-2xs">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span className="font-medium">
                Profil berhasil diperbarui! Mengalihkan ke halaman profil...
              </span>
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
                    Informasi Pengguna · Perbarui data pribadi dan foto profil
                    akun Anda
                  </p>
                </div>
              </div>
            </div>

            {/* Form Konten */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
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

                  {/* Input Email (View Only dengan kursor 🚫 not-allowed) */}
                  <div>
                    <label
                      htmlFor="email-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                      Email
                    </label>
                    <div
                      className="relative flex items-center cursor-not-allowed"
                      title="Email akun bersifat permanen dan tidak dapat diubah"
                    >
                      <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        id="email-input"
                        type="text"
                        value={email}
                        readOnly
                        tabIndex={-1}
                        title="Email akun bersifat permanen dan tidak dapat diubah"
                        className="w-full rounded-xl border border-slate-200 bg-slate-100/80 pl-10 pr-4 py-2.5 text-sm text-slate-500 font-medium cursor-not-allowed select-none outline-none focus:outline-none focus:ring-0 focus:border-slate-200 shadow-inner/10"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1">
                      Email akun bersifat permanen untuk keamanan data
                      autentikasi.
                    </p>
                  </div>

                  {/* Input Jenjang Belajar */}
                  <div>
                    <label
                      htmlFor="jenjang-select"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                      Jenjang Belajar
                    </label>
                    <div className="relative" ref={jenjangDropdownRef}>
                      <button
                        id="jenjang-select"
                        type="button"
                        onClick={() =>
                          setIsJenjangOpen((previous) => !previous)
                        }
                        aria-expanded={isJenjangOpen}
                        className={`w-full rounded-2xl border px-4 sm:px-5 py-3 flex items-center justify-between gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs select-none ${
                          isJenjangOpen || jenjang !== "Semua"
                            ? "border-primary text-primary bg-blue-50/40 ring-1 ring-primary/20"
                            : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <span>{jenjang}</span>
                        <ChevronDown
                          className={`h-4 w-4 text-slate-500 transition-transform ${isJenjangOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isJenjangOpen &&
                        jenjangPopoverPosition &&
                        createPortal(
                          <div
                            ref={jenjangPopoverRef}
                            style={{
                              position: "fixed",
                              left: jenjangPopoverPosition.left,
                              top: jenjangPopoverPosition.top,
                              width: jenjangPopoverPosition.width,
                              maxHeight: jenjangPopoverPosition.maxHeight,
                              zIndex: 1000,
                            }}
                            className="overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl animate-in fade-in zoom-in-95"
                          >
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 mb-1">
                              Pilih Jenjang Belajar
                            </div>
                            <div className="space-y-1">
                              {jenjangOptions.map((option) => {
                                const isSelected = jenjang === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                      setJenjang(option.value);
                                      setIsJenjangOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                                      isSelected
                                        ? "bg-primary text-white font-semibold shadow-2xs"
                                        : "text-slate-700 hover:bg-slate-100"
                                    }`}
                                  >
                                    <span>{option.label}</span>
                                    {isSelected && (
                                      <Check className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>,
                          document.body,
                        )}
                    </div>
                    <p className="mt-1.5 text-[11px] text-neutral-muted">
                      Pilih jenjang belajar Anda saat ini atau pilih 'Semua'.
                    </p>
                  </div>
                </div>

                {/* Kolom Kanan: Pratinjau & Pilihan Avatar */}
                <div className="md:col-span-5 flex flex-col items-center border-t md:border-t-0 md:border-l md:border-dashed border-neutral-border pt-6 md:pt-0 md:pl-8">
                  <div
                    className="relative mb-4 flex w-full flex-col items-center"
                    ref={avatarPickerRef}
                  >
                    <div
                      onClick={() => {
                        setIsAvatarPickerOpen(false);
                        setShowFullPhotoModal(true);
                      }}
                      className="group relative h-28 w-28 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm cursor-pointer bg-slate-100 flex items-center justify-center transition-all hover:ring-4 hover:ring-primary/15"
                      title="Lihat foto profil penuh"
                      id="avatar-container"
                    >
                      <img
                        src={
                          (isAvatarPickerOpen ? avatarDraft : photoPreview) ||
                          defaultAvatar
                        }
                        alt="Pratinjau Foto Profil"
                        className="h-full w-full object-cover"
                      />

                      {/* Hover Overlay: Opsi Lihat Foto Penuh */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFullPhotoModal(true);
                        }}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white"
                        title="Klik untuk memperbesar foto"
                      >
                        <Eye className="h-6 w-6 text-white drop-shadow" />
                        <span className="text-[10px] font-semibold mt-1">
                          Lihat Penuh
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAvatarDraft(photoPreview);
                        setIsAvatarPickerOpen((previous) => !previous);
                      }}
                      aria-expanded={isAvatarPickerOpen}
                      className="mt-3 rounded-xl border border-primary/30 bg-white px-4 py-2 text-xs font-semibold text-primary shadow-2xs transition hover:bg-primary/5 cursor-pointer"
                    >
                      Ganti Avatar
                    </button>

                    {isAvatarPickerOpen &&
                      avatarPopoverPosition &&
                      createPortal(
                        <div
                          ref={avatarPopoverRef}
                          style={{
                            position: "fixed",
                            left: avatarPopoverPosition.left,
                            top: avatarPopoverPosition.top,
                            width: avatarPopoverPosition.width,
                            maxHeight: avatarPopoverPosition.maxHeight,
                            zIndex: 1000,
                          }}
                          className="overflow-y-auto rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xl"
                        >
                          <div className="mb-2.5 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700">
                              Pilih Avatar Karakter
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {presetAvatars.length} Pilihan
                            </span>
                          </div>

                          <div className="grid max-h-52 grid-cols-4 gap-2.5 overflow-y-auto p-1 scrollbar-thin sm:grid-cols-5 md:grid-cols-4">
                            {presetAvatars.map((item) => {
                              const isSelected = avatarDraft === item.src;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setAvatarDraft(item.src)}
                                  className={`relative mx-auto h-11 w-11 overflow-hidden rounded-full border-2 transition-all cursor-pointer group ${
                                    isSelected
                                      ? "border-primary ring-2 ring-primary/30 scale-105 shadow-xs"
                                      : "border-slate-200 hover:border-primary/50 hover:scale-105 opacity-85 hover:opacity-100 bg-white"
                                  }`}
                                  title={`Pilih ${item.label}`}
                                >
                                  <img
                                    src={item.src}
                                    alt={item.label}
                                    className="h-full w-full object-cover"
                                  />
                                  {isSelected && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-primary/30">
                                      <Check className="h-4 w-4 text-white drop-shadow stroke-[3]" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            disabled={
                              !presetAvatars.some(
                                (item) => item.src === avatarDraft,
                              )
                            }
                            onClick={() => {
                              setPhotoPreview(avatarDraft);
                              setIsAvatarPickerOpen(false);
                            }}
                            className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Pilih Avatar
                          </button>
                        </div>,
                        document.body,
                      )}
                  </div>

                  {isPhotoChanged && (
                    <span className="mb-3 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 animate-in fade-in">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      Foto baru (belum tersimpan)
                    </span>
                  )}

                  {/* Info User di Bawah Avatar */}
                  <div className="text-center w-full px-2">
                    <h3 className="font-heading text-base font-bold text-neutral-text truncate">
                      {name.trim() || "Nama Pengguna"}
                    </h3>
                    <p className="text-xs text-neutral-muted mt-0.5 truncate">
                      {getJenjangLabel(jenjang)}
                    </p>
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
