import axios from "axios";

// Base URL backend dibaca dari environment variable VITE_API_BASE_URL
// (lihat .env / .env.example). Fallback ke localhost:5000/api kalau
// variable-nya belum di-set, supaya development tetap jalan tanpa
// perlu bikin .env dulu.
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const API = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
    },
});

let refreshPromise = null;

API.interceptors.request.use((config) => {
    const accessToken =
        localStorage.getItem("accessToken") || localStorage.getItem("token");

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
});

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isAuthRequest = originalRequest?.url?.includes("/auth/");

        if (
            error.response?.status !== 401 ||
            !originalRequest ||
            originalRequest._retry ||
            isAuthRequest
        ) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.dispatchEvent(new Event("auth:expired"));
            return Promise.reject(error);
        }

        if (!refreshPromise) {
            refreshPromise = axios
                .post(
                    `${baseURL}/auth/refresh`,
                    { refreshToken },
                    { headers: { "Content-Type": "application/json" } },
                )
                .then((response) => {
                    const { accessToken, refreshToken: nextRefreshToken } =
                        response.data.data;
                    localStorage.setItem("accessToken", accessToken);
                    localStorage.setItem("refreshToken", nextRefreshToken);
                    window.dispatchEvent(new Event("auth:refreshed"));
                    return accessToken;
                })
                .catch((refreshError) => {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("token");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("user");
                    window.dispatchEvent(new Event("auth:expired"));
                    throw refreshError;
                })
                .finally(() => {
                    refreshPromise = null;
                });
        }

        try {
            const accessToken = await refreshPromise;
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return API(originalRequest);
        } catch (refreshError) {
            return Promise.reject(refreshError);
        }
    },
);

export default API;