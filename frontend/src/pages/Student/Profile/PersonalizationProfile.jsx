import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
import API from "../../../api/axios";
import { fetchEntitlement, formatTimeLeft } from "../../../api/subscription";
import { useAuth } from "../../../context/AuthContext";
import Navbar from "../../../components/Navbar";
import SectionCard from "../../../components/SectionCard";
import LogoutConfirmModal from "../../../components/LogoutConfirmModal";
import {
  Target,
  TrendingUp,
  Flame,
  Trophy,
  Award,
  ChevronRight,
  BookOpen,
  User as UserIcon,
  Mail,
  GraduationCap,
  KeyRound,
  LogOut,
  Loader2,
  Pencil,
  RefreshCw,
  Crown,
  BadgeCheck,
} from "lucide-react";
import defaultAvatar from "../../../assets/avatar/avatar-deafult.webp";
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

const stats = [
  {
    label: "Akurasi keseluruhan",
    value: "0%",
    icon: TrendingUp,
    tint: "text-success bg-success/10",
  },
  {
    label: "Soal terselesaikan",
    value: "0",
    icon: Target,
    tint: "text-primary bg-primary/10",
  },
  {
    label: "Rentetan belajar",
    value: "0 hari",
    icon: Flame,
    tint: "text-secondary bg-secondary/10",
  },
  {
    label: "Poin diperoleh",
    value: "0",
    icon: Trophy,
    tint: "text-secondary-hover bg-secondary/10",
  },
];

const recommendations = [
  {
    title: "Pecahan & Persentase",
    category: "Aritmatika · Pemula",
    progress: 0,
  },
  { title: "Operasi Bilangan", category: "Aritmatika · Pemula", progress: 0 },
  { title: "Aljabar Dasar", category: "Aljabar · Pemula", progress: 0 },
];

const badges = [
  { title: "Pemecah Masalah", description: "Menyelesaikan 10 soal" },
];

const packageLabels = {
  weekly: "Premium Mingguan",
  monthly: "Premium Bulanan",
  yearly: "Premium Tahunan",
};

const formatSubscriptionDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function PersonalizationProfile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profileReloadKey, setProfileReloadKey] = useState(0);
  const [subscription, setSubscription] = useState(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState("");
  const [subscriptionReloadKey, setSubscriptionReloadKey] = useState(0);
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
    let isActive = true;
    const loadSubscription = async () => {
      setIsSubscriptionLoading(true);
      setSubscriptionError("");
      try {
        const entitlement = await fetchEntitlement();
        if (isActive) setSubscription(entitlement);
      } catch (error) {
        if (isActive) {
          setSubscriptionError(
            error.response?.data?.message || "Status paket gagal dimuat.",
          );
        }
      } finally {
        if (isActive) setIsSubscriptionLoading(false);
      }
    };
    loadSubscription();
    return () => {
      isActive = false;
    };
  }, [subscriptionReloadKey]);

  useEffect(() => {
    const toastMessage = sessionStorage.getItem("profileRedirectToastMessage");
    if (!toastMessage) return;

    sessionStorage.removeItem("profileRedirectToastMessage");
    toast.success(toastMessage);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) await API.post("/auth/logout", { refreshToken });
    } catch (error) {
      console.error("Gagal menghubungi server saat logout:", error);
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  };

  const userName = profile?.name || "";
  const userEmail = profile?.email || "";
  const userEducationLevel = profile
    ? profile.allJenjang
      ? "Semua"
      : profile.jenjang_id?.name || ""
    : "";
  const userPhoto = profile
    ? avatarSources[profile.avatar] ||
      (profile.avatar && !/^avatar_\d+$/.test(profile.avatar)
        ? profile.avatar
        : defaultAvatar)
    : defaultAvatar;
  const hasPremiumAccess = subscription?.plan === "premium";
  const isTrialSubscription = hasPremiumAccess && subscription?.is_trial;
  const subscriptionTitle = subscription?.feature_enabled === false
    ? "Akses Premium terbuka"
    : isTrialSubscription
      ? "Trial Premium"
      : hasPremiumAccess
        ? packageLabels[subscription?.package] || "Premium"
        : "Paket Free";
  const quizLimitLabel = subscription?.limits?.quiz_sessions_per_subbab == null
    ? "Tanpa batas"
    : `${subscription.limits.quiz_sessions_per_subbab} sesi per subbab`;

  return (
    <div className="flex min-h-screen bg-neutral-bg font-sans text-neutral-text">
      <Toaster position="top-center" richColors closeButton />
      {/* Sidebar Navigation */}
      <Navbar activePage="Profil" />

      {/* Main Content Column: TopHeader edge-to-edge konsisten dengan halaman Topik & Setting */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Area Konten: padding dan batas lebar sejajar persis dengan halaman Topik */}
        <main className="mt-4 flex-1 max-w-6xl px-4 sm:mt-10 sm:px-8 lg:px-10 mx-auto w-full pb-24 md:pb-8">
          {/* CARD 1: PERSONAL INFO (Foto Profil menyatu rapi di dalam card, tanpa header biru yang bentrok) */}
          <SectionCard data-tour="profile-information" padding="p-3.5 sm:p-8" className="mb-3 sm:mb-5">
            {/* Bagian Atas Card: Foto Profil, Label Info & Tombol Edit */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 sm:gap-5 pb-4 sm:pb-6 border-b border-neutral-border">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                {/* Foto Profil: jika ada tampilkan gambar, jika belum ada gunakan default avatar */}
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-300 shadow-2xs flex items-center justify-center shrink-0">
                  <img
                    src={userPhoto || defaultAvatar}
                    alt="Foto Profil"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-sm font-semibold sm:text-lg sm:font-bold font-heading text-neutral-text">
                      Personal Info
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-muted mt-1">
                    Informasi identitas akun dan preferensi belajar Anda
                  </p>
                </div>
              </div>

              {/* Tombol Edit Profil */}
              <Link
                to="/profile/edit"
                className="inline-flex min-h-9 items-center gap-2 rounded-2xl bg-primary px-3 py-2 text-[11px] font-semibold text-white shadow-xs transition hover:bg-primary-hover cursor-pointer shrink-0 sm:min-h-10 sm:rounded-xl sm:px-4.5 sm:py-2.5 sm:text-sm"
                id="btn-edit-profile"
                data-tour="profile-edit"
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
                    <div className="min-w-0">
                      <p className="text-xs sm:text-[11px] font-medium text-slate-500">
                        Nama Lengkap
                      </p>
                      <p className="break-words text-[13px] sm:text-sm font-semibold text-neutral-text">
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
                    <div className="min-w-0">
                      <p className="text-xs sm:text-[11px] font-medium text-slate-500">
                        Alamat Email
                      </p>
                      <p className="break-all text-[13px] sm:text-sm font-semibold text-neutral-text">
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
                    <div className="min-w-0">
                      <p className="text-xs sm:text-[11px] font-medium text-slate-500">
                        Jenjang Belajar
                      </p>
                      <p className="break-words text-[13px] sm:text-sm font-semibold text-neutral-text">
                        {userEducationLevel
                          ? `${userEducationLevel}`
                          : "Belum Dipilih"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard data-tour="profile-package" as="section" aria-labelledby="account-package-title" padding="p-3.5 sm:p-8" className="mb-3 sm:mb-5">
            <div className="flex flex-col gap-4 border-b border-neutral-border pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${hasPremiumAccess ? "bg-blue-50 text-primary" : "bg-slate-100 text-slate-600"}`}>
                  <Crown aria-hidden="true" className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="account-package-title" className="text-sm font-bold text-neutral-text sm:text-base">Paket Akun</h2>
                  <p className="mt-0.5 text-xs text-neutral-muted">Status paket yang terhubung ke akun ini</p>
                </div>
              </div>
              {!isSubscriptionLoading && !subscriptionError && subscription?.feature_enabled !== false && (
                <Link data-tour="profile-package-action" to="/paket" className="inline-flex min-h-9 items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-hover sm:min-h-10 sm:text-sm">
                  {hasPremiumAccess ? "Lihat paket" : "Pilih paket Premium"}
                </Link>
              )}
            </div>

            {isSubscriptionLoading ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm text-neutral-muted" role="status">
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                Memuat status paket...
              </div>
            ) : subscriptionError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                <p>{subscriptionError}</p>
                <button type="button" onClick={() => setSubscriptionReloadKey((key) => key + 1)} className="mt-2 inline-flex items-center gap-1.5 font-semibold hover:underline">
                  <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                  Muat ulang status paket
                </button>
              </div>
            ) : subscription ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.6fr)]">
                <div className={`rounded-xl border p-4 ${hasPremiumAccess ? "border-blue-200 bg-blue-50/60" : "border-slate-200 bg-slate-50/70"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-neutral-text sm:text-base">{subscriptionTitle}</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${hasPremiumAccess ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                      {hasPremiumAccess && <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />}
                      Aktif
                    </span>
                  </div>
                  {subscription.feature_enabled === false ? (
                    <p className="mt-2 text-xs leading-relaxed text-neutral-muted">Fitur paket sedang dinonaktifkan; akses bab dan kuis terbuka untuk semua akun.</p>
                  ) : isTrialSubscription ? (
                    <p className="mt-2 text-xs leading-relaxed text-neutral-muted">Trial berakhir pada {formatSubscriptionDate(subscription.trial?.ends_at)}.</p>
                  ) : hasPremiumAccess ? (
                    <p className="mt-2 text-xs leading-relaxed text-neutral-muted">Paket aktif sampai {formatSubscriptionDate(subscription.active_until)}.</p>
                  ) : (
                    <p className="mt-2 text-xs leading-relaxed text-neutral-muted">Akun Free dapat mengerjakan kuis hingga {quizLimitLabel}.</p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium text-neutral-muted">Kuota kuis per subbab</p>
                  <p className="mt-1 text-sm font-bold text-neutral-text">{quizLimitLabel}</p>
                  {hasPremiumAccess && subscription.active_until && (
                    <p className="mt-1 text-xs text-neutral-muted">Sisa {formatTimeLeft(subscription.active_until) || "masa aktif berakhir"}</p>
                  )}
                </div>
              </div>
            ) : null}
          </SectionCard>

          {/* CARD 2: SETTING (Tombol Ganti Password) */}
          <SectionCard data-tour="profile-settings" padding="p-3.5 sm:p-8" className="mb-3 sm:mb-5">
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
                data-tour="profile-change-password"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 border border-amber-200 text-amber-600">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-text group-hover:text-primary transition-colors">
                      Ganti Kata Sandi
                    </p>
                    <p className="text-xs text-neutral-muted">
                      Perbarui kata sandi akun untuk keamanan
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </SectionCard>

          <SectionCard data-tour="profile-account" padding="p-3.5 sm:p-8" className="mb-3 sm:mb-5">
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
                className="flex w-full items-center justify-between rounded-lg border border-slate-100 bg-white p-3 text-left shadow-2xs transition group cursor-pointer hover:border-amber-200 disabled:cursor-wait disabled:opacity-60"
                id="btn-profile-logout"
                data-tour="profile-logout"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600">
                    {isLoggingOut ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-text transition-colors group-hover:text-amber-600">
                      {isLoggingOut ? "Keluar..." : "Keluar"}
                    </p>
                    <p className="text-xs text-neutral-muted">
                      Keluar dari akun ini
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-amber-600" />
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
