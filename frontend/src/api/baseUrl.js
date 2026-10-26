// Base URL backend dari VITE_API_BASE_URL, dinormalkan ke "<skema>://<host>/api".
// Menerima "localhost:5000", "http://host:5000", atau "http://host:5000/api".
export const normalizeApiBaseUrl = (value) => {
  const raw = String(value || "http://localhost:5000/api").trim();
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  const trimmed = withScheme.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
