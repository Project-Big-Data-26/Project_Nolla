import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { login } = useAuth();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      // ========================================
      // 1. AMBIL TOKEN DARI URL
      // ========================================

      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");

      // Kalau token tidak ada
      if (!accessToken || !refreshToken) {
        console.error("Access token atau refresh token tidak ditemukan.");

        navigate("/login", {
          replace: true,
        });

        return;
      }

      try {
        // ========================================
        // 2. SIMPAN TOKEN SEMENTARA
        // ========================================

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        // ========================================
        // 3. AMBIL DATA USER DARI BACKEND
        // ========================================
        //
        // Backend:
        // GET /api/auth/me
        //
        // Jangan mengambil isProfileComplete dari JWT
        // karena JWT kamu saat ini hanya berisi:
        // id, email, iat, exp
        //

        const response = await API.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // ========================================
        // 4. AMBIL USER DARI RESPONSE
        // ========================================

        const user = response.data?.data?.user;

        if (!user) {
          throw new Error("Data user tidak ditemukan.");
        }

        console.log("Google login user:", user);

        // ========================================
        // 5. SIMPAN USER + ACCESS TOKEN
        //    KE AUTH CONTEXT
        // ========================================

        login(user, accessToken);

        // ========================================
        // 6. HAPUS TOKEN DARI URL
        // ========================================
        //
        // URL sebelumnya:
        //
        // /auth/callback?accessToken=xxx&refreshToken=xxx
        //
        // Setelah ini URL tidak lagi menyimpan token.
        //

        // ========================================
        // 7. REDIRECT BERDASARKAN PROFIL
        // ========================================

        if (!user.isProfileComplete) {
          navigate("/personalization", {
            replace: true,
          });
        } else {
          navigate("/topik", {
            replace: true,
          });
        }
      } catch (error) {
        console.error("Google authentication callback error:", error);

        // ========================================
        // 8. BERSIHKAN TOKEN JIKA GAGAL
        // ========================================

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        // ========================================
        // 9. KEMBALI KE LOGIN
        // ========================================

        navigate("/login", {
          replace: true,
        });
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate, login]);

  // ========================================
  // LOADING SCREEN
  // ========================================

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-neutral-bg">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />

      <p className="text-xs font-medium text-neutral-muted">
        Memproses masuk dengan Google...
      </p>
    </div>
  );
};

export default AuthCallback;
