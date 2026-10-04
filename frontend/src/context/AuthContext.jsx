import React, { createContext, useContext, useEffect, useState } from "react";

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
    };

    window.addEventListener("auth:refreshed", handleTokenRefresh);
    window.addEventListener("auth:expired", handleSessionExpiry);
    return () => {
      window.removeEventListener("auth:refreshed", handleTokenRefresh);
      window.removeEventListener("auth:expired", handleSessionExpiry);
    };
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("accessToken", authToken);
  };

  // 💡 TAMBAHAN FUNGSI: Untuk update data user secara parsial (misal nama/profile)
  const updateUser = (newUserData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newUserData };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
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
