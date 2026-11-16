import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadClient = async () => {
  vi.resetModules();
  return import("./client");
};

const queue = () => JSON.parse(localStorage.getItem("nolla.analytics.queue") || "[]");

const mockFetchResults = (statuses, httpStatus = 200) =>
  vi.fn(async (_url, init) => {
    const { events } = JSON.parse(init.body);
    return {
      ok: httpStatus >= 200 && httpStatus < 300,
      status: httpStatus,
      json: async () => ({
        data: { results: events.map((event, index) => ({ event_id: event.event_id, status: statuses[index] })) },
      }),
    };
  });

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("analytics client", () => {
  it("memetakan route tanpa ID/query dan operation tanpa ObjectId", async () => {
    const { routeNameFromPath, operationFromUrl } = await loadClient();
    expect(routeNameFromPath("/quiz")).toBe("assessment");
    expect(routeNameFromPath("/topik/")).toBe("topics");
    expect(routeNameFromPath("/login")).toBe("other");
    expect(operationFromUrl("/quiz/66a400000000000000000001/submit?x=1")).toBe("quiz_submit");
    expect(operationFromUrl("/pretest/status/66a400000000000000000001")).toBe("pretest_status");
    expect(operationFromUrl("/image/abc.def")).toMatch(/^[a-z][a-z0-9_]{0,47}$/);
  });

  it("tidak merekam apa pun sebelum login", async () => {
    const { track } = await loadClient();
    track("page_viewed", { routeName: "topics" });
    expect(queue()).toEqual([]);
  });

  it("membentuk envelope sesuai kontrak dan tidak mengirim identitas", async () => {
    localStorage.setItem("accessToken", "token-1");
    const { track } = await loadClient();
    track("question_viewed", {
      assessmentType: "quiz",
      attemptId: "66a400000000000000000001",
      properties: { sequence: 1 },
    });
    const [event] = queue();
    expect(Object.keys(event).sort()).toEqual([
      "assessment_attempt_id", "assessment_type", "event_id", "event_name", "learning_session_id",
      "occurred_at", "page_instance_id", "properties", "schema_version",
    ]);
    expect(event.event_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(event.learning_session_id).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    expect(JSON.stringify(event)).not.toContain("token-1");
  });

  it("menghapus event yang diterima/ditolak dan menyimpan yang perlu retry", async () => {
    localStorage.setItem("accessToken", "token-1");
    const fetchMock = mockFetchResults(["accepted", "retry", "rejected", "duplicate"]);
    vi.stubGlobal("fetch", fetchMock);
    const { track, flushAnalytics } = await loadClient();
    ["a", "b", "c", "d"].forEach((name) => track("page_viewed", { routeName: "topics", properties: { content_state: "ready" }, qualityFlags: [], name }));
    await flushAnalytics();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/analytics\/events$/);
    expect(init.headers.Authorization).toBe("Bearer token-1");
    expect(queue()).toHaveLength(1);
    expect(queue()[0].event_id).toBe(JSON.parse(init.body).events[1].event_id);
  });

  it("menyimpan seluruh batch saat server 503", async () => {
    localStorage.setItem("accessToken", "token-1");
    vi.stubGlobal("fetch", mockFetchResults([], 503));
    const { track, flushAnalytics } = await loadClient();
    track("page_viewed", { routeName: "topics" });
    await flushAnalytics();
    expect(queue()).toHaveLength(1);
  });

  it("berhenti mengumpulkan saat analytics dinonaktifkan server", async () => {
    localStorage.setItem("accessToken", "token-1");
    vi.stubGlobal("fetch", mockFetchResults(["dropped_disabled"]));
    const { track, flushAnalytics } = await loadClient();
    track("page_viewed", { routeName: "topics" });
    await flushAnalytics();
    expect(queue()).toEqual([]);
    track("page_viewed", { routeName: "topics" });
    expect(queue()).toEqual([]);
  });

  it("membuat sesi belajar baru setelah 30 menit tanpa aktivitas", async () => {
    const { getLearningSessionId } = await loadClient();
    const first = getLearningSessionId();
    vi.advanceTimersByTime(29 * 60 * 1000);
    expect(getLearningSessionId()).toBe(first);
    vi.advanceTimersByTime(31 * 60 * 1000);
    expect(getLearningSessionId()).not.toBe(first);
  });

  it("mencatat kunjungan anonim dengan ID first-touch yang tetap pada navigasi berikutnya", async () => {
    window.history.replaceState(
      {},
      "",
      "/?utm_source=instagram&utm_medium=story&utm_content=poster",
    );
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const { getAttributionHeaders, initializeAttribution } = await loadClient();

    const firstVisitId = await initializeAttribution();
    expect(firstVisitId).toMatch(/^vst_[0-9a-f]{48}$/);
    expect(getAttributionHeaders()["X-Attribution-Visit-Id"]).toBe(firstVisitId);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      visit_id: firstVisitId,
      utm_source: "instagram",
      utm_medium: "story",
      utm_content: "poster",
    });

    window.history.replaceState({}, "", "/?utm_source=tiktok&utm_medium=post");
    const reloadedClient = await loadClient();
    await reloadedClient.initializeAttribution();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).utm_source).toBe("instagram");
  });

  it("membuat ID first-touch baru setelah masa retensi habis", async () => {
    window.history.replaceState(
      {},
      "",
      "/?utm_source=instagram&utm_medium=feed",
    );
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const firstClient = await loadClient();
    const firstVisitId = await firstClient.initializeAttribution();

    vi.setSystemTime(Date.now() + 366 * 24 * 60 * 60 * 1000);
    window.history.replaceState(
      {},
      "",
      "/?utm_source=tiktok&utm_medium=post",
    );
    const nextVisitId = await firstClient.initializeAttribution();

    expect(nextVisitId).not.toBe(firstVisitId);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({
      visit_id: nextVisitId,
      utm_source: "tiktok",
      utm_medium: "post",
    });
  });

  it("resetAnalytics mengosongkan antrean dan sesi (logout/ganti akun)", async () => {
    localStorage.setItem("accessToken", "token-1");
    const { track, resetAnalytics, getLearningSessionId } = await loadClient();
    track("page_viewed", { routeName: "topics" });
    const before = JSON.parse(localStorage.getItem("nolla.analytics.session")).id;
    resetAnalytics();
    expect(queue()).toEqual([]);
    expect(getLearningSessionId()).not.toBe(before);
  });
});
