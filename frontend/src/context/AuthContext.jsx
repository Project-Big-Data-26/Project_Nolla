import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { resetAnalytics } from "../analytics/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser && savedUser !== "undefined"
        ? JSON.parse(savedUser)
        : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const savedToken =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    return savedToken && savedToken !== "undefined" ? savedToken : null;
  });

  useEffect(() => {
    const handleTokenRefresh = () => {
      setToken(localStorage.getItem("accessToken"));
    };
    const handleSessionExpiry = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
    };

    window.addEventListener("auth:refreshed", handleTokenRefresh);
    window.addEventListener("auth:expired", handleSessionExpiry);
    return () => {
      window.removeEventListener("auth:refreshed", handleTokenRefresh);
      window.removeEventListener("auth:expired", handleSessionExpiry);
    };
  }, []);

  const login = (userData, authToken) => {
    // Perangkat bersama: jangan gabungkan antrean/sesi analytics akun sebelumnya.
    const previousUserId = user?.id ?? user?._id;
    const nextUserId = userData?.id ?? userData?._id;
    if (!previousUserId || String(previousUserId) !== String(nextUserId)) {
      resetAnalytics();
    }
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("accessToken", authToken);
  };

  // 💡 TAMBAHAN FUNGSI: Untuk update data user secara parsial (misal nama/profile)
  const updateUser = useCallback((newUserData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newUserData };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const logout = () => {
    resetAnalytics();
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        login,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
