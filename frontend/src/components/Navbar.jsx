import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  User,
  LogOut,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import LogoutConfirmModal from "./LogoutConfirmModal";
import nollaMain from "../assets/nolla_main.png";
import avatar1 from "../assets/avatar/avatar1.svg";
import avatar2 from "../assets/avatar/avatar2.svg";
import avatar3 from "../assets/avatar/avatar3.svg";
import avatar4 from "../assets/avatar/avatar4.svg";
import avatar5 from "../assets/avatar/avatar5.svg";
import avatar6 from "../assets/avatar/avatar6.svg";
import avatar7 from "../assets/avatar/avatar7.svg";
import avatar8 from "../assets/avatar/avatar8.svg";

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

const Navbar = ({ activePage = "Dashboard" }) => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [serverAvatar, setServerAvatar] = useState(null);

  useEffect(() => {
    let isMounted = true;

    API.get("/profile")
      .then(({ data }) => {
        if (isMounted && data?.data) {
          setServerAvatar(data.data.avatar);
          updateUser(data.data);
        }
      })
      .catch((error) => {
        console.error("Gagal memuat avatar profil:", error);
      });

    return () => {
      isMounted = false;
    };
  }, [updateUser]);

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "User@gmail.com";

  const avatarSource =
    avatarSources[serverAvatar] ||
    (serverAvatar && !/^avatar_\d+$/.test(serverAvatar) ? serverAvatar : null) ||
    avatar1;

  const menuItems = [
    { label: "Bab Pembelajaran", icon: BookOpen, path: "/topik" },
    {
      label: "Hasil Belajar",
      icon: LayoutDashboard,
      path: "/hasil-pembelajaran",
    },
    { label: "Profil", icon: User, path: "/profile" },
  ];

  const handleLogout = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }

    if (isLogoutSuccessful) {
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <>
      <aside className="fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full flex-row items-center border-t border-neutral-border bg-neutral-card px-2 shadow-lg md:sticky md:top-0 md:h-screen md:w-64 md:flex-col md:border-r md:border-t-0 md:px-0 md:shadow-none">
        {/* Brand / Logo (Desktop) */}
        <div className="hidden border-b border-neutral-border p-6 md:flex md:w-full md:flex-col md:items-center md:justify-center md:gap-1">
          <img src={nollaMain} alt="" aria-hidden="true" className="h-12 w-12 shrink-0 object-contain" />
          <h1 className="translate-y-0.5 font-heading text-2xl font-bold leading-none text-neutral-text">
            NOLLA
          </h1>
        </div>

        {/* Navigasi Menu */}
        <nav className="flex w-full flex-1 flex-row justify-around md:flex-col md:justify-start md:space-y-1.5 md:overflow-y-auto md:p-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center transition-all cursor-pointer 
                  /* Mobile Style: Bertumpuk Vertikal */
                  flex-col justify-center 
                  /* Desktop Style: Lurus Horizontal Rata Kiri */
                  md:flex-row md:justify-start md:gap-3 md:rounded-xl md:px-4 md:py-3 ${
                    isActive
                      ? "text-primary font-semibold md:bg-primary md:text-white md:shadow-sm"
                      : "text-neutral-muted hover:text-neutral-text md:hover:bg-neutral-bg"
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-[10px] mt-0.5 md:mt-0 md:text-sm font-medium">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Profile & Logout Button (Desktop) */}
        <div className="hidden border-t border-neutral-border bg-neutral-bg/50 p-4 md:flex md:w-full md:items-center md:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar User */}
            <img
              src={avatarSource}
              alt={`Avatar ${displayName}`}
              onError={(event) => {
                event.currentTarget.src = avatar1;
              }}
              className="h-9 w-9 shrink-0 rounded-full border border-slate-200 bg-white object-cover shadow-xs"
            />

            {/* Nama & Email Dinamis */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-text">
                {displayName}
              </p>
              <p className="truncate text-xs text-neutral-muted">
                {displayEmail}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            disabled={isLoading}
            title="Keluar"
            className="cursor-pointer rounded-lg p-1.5 text-neutral-muted hover:text-danger hover:bg-neutral-card transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-neutral-muted" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
          </button>
        </div>
      </aside>

      <LogoutConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        isLoading={isLoading}
      />

      {/* Spacer Mobile */}
      <div className="h-16 md:hidden" />
    </>
  );
};

export default Navbar;
