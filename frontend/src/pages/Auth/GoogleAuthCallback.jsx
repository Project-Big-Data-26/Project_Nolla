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

    const code = new URLSearchParams(location.hash.slice(1)).get("code");

    window.history.replaceState({}, document.title, window.location.pathname);

    if (!code) {
      navigate("/login?error=google_auth_failed", { replace: true });
      return;
    }

    API.post("/auth/google/exchange", { code })
      .then(({ data }) => {
        const { accessToken, refreshToken, user } = data?.data ?? {};
        if (!accessToken || !refreshToken || !user) {
          throw new Error("Respons login Google tidak lengkap");
        }

        localStorage.setItem("refreshToken", refreshToken);
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
  }, [location.hash, login, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-bg px-4">
      <p role="status" className="text-sm font-medium text-slate-700">
        Menghubungkan akun Google...
      </p>
    </main>
  );
}