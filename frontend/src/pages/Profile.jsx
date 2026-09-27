import React from "react";
import {
  ArrowLeft,
  User,
  Mail,
  GraduationCap,
  Lock,
  ChevronRight,
  Pencil,
} from "lucide-react";

const Profile = () => {
  const user = {
    username: "abah",
    email: "abah@gmail.com",
    jenjang: "SMA",
    foto: null,
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleEditProfile = () => {
    window.location.href = "/edit-profile";
  };

  const handleChangePassword = () => {
    window.location.href = "/change-password";
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">

      {/* ================= HEADER ================= */}
      <header className="rounded-b-[42px] bg-gradient-to-b from-[#1683E8] to-[#075DB9]">

        <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">

          {/* Tombol Kembali */}
          <div className="pt-5 sm:pt-6">
            <button
              onClick={handleBack}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10"
              aria-label="Kembali"
            >
              <ArrowLeft size={23} strokeWidth={2} />
            </button>
          </div>

          {/* Judul */}
          <div className="mt-1 text-center text-white">
            <h1 className="text-lg font-semibold sm:text-xl">
              Profil Saya
            </h1>
          </div>

          {/* ================= FOTO PROFILE ================= */}
          <div
            className="
              flex flex-col items-center
              pt-6 pb-8
              sm:pt-7 sm:pb-9
              lg:pt-5 lg:pb-7
            "
          >
            {/* Foto */}
            <div className="relative">

              {user.foto ? (
                <img
                  src={user.foto}
                  alt="Foto Profil"
                  className="
                    h-28 w-28
                    rounded-full
                    border-4 border-white
                    object-cover
                    shadow-md
                    sm:h-30 sm:w-30
                    lg:h-28 lg:w-28
                  "
                />
              ) : (
                <div
                  className="
                    flex
                    h-28 w-28
                    items-center justify-center
                    rounded-full
                    border-4 border-white
                    bg-[#E5E7EB]
                    shadow-md
                    sm:h-30 sm:w-30
                    lg:h-28 lg:w-28
                  "
                >
                  <User
                    size={54}
                    strokeWidth={1.7}
                    className="text-[#6B7280]"
                  />
                </div>
              )}

              {/* Tombol edit foto */}
              <button
                onClick={handleEditProfile}
                className="
                  absolute bottom-0 right-0
                  flex h-8 w-8
                  items-center justify-center
                  rounded-full
                  border-2 border-white
                  bg-[#E5E7EB]
                  text-[#555]
                  shadow-sm
                "
                aria-label="Edit foto profil"
              >
                <Pencil size={14} />
              </button>
            </div>

            {/* Username */}
            <h2 className="mt-2 text-lg font-semibold text-white">
              {user.username}
            </h2>

            {/* Edit Profil */}
            <button
              onClick={handleEditProfile}
              className="
                mt-3
                flex items-center gap-2
                rounded-full
                bg-white
                px-5 py-2.5
                text-sm font-medium
                text-[#0865C2]
                shadow-sm
                transition
                hover:bg-gray-100
              "
            >
              <Pencil size={16} />
              Edit Profil
            </button>
          </div>
        </div>
      </header>

        {/* ================= CONTENT ================= */}
        <main className="mx-auto w-full max-w-5xl px-5 pb-10 sm:px-8">

          <section className="pt-6 sm:pt-8 lg:pt-7">

            {/* Judul Section */}
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />

              <h2 className="whitespace-nowrap text-sm font-medium text-gray-500">
                Informasi Pribadi
              </h2>

              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Card */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

              {/* Username */}
              <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1F3F5]">
                  <User
                    size={19}
                    strokeWidth={1.8}
                    className="text-gray-600"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-gray-400">
                    Username
                  </p>

                  <p className="mt-0.5 truncate text-sm font-medium text-gray-800">
                    {user.username}
                  </p>
                </div>
              </div>

              <div className="mx-5 border-t border-gray-100 sm:mx-6" />

              {/* Email */}
              <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1F3F5]">
                  <Mail
                    size={19}
                    strokeWidth={1.8}
                    className="text-gray-600"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-gray-400">
                    Email
                  </p>

                  <p className="mt-0.5 truncate text-sm font-medium text-gray-800">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="mx-5 border-t border-gray-100 sm:mx-6" />

              {/* Jenjang */}
              <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1F3F5]">
                  <GraduationCap
                    size={20}
                    strokeWidth={1.8}
                    className="text-gray-600"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-gray-400">
                    Jenjang
                  </p>

                  <p className="mt-0.5 text-sm font-medium text-gray-800">
                    {user.jenjang}
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* ================= PENGATURAN ================= */}
          <section className="mt-7 sm:mt-8">

            {/* Judul Section */}
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />

              <h2 className="whitespace-nowrap text-sm font-medium text-gray-500">
                Pengaturan
              </h2>

              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Card Pengaturan */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

              <button
                onClick={handleChangePassword}
                className="
                  flex w-full items-center gap-4
                  px-5 py-4
                  text-left
                  transition
                  hover:bg-gray-50
                  sm:px-6
                "
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1F3F5]">
                  <Lock
                    size={19}
                    strokeWidth={1.8}
                    className="text-gray-600"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    Ganti Password
                  </p>

                  <p className="mt-0.5 text-xs text-gray-400">
                    Ubah password akun Anda
                  </p>
                </div>

                <ChevronRight
                  size={20}
                  strokeWidth={1.8}
                  className="shrink-0 text-gray-400"
                />
              </button>

            </div>
          </section>

        </main>
    </div>
  );
};

export default Profile;