// Klien event analytics browser. Event disimpan lewat POST /api/analytics/events;
// tidak ada console.* maupun perekaman console/URL/request mentah.
import { API_BASE_URL } from "../api/baseUrl";

const QUEUE_KEY = "nolla.analytics.queue";
const SESSION_KEY = "nolla.analytics.session";
const DISABLED_KEY = "nolla.analytics.disabled";
const SESSION_IDLE_MS = 30 * 60 * 1000;
const MAX_QUEUE = 200;
const MAX_EVENT_AGE_MS = 6 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 50;
const FLUSH_DELAY_MS = 3000;
const RETRY_DELAY_MS = 30000;
const SCHEMA_VERSION = 1;

const randomHex = (bytes) => {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16).padStart(2, "0")).join("");
};

const uuid = () => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const hex = randomHex(16).split("");
  hex[12] = "4";
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
};

export const createClientId = (prefix) => `${prefix}_${randomHex(12)}`;

const readJson = (storage, key, fallback) => {
  try {
    const value = JSON.parse(storage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (storage, key, value) => {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage penuh/diblokir: event tetap di memori sampai halaman ditutup.
  }
};

const pageInstanceId = createClientId("pg");
let memoryQueue = null;
let flushTimer = null;
let inflight = false;

const isDisabled = () => {
  try {
    return sessionStorage.getItem(DISABLED_KEY) === "1";
  } catch {
    return false;
  }
};

const getAccessToken = () =>
  localStorage.getItem("accessToken") || localStorage.getItem("token");

// Sesi belajar terpisah dari token: sesi baru setelah 30 menit tanpa aktivitas.
export const getLearningSessionId = () => {
  const now = Date.now();
  const stored = readJson(localStorage, SESSION_KEY, null);
  const session =
    stored?.id && now - stored.lastActivityAt < SESSION_IDLE_MS
      ? { id: stored.id, lastActivityAt: now }
      : { id: createClientId("ls"), lastActivityAt: now };
  writeJson(localStorage, SESSION_KEY, session);
  return session.id;
};

export const getCorrelationHeaders = () => ({
  "X-Learning-Session-Id": getLearningSessionId(),
  "X-Page-Instance-Id": pageInstanceId,
});

const loadQueue = () => {
  if (memoryQueue) return memoryQueue;
  const minTime = Date.now() - MAX_EVENT_AGE_MS;
  memoryQueue = readJson(localStorage, QUEUE_KEY, []).filter(
    (event) => Date.parse(event?.occurred_at) > minTime,
  );
  return memoryQueue;
};

const saveQueue = () => writeJson(localStorage, QUEUE_KEY, memoryQueue ?? []);

const scheduleFlush = (delay = FLUSH_DELAY_MS) => {
  if (flushTimer) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    flushAnalytics();
  }, delay);
};

const ROUTE_NAMES = {
  "/": "topics",
  "/topik": "topics",
  "/personalization": "personalization",
  "/hasil-pembelajaran": "learning_results",
  "/profile": "profile",
  "/profile/edit": "profile_edit",
  "/profile/ganti-password": "profile_password",
  "/quiz": "assessment",
  "/review-quiz": "review",
  "/settings": "settings",
};

// Nama route tanpa ID, query, atau hash (aman untuk analytics).
export const routeNameFromPath = (pathname) =>
  ROUTE_NAMES[String(pathname || "/").replace(/\/+$/, "") || "/"] ?? "other";

/**
 * Antrekan satu event. Hanya untuk siswa yang login; aktivitas sebelum login
 * tidak direkam karena membutuhkan dasar pemrosesan tersendiri.
 */
