import { beforeEach, describe, expect, it, vi } from "vitest";
import API from "./axios";
import {
  activateTrial,
  formatDiscount,
  formatRupiah,
  formatTimeLeft,
  getPlanBlock,
  remainingQuizSessions,
} from "./subscription";

vi.mock("./axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const httpError = (status, data) =>
  Object.assign(new Error("http"), { response: { status, data } });

beforeEach(() => {
  API.post.mockReset();
});

describe("getPlanBlock", () => {
  it("mengenali 403 paket beserta data kuota", () => {
    expect(
      getPlanBlock(
        httpError(403, {
          code: "QUIZ_LIMIT_REACHED",
          message: "Batas tercapai",
          data: { used: 3, limit: 3 },
        }),
      ),
    ).toEqual({ code: "QUIZ_LIMIT_REACHED", message: "Batas tercapai", used: 3, limit: 3 });
    expect(getPlanBlock(httpError(403, { code: "PREMIUM_REQUIRED", message: "x" }))).toMatchObject({
      code: "PREMIUM_REQUIRED",
      used: null,
      limit: null,
    });
  });

  it("mengabaikan 403 lama tanpa code dan status lain", () => {
    expect(getPlanBlock(httpError(403, { message: "Subbab belum tersedia untuk quiz" }))).toBeNull();
    expect(getPlanBlock(httpError(409, { code: "PREMIUM_REQUIRED" }))).toBeNull();
    expect(getPlanBlock(new Error("network"))).toBeNull();
  });
});

describe("remainingQuizSessions", () => {
  it("null untuk premium, tidak negatif setelah trial", () => {
    expect(remainingQuizSessions({ quiz_sessions_limit: null, quiz_sessions_used: 9 })).toBeNull();
    expect(remainingQuizSessions({ quiz_sessions_limit: 3, quiz_sessions_used: 1 })).toBe(2);
    expect(remainingQuizSessions({ quiz_sessions_limit: 3, quiz_sessions_used: 5 })).toBe(0);
    expect(remainingQuizSessions({})).toBeNull();
  });
});

describe("formatTimeLeft", () => {
  const now = Date.parse("2026-11-03T10:00:00Z");
  const after = (ms) => new Date(now + ms).toISOString();

  it("format hari/jam/menit dan null bila lewat", () => {
    expect(formatTimeLeft(after(72 * 3_600_000), now)).toBe("3 hari");
    expect(formatTimeLeft(after(50 * 3_600_000), now)).toBe("2 hari 2 jam");
    expect(formatTimeLeft(after(5 * 3_600_000 + 1), now)).toBe("5 jam");
    expect(formatTimeLeft(after(90_000), now)).toBe("2 menit");
    expect(formatTimeLeft(after(0), now)).toBeNull();
    expect(formatTimeLeft("bukan tanggal", now)).toBeNull();
  });
});

describe("activateTrial", () => {
  it("201/200 → ok dengan entitlement baru", async () => {
    API.post.mockResolvedValueOnce({ data: { data: { plan: "premium", is_trial: true } } });
    await expect(activateTrial()).resolves.toEqual({
      ok: true,
      entitlement: { plan: "premium", is_trial: true },
    });
    expect(API.post).toHaveBeenCalledWith("/subscription/trial");
  });

  it("409 dikembalikan sebagai hasil; error lain dilempar", async () => {
    API.post.mockRejectedValueOnce(
      httpError(409, { code: "TRIAL_ALREADY_USED", message: "Sudah dipakai" }),
    );
    await expect(activateTrial()).resolves.toEqual({
      ok: false,
      code: "TRIAL_ALREADY_USED",
      message: "Sudah dipakai",
    });
    API.post.mockRejectedValueOnce(httpError(500, {}));
    await expect(activateTrial()).rejects.toThrow();
  });
});

describe("format harga", () => {
  it("Rupiah tanpa desimal dan label diskon", () => {
    expect(formatRupiah(15000)).toBe("Rp15.000");
    expect(formatRupiah(1299000)).toBe("Rp1.299.000");
    expect(formatDiscount(null)).toBeNull();
    expect(formatDiscount({ type: "percentage", value: 20, amount: 9800 })).toBe("Hemat 20%");
    expect(formatDiscount({ type: "percentage", value: 12.5, amount: 6238 })).toBe("Hemat 12,5%");
    expect(formatDiscount({ type: "flat", value: 100000, amount: 100000 })).toBe("Hemat Rp100.000");
  });
});
