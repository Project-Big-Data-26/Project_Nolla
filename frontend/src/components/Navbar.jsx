import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  Settings,
  User,
  LogOut,
  GraduationCap,
} from "lucide-react";

const Navbar = () => {
  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, active: true },
    { label: "Topik", icon: BookOpen, active: false },
    { label: "Profil", icon: User, active: false },
    { label: "Setting", icon: Settings, active: false },
  ];

  return (
    <>
      <aside className="fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full flex-row items-center border-t border-neutral-border bg-neutral-card px-2 shadow-lg md:sticky md:top-0 md:h-screen md:w-64 md:flex-col md:border-r md:border-t-0 md:px-0 md:shadow-none">
        {/* Brand / Logo (Desktop) */}
        <div className="hidden border-b border-neutral-border p-6 md:flex md:w-full md:items-center md:gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold leading-none text-neutral-text">
              Big Data
            </h1>
            <span className="text-xs text-neutral-muted">Big Data Project</span>
          </div>
        </div>

        {/* Navigasi Menu */}
        <nav className="flex w-full flex-1 flex-row justify-around md:flex-col md:justify-start md:space-y-1.5 md:overflow-y-auto md:p-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                className={`flex items-center transition-all cursor-pointer 
                  /* Mobile Style: Bertumpuk Vertikal */
                  flex-col justify-center 
                  /* Desktop Style: Lurus Horizontal Rata Kiri */
                  md:flex-row md:justify-start md:gap-3 md:rounded-xl md:px-4 md:py-3 ${
                    item.active
                      ? "text-primary font-semibold md:bg-primary md:text-white md:shadow-sm"
                      : "text-neutral-muted hover:text-neutral-text md:hover:bg-neutral-bg"
                  }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-[10px] mt-0.5 md:mt-0 md:text-sm font-medium">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Profile (Desktop) */}
        <div className="hidden border-t border-neutral-border bg-neutral-bg/50 p-4 md:flex md:w-full md:items-center md:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-dark text-xs font-semibold text-white">
              U
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-text">
                User
              </p>
              <p className="truncate text-xs text-neutral-muted">
                User@gmail.com
              </p>
            </div>
          </div>

          <button className="cursor-pointer rounded-lg p-1.5 text-neutral-muted hover:text-danger transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* Spacer Mobile */}
      <div className="h-16 md:hidden" />
    </>
  );
};

export default Navbar;
