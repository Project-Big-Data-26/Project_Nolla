import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import API from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";
import Navbar from "../../../components/Navbar";
import SectionCard from "../../../components/SectionCard";
import LogoutConfirmModal from "../../../components/LogoutConfirmModal";
import {
  ChevronRight,
  User as UserIcon,
  Mail,
  GraduationCap,
  KeyRound,
  LogOut,
  Loader2,
  Pencil,
  RefreshCw,
} from "lucide-react";
import defaultAvatar from "../../../assets/avatar/avatar-deafult.png";
import avatar1 from "../../../assets/avatar/avatar1.svg";
import avatar2 from "../../../assets/avatar/avatar2.svg";
import avatar3 from "../../../assets/avatar/avatar3.svg";
import avatar4 from "../../../assets/avatar/avatar4.svg";
import avatar5 from "../../../assets/avatar/avatar5.svg";
import avatar6 from "../../../assets/avatar/avatar6.svg";
import avatar7 from "../../../assets/avatar/avatar7.svg";
import avatar8 from "../../../assets/avatar/avatar8.svg";

const avatarSources = {
  avatar_1: avatar1,
  avatar_2: avatar2,
  avatar_3: avatar3,
  avatar_4: avatar4,
  avatar_5: avatar5,
  avatar_6: avatar6,
  avatar_7: avatar7,
  avatar_8: avatar8,
};

