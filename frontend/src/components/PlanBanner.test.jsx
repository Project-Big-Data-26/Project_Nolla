import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PlanBanner from "./PlanBanner";
import { markPremiumActivationNotice } from "../api/subscription";

const freePlan = (trialAvailable = true) => ({
  plan: "free",
  is_trial: false,
  package: null,
  active_until: null,
  trial: { available: trialAvailable, started_at: null, ends_at: null },
  limits: { quiz_sessions_per_subbab: 3 },
});

beforeEach(() => sessionStorage.clear());

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

  it("trial aktif tidak menampilkan banner permanen", () => {
    const until = new Date(Date.now() + 50 * 3_600_000 + 60_000).toISOString();
    const { container } = render(
      <PlanBanner entitlement={{ ...freePlan(false), plan: "premium", is_trial: true, active_until: until }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("premium tanpa penanda aktivasi tidak menampilkan banner permanen", () => {
    const premium = { ...freePlan(true), plan: "premium", active_until: "2026-12-31T00:00:00Z" };
    const { container } = render(<PlanBanner entitlement={{ ...premium, package: "monthly" }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ["monthly", "Premium Bulanan aktif"],
    [null, "Premium aktif"],
  ])("aktivasi %s tampil sekali selama tujuh detik", (packageCode, label) => {
    vi.useFakeTimers();
    try {
      const premium = {
        ...freePlan(true), plan: "premium", package: packageCode,
        active_until: "2026-12-31T00:00:00Z",
      };
      markPremiumActivationNotice();
      const { container, unmount } = render(<PlanBanner entitlement={premium} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(/hingga 31 Desember 2026/)).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(6999));
      expect(screen.getByText(label)).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(1));
      expect(container).toBeEmptyDOMElement();

      unmount();
      const reopened = render(<PlanBanner entitlement={premium} />);
      expect(reopened.container).toBeEmptyDOMElement();
    } finally {
      vi.useRealTimers();
    }
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
