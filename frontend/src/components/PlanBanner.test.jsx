import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PlanBanner from "./PlanBanner";

const freePlan = (trialAvailable = true) => ({
  plan: "free",
  is_trial: false,
  package: null,
  active_until: null,
  trial: { available: trialAvailable, started_at: null, ends_at: null },
  limits: { quiz_sessions_per_subbab: 3 },
});

describe("PlanBanner", () => {
  it("tidak merender apa pun untuk free atau tanpa entitlement", () => {
    const { container, rerender } = render(<PlanBanner entitlement={null} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<PlanBanner entitlement={freePlan()} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<PlanBanner entitlement={freePlan(false)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("fitur paket nonaktif: tidak ada banner walau plan premium", () => {
    const { container } = render(
      <PlanBanner entitlement={{ ...freePlan(false), plan: "premium", feature_enabled: false }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("trial aktif menampilkan sisa waktu", () => {
    const until = new Date(Date.now() + 50 * 3_600_000 + 60_000).toISOString();
    render(
      <PlanBanner entitlement={{ ...freePlan(false), plan: "premium", is_trial: true, active_until: until }} />,
    );
    expect(screen.getByText("Trial Premium aktif")).toBeInTheDocument();
    expect(screen.getByText(/sisa 2 hari 2 jam/)).toBeInTheDocument();
  });

  it("premium menampilkan nama paket dan tanggal berakhir", () => {
    const premium = { ...freePlan(true), plan: "premium", active_until: "2026-12-31T00:00:00Z" };
    const { rerender } = render(<PlanBanner entitlement={{ ...premium, package: "monthly" }} />);
    expect(screen.getByText("Premium Bulanan aktif")).toBeInTheDocument();
    expect(screen.getByText(/hingga 31 Desember 2026/)).toBeInTheDocument();

    rerender(<PlanBanner entitlement={{ ...premium, package: null }} />);
    expect(screen.getByText("Premium aktif")).toBeInTheDocument();
  });

  it("memanggil onExpired sekali saat masa premium habis", () => {
    vi.useFakeTimers();
    try {
      const onExpired = vi.fn();
      const until = new Date(Date.now() + 30_000).toISOString();
      render(
        <PlanBanner
          entitlement={{ ...freePlan(false), plan: "premium", is_trial: true, active_until: until }}
          onExpired={onExpired}
        />,
      );
      expect(onExpired).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(60_000));
      act(() => vi.advanceTimersByTime(60_000));
      expect(onExpired).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
