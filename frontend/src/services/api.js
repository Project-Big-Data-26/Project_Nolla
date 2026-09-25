const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || payload.error || payload.detail || `Request failed (${response.status})`);
  return payload;
}

export function saveQuestion(payload) {
  return request("/questions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
}
export function classifyQuestion(payload) {
  return request("/ai/classify-question", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
}
export function extractSource(file) {
  const body = new FormData(); body.append("file", file);
  return request("/ai/extract", { method: "POST", body });
}
export function recordStudentResponse(payload) {
  return request("/responses", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
}
