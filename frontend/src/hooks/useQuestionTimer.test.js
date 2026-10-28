import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import useQuestionTimer from "./useQuestionTimer";

let clock = 0;
let visibility = "visible";

beforeEach(() => {
  sessionStorage.clear();
  clock = 0;
  visibility = "visible";
  vi.spyOn(performance, "now").mockImplementation(() => clock);
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility);
});

afterEach(() => vi.restoreAllMocks());

const setVisibility = (value) => {
  visibility = value;
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("useQuestionTimer", () => {
  it("mengakumulasi waktu saat soal dikunjungi ulang", () => {
    const { result, rerender } = renderHook(
      ({ active }) => useQuestionTimer("quiz:s1", active),
      { initialProps: { active: "q1" } },
    );
    clock = 3000;
    rerender({ active: "q2" });
    clock = 5000;
    rerender({ active: "q1" });
    clock = 6500;

    expect(result.current.getTiming("q1")).toEqual({ response_time_ms: 4500, response_time_partial: false });
    expect(result.current.getTiming("q2")).toEqual({ response_time_ms: 2000, response_time_partial: false });
  });

  it("tidak menghitung waktu saat tab tersembunyi", () => {
    const { result } = renderHook(() => useQuestionTimer("quiz:s1", "q1"));
    clock = 1000;
    act(() => setVisibility("hidden"));
    clock = 60000;
    act(() => setVisibility("visible"));
    clock = 61000;

    expect(result.current.getTiming("q1").response_time_ms).toBe(2000);
  });

  it("soal yang belum pernah tampil bernilai null, bukan nol", () => {
    const { result } = renderHook(() => useQuestionTimer("quiz:s1", "q1"));
    expect(result.current.getTiming("q9")).toEqual({ response_time_ms: null, response_time_partial: null });
  });

  it("bertahan setelah refresh; segmen yang tidak sempat ditutup ditandai partial", () => {
    const first = renderHook(() => useQuestionTimer("quiz:s1", "q1"));
    clock = 2000;
    act(() => window.dispatchEvent(new Event("pagehide")));
    first.unmount();

    const second = renderHook(() => useQuestionTimer("quiz:s1", "q1"));
    clock = 3000;
    expect(second.result.current.getTiming("q1")).toEqual({ response_time_ms: 3000, response_time_partial: false });

    // Simulasi tab crash: segmen terbuka tersimpan tanpa ditutup.
    sessionStorage.setItem(
      "quiz:s2:timing",
      JSON.stringify({ totals: { q1: 1000 }, partial: {}, open: "q1" }),
    );
    const third = renderHook(() => useQuestionTimer("quiz:s2", "q2"));
    expect(third.result.current.getTiming("q1")).toEqual({ response_time_ms: 1000, response_time_partial: true });
  });

  it("clearTiming menghapus data tersimpan", () => {
    const { result } = renderHook(() => useQuestionTimer("quiz:s1", "q1"));
    clock = 1000;
    act(() => result.current.clearTiming());
    expect(sessionStorage.getItem("quiz:s1:timing")).toBeNull();
    expect(result.current.getTiming("q1").response_time_ms).toBeNull();
  });
});