export const track = (eventName, options = {}) => {
  if (isDisabled() || !getAccessToken()) return;

  const event = {
    event_id: uuid(),
    event_name: eventName,
    schema_version: SCHEMA_VERSION,
    occurred_at: new Date().toISOString(),
    learning_session_id: getLearningSessionId(),
    page_instance_id: pageInstanceId,
    properties: options.properties ?? {},
  };
  if (options.assessmentType && options.attemptId) {
    event.assessment_type = options.assessmentType;
    event.assessment_attempt_id = String(options.attemptId);
  }
  if (options.routeName) event.route_name = options.routeName;
  if (options.qualityFlags?.length) event.quality_flags = options.qualityFlags;

  const queue = loadQueue();
  queue.push(event);
  if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);
  saveQueue();

  scheduleFlush(queue.length >= 20 ? 0 : FLUSH_DELAY_MS);
};

const disable = () => {
  try {
    sessionStorage.setItem(DISABLED_KEY, "1");
  } catch {
    // abaikan
  }
  memoryQueue = [];
  saveQueue();
};

export const flushAnalytics = async ({ keepalive = false } = {}) => {
  const token = getAccessToken();
  const queue = loadQueue();
  if (inflight || !token || queue.length === 0 || isDisabled()) return;

  inflight = true;
  const batch = queue.slice(0, BATCH_SIZE);
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Page-Instance-Id": pageInstanceId,
      },
      body: JSON.stringify({ events: batch }),
      keepalive,
    });

    if (response.status === 400) {
      // Batch tidak valid secara keseluruhan; kirim ulang tidak akan berhasil.
      memoryQueue = queue.filter((event) => !batch.includes(event));
      saveQueue();
    } else if (response.ok) {
      const results = (await response.json())?.data?.results ?? [];
      if (results.some((result) => result.status === "dropped_disabled")) {
        disable();
        return;
      }
      const sentIds = new Set(
        batch
          .filter((_, index) => results[index]?.status !== "retry")
          .map((event) => event.event_id),
      );
      memoryQueue = loadQueue().filter((event) => !sentIds.has(event.event_id));
      saveQueue();
      if (memoryQueue.length) scheduleFlush(0);
    } else {
      // 401/429/5xx: simpan dan coba lagi nanti dengan event_id yang sama.
      scheduleFlush(RETRY_DELAY_MS);
    }
  } catch {
    scheduleFlush(RETRY_DELAY_MS);
  } finally {
    inflight = false;
  }
};

// Logout/pergantian akun: jangan kirim event akun lama atas nama akun baru.
export const resetAnalytics = () => {
  memoryQueue = [];
  saveQueue();
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(DISABLED_KEY);
  } catch {
    // abaikan
  }
};

const OBJECT_ID_SEGMENT = /^[a-f0-9]{24}$/i;

// "/quiz/<id>/submit?x=1" -> "quiz_submit" (tanpa ID/query).
export const operationFromUrl = (url) => {
  const path = String(url || "").split(/[?#]/)[0];
  const relative = path.startsWith(API_BASE_URL) ? path.slice(API_BASE_URL.length) : path;
  const slug = relative
    .split("/")
    .filter((segment) => segment && !OBJECT_ID_SEGMENT.test(segment) && !/\d{4,}/.test(segment))
    .join("_")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  const safe = /^[a-z]/.test(slug) ? slug : `op_${slug}`;
  return safe.slice(0, 48).replace(/_+$/, "") || "unknown";
};

export const trackApiError = (error) => {
  const status = error?.response?.status ?? null;
  const url = error?.config?.url ?? "";
  if (status === 401 || url.includes("/analytics/events")) return;

  track("application_error", {
    routeName: routeNameFromPath(window.location.pathname),
    properties: {
      operation: operationFromUrl(url),
      reason_code: status
        ? `http_${status}`
        : error?.code === "ECONNABORTED"
          ? "timeout"
          : "network_error",
      http_status: status,
      retriable: !status || status >= 500 || status === 429,
    },
  });
};

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => flushAnalytics({ keepalive: true }));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushAnalytics({ keepalive: true });
  });
  window.addEventListener("auth:expired", resetAnalytics);
}
