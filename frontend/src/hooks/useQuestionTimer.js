import { useCallback, useEffect, useRef } from "react";

// Versi metode pengukuran; harus sama dengan allowlist backend (utils/timing.js).
export const TIMING_METHOD = "client_visible_v1";

const emptyState = () => ({ totals: {}, partial: {}, open: null });

const readState = (key) => {
  try {
    const stored = JSON.parse(sessionStorage.getItem(key));
    if (!stored || typeof stored !== "object") return emptyState();
    return {
      totals: stored.totals ?? {},
      partial: stored.partial ?? {},
      open: stored.open ?? null,
    };
  } catch {
    return emptyState();
  }
};

const writeState = (key, state) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Storage penuh/diblokir: pengukuran tetap berjalan di memori.
  }
};

/**
 * Mengukur waktu tampil setiap soal selama tab terlihat, diakumulasi saat soal
 * dikunjungi ulang dan tahan refresh. Segmen yang tidak sempat ditutup (mis. tab
 * crash) membuat soal tersebut ditandai partial.
 */
const useQuestionTimer = (storageKey, activeQuestionId) => {
  const key = storageKey ? `${storageKey}:timing` : null;
  const stateRef = useRef(emptyState());
  const segmentRef = useRef(null);
  const activeRef = useRef(activeQuestionId);

  useEffect(() => {
    activeRef.current = activeQuestionId;
  }, [activeQuestionId]);

  const persist = useCallback(() => {
    if (!key) return;
    writeState(key, { ...stateRef.current, open: segmentRef.current?.id ?? null });
  }, [key]);

  const closeSegment = useCallback(() => {
    const segment = segmentRef.current;
    if (!segment) return;
    const { totals } = stateRef.current;
    totals[segment.id] = (totals[segment.id] ?? 0) + (performance.now() - segment.startedAt);
    segmentRef.current = null;
    persist();
  }, [persist]);

  const openSegment = useCallback(
    (questionId) => {
      if (!questionId || document.visibilityState === "hidden") return;
      segmentRef.current = { id: questionId, startedAt: performance.now() };
      persist();
    },
    [persist],
  );

  useEffect(() => {
    if (!key) return undefined;
    const restored = readState(key);
    if (restored.open) restored.partial[restored.open] = true;
    restored.open = null;
    stateRef.current = restored;
    writeState(key, restored);
    return () => {
      closeSegment();
    };
  }, [key, closeSegment]);

  useEffect(() => {
    if (!key) return undefined;
    openSegment(activeQuestionId);
    return () => closeSegment();
  }, [key, activeQuestionId, openSegment, closeSegment]);

  useEffect(() => {
    if (!key) return undefined;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") closeSegment();
      else if (!segmentRef.current) openSegment(activeRef.current);
    };
    window.addEventListener("pagehide", closeSegment);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", closeSegment);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [key, openSegment, closeSegment]);

  // Payload sesuai kontrak backend: null berarti tidak terukur, bukan nol.
  const getTiming = useCallback(
    (questionId) => {
      if (segmentRef.current?.id === questionId) {
        closeSegment();
        openSegment(questionId);
      }
      const total = stateRef.current.totals[questionId];
      if (!Number.isFinite(total)) {
        return { response_time_ms: null, response_time_partial: null };
      }
      return {
        response_time_ms: Math.round(total),
        response_time_partial: stateRef.current.partial[questionId] === true,
      };
    },
    [closeSegment, openSegment],
  );

  const clearTiming = useCallback(() => {
    segmentRef.current = null;
    stateRef.current = emptyState();
    if (key) sessionStorage.removeItem(key);
  }, [key]);

  return { getTiming, clearTiming };
};

export default useQuestionTimer;