export default function PersonalizationProfile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profileReloadKey, setProfileReloadKey] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      setIsProfileLoading(true);
      setProfileError("");

      try {
        const { data } = await API.get("/profile");
        if (!isActive) return;

        if (!data?.data) {
          throw new Error("Respons profil dari server tidak valid.");
        }
        setProfile(data.data);
      } catch (error) {
        if (!isActive) return;
        setProfileError(
          error.response?.data?.message ||
            error.message ||
            "Profil gagal dimuat dari server.",
        );
      } finally {
        if (isActive) setIsProfileLoading(false);
      }
    };

    loadProfile();
    return () => {
      isActive = false;
    };
  }, [profileReloadKey]);

  useEffect(() => {
    const toastMessage = sessionStorage.getItem("profileRedirectToastMessage");
    if (!toastMessage) return;

    sessionStorage.removeItem("profileRedirectToastMessage");
    toast.success(toastMessage);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    let isLogoutSuccessful = false;
    let notification = {
      type: "error",
      message: "Access token tidak ditemukan",
    };

    try {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      if (accessToken && refreshToken) {
        const response = await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
        const result = await response.json();
        isLogoutSuccessful = response.ok;
        notification = {
          type: isLogoutSuccessful ? "success" : "error",
          message: result.message || "Gagal memproses logout.",
        };
      } else if (!refreshToken) {
        notification.message = "Refresh token tidak ditemukan";
      }
    } catch (error) {
      console.error("Gagal koneksi saat logout:", error);
      notification.message = "Gagal terhubung ke server saat logout.";
    } finally {
      toast.dismiss();
      toast[notification.type](notification.message);
      setIsLoggingOut(false);
    }

    if (isLogoutSuccessful) {
      logout();
      navigate("/login", { replace: true });
    }
  };

  const userName = profile?.name || "";
  const userEmail = profile?.email || "";
  const userEducationLevel = profile
    ? profile.allJenjang
      ? "Semua"
      : profile.jenjang_id?.name || "Belum Dipilih"
    : "";
  const userPhoto = profile
    ? avatarSources[profile.avatar] || defaultAvatar
    : defaultAvatar;

  return (
    <div className="flex min-h-screen bg-neutral-bg font-sans text-neutral-text">
      {/* Sidebar Navigation */}
      <Navbar activePage="Profil" />

      {/* Main Content Column: TopHeader edge-to-edge konsisten dengan halaman Topik & Setting */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Area Konten: padding dan batas lebar sejajar persis dengan halaman Topik */}
        <main className="mt-10 flex-1 max-w-6xl px-5 sm:px-8 lg:px-10 mx-auto w-full pb-24 md:pb-8">
          {/* CARD 1: PERSONAL INFO (Foto Profil menyatu rapi di dalam card, tanpa header biru yang bentrok) */}
          <SectionCard className="mb-5 p-6 sm:p-8">
            {/* Bagian Atas Card: Foto Profil, Label Info & Tombol Edit */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 pb-6 border-b border-neutral-border">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                {/* Foto Profil: jika ada tampilkan gambar, jika belum ada gunakan default avatar */}
                <div className="relative h-20 w-20 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-300 shadow-2xs flex items-center justify-center shrink-0">
                  {isProfileLoading ? (
                    <Loader2
                      className="h-6 w-6 animate-spin text-primary"
                      aria-label="Memuat profil"
                    />
                  ) : (
                    <img
                      src={userPhoto}
                      alt="Foto Profil"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-base sm:text-lg font-bold font-heading text-neutral-text">
                      Personal Info
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-muted mt-1">
                    Informasi identitas akun dan preferensi belajar Anda
                  </p>
                </div>
              </div>

              {/* Tombol Edit Profil */}
              <Link
                to="/profile/edit"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4.5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-primary-hover cursor-pointer shrink-0"
                id="btn-edit-profile"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit Profil</span>
              </Link>
            </div>

            {/* List Data Personal Info (Read-Only) */}
            {profileError ? (
              <div
                className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                role="alert"
              >
                <p>{profileError}</p>
                <button
                  type="button"
                  onClick={() => setProfileReloadKey((key) => key + 1)}
                  className="mt-3 inline-flex items-center gap-2 font-semibold hover:underline"
                >
                  <RefreshCw className="h-4 w-4" />
                  Coba lagi
                </button>
              </div>
            ) : isProfileLoading ? (
              <div
                className="mt-5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-neutral-muted"
                role="status"
              >
                Memuat profil dari server...
              </div>
            ) : (
              <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50">
                {/* Nama Lengkap */}
                <div className="flex items-center justify-between p-3.5 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">
                        Nama Lengkap
                      </p>
                      <p className="text-sm font-semibold text-neutral-text">
                        {userName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center justify-between p-3.5 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">
                        Alamat Email
                      </p>
                      <p className="text-sm font-semibold text-neutral-text">
                        {userEmail}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Jenjang Belajar */}
                <div className="flex items-center justify-between p-3.5 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">
                        Jenjang Belajar
                      </p>
                      <p className="text-sm font-semibold text-neutral-text">
                        {userEducationLevel}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* CARD 2: SETTING (Tombol Ganti Password) */}
          <SectionCard className="mb-5 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Setting
              </span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-2">
              <Link
                to="/profile/ganti-password"
                className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-100 hover:border-primary/40 transition group cursor-pointer shadow-2xs"
                id="btn-change-password"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 border border-amber-200 text-amber-600">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-text group-hover:text-primary transition-colors">
                      Ganti Kata Sandi
                    </p>
                    <p className="text-[11px] text-neutral-muted">
                      Perbarui kata sandi akun untuk keamanan
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </SectionCard>

          <SectionCard className="mb-5 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Akun
              </span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-2">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(true)}
                disabled={isLoggingOut}
                className="flex w-full items-center justify-between rounded-lg border border-slate-100 bg-white p-3 text-left shadow-2xs transition group cursor-pointer hover:border-red-200 disabled:cursor-wait disabled:opacity-60"
                id="btn-profile-logout"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600">
                    {isLoggingOut ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-text transition-colors group-hover:text-red-600">
                      {isLoggingOut ? "Keluar..." : "Keluar"}
                    </p>
                    <p className="text-[11px] text-neutral-muted">
                      Keluar dari akun ini
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-red-600" />
              </button>
            </div>
          </SectionCard>

          {/* <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map(({ label, value, icon: Icon, tint }) => (
              <SectionCard
                key={label}
                className="flex items-center gap-3.5 p-5"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tint}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold leading-tight text-neutral-text">
                    {value}
                  </p>
                  <p className="text-xs font-medium text-neutral-muted mt-0.5">
                    {label}
                  </p>
                </div>
              </SectionCard>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-base font-bold text-neutral-text">
                  Rekomendasi untukmu
                </h3>
                <span className="text-xs text-neutral-muted">
                  Materi belajar
                </span>
              </div>
              <div className="space-y-3">
                {recommendations.map(({ title, category }) => (
                  <div
                    key={title}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-primary">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-neutral-text">
                          {title}
                        </p>
                        <p className="text-[11px] text-neutral-muted">
                          {category}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-base font-bold text-neutral-text">
                  Lencana diperoleh
                </h3>
                <span className="text-xs text-neutral-muted">Pencapaian</span>
              </div>
              <div className="space-y-3">
                {badges.map(({ title, description }) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-text">
                        {title}
                      </p>
                      <p className="text-[11px] text-neutral-muted">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div> */}
        </main>
      </div>
      <LogoutConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        isLoading={isLoggingOut}
      />
    </div>
  );
}
