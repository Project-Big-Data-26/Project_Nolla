import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function GoogleAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const callbackHandled = useRef(false);

  useEffect(() => {
    if (callbackHandled.current) return;
    callbackHandled.current = true;

    const query = new URLSearchParams(location.search);
    const accessToken = query.get("accessToken");
    const refreshToken = query.get("refreshToken");

    window.history.replaceState({}, document.title, window.location.pathname);

    if (!accessToken || !refreshToken) {
      navigate("/login?error=google_auth_failed", { replace: true });
      return;
    }

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    API.get("/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(({ data }) => {
        const user = data?.data?.user;
        if (!user) throw new Error("Profil pengguna tidak ditemukan");

        login(user, accessToken);
        navigate(user.isProfileComplete ? "/topik" : "/personalization", {
          replace: true,
        });
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("auth:expired"));
        navigate("/login?error=google_auth_failed", { replace: true });
      });
  }, [location.search, login, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-bg px-4">
      <p role="status" className="text-sm font-medium text-slate-700">
        Menghubungkan akun Google...
      </p>
    </main>
  );
}