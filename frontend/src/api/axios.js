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

export default API;