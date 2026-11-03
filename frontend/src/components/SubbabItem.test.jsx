import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import SubbabItem from "./SubbabItem";

const baseSubbab = {
  _id: "subbab-1",
  name: "Aturan Perkalian",
  display_order: 3,
  classReference: "Kelas 12",
  description: "Menggunakan aturan perkalian.",
  current_cognitive_score: 1465,
  current_cognitive_level: "hard",
};

const renderSubbab = (status, cognitiveLevel = baseSubbab.current_cognitive_level) => {
  const handleSubtopicAction = vi.fn();
  render(
    <SubbabItem
      subbab={{
        ...baseSubbab,
        status,
        current_cognitive_level: cognitiveLevel,
      }}
      chapter={{ _id: "bab-1", name: "Peluang" }}
      handleSubtopicAction={handleSubtopicAction}
    />,
  );
  return handleSubtopicAction;
};

describe("SubbabItem adaptive quiz actions", () => {
  it("shows Mulai and the user's Elo score and level for a not-yet-started subbab", () => {
    renderSubbab("not_started");

    expect(screen.getByRole("button", { name: "Mulai" })).toBeInTheDocument();
    expect(screen.getByText(/1465\s*·\s*hard/)).toBeInTheDocument();
  });

  it.each(["easy", "medium", "hard"])(
    "shows the %s cognitive level next to the score",
    (level) => {
      renderSubbab("not_started", level);
      expect(screen.getByText(new RegExp(`1465\\s*·\\s*${level}`))).toBeInTheDocument();
    },
  );

  it("shows Mulai for an active session so the backend can resume it", () => {
    renderSubbab("in_progress");

    expect(screen.getAllByText("Sedang Dipelajari").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Mulai" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lanjutkan" })).not.toBeInTheDocument();
  });

  it("shows Pelajari Lagi when the subbab has a completed attempt", () => {
    renderSubbab("completed");

    expect(screen.getByRole("button", { name: "Pelajari Lagi" })).toBeInTheDocument();
  });

  it("starts the same quiz flow for both Mulai and Pelajari Lagi actions", () => {
    const handleStart = renderSubbab("completed");
    fireEvent.click(screen.getByRole("button", { name: "Pelajari Lagi" }));

    expect(handleStart).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed" }),
      expect.objectContaining({ _id: "bab-1" }),
    );
  });

  it("shows the remaining free quiz quota", () => {
    render(
      <SubbabItem
        subbab={{ ...baseSubbab, status: "in_progress", quiz_sessions_used: 1, quiz_sessions_limit: 3 }}
        chapter={{ _id: "bab-1", name: "Peluang" }}
        handleSubtopicAction={vi.fn()}
      />,
    );
    expect(screen.getByText("Sisa kuis: 2 dari 3")).toBeInTheDocument();
  });

  it("marks an exhausted quota without blocking resume of an active session", () => {
    const handleStart = vi.fn();
    render(
      <SubbabItem
        subbab={{ ...baseSubbab, status: "in_progress", quiz_sessions_used: 4, quiz_sessions_limit: 3 }}
        chapter={{ _id: "bab-1", name: "Peluang" }}
        handleSubtopicAction={handleStart}
      />,
    );
    expect(screen.getByText("Kuota kuis paket Free untuk subbab ini habis")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mulai" }));
    expect(handleStart).toHaveBeenCalled();
  });

  it("hides the quota for premium and shows the premium note in a locked bab", () => {
    const { rerender } = render(
      <SubbabItem
        subbab={{ ...baseSubbab, status: "not_started", quiz_sessions_used: 5, quiz_sessions_limit: null }}
        chapter={{ _id: "bab-1", name: "Peluang" }}
        handleSubtopicAction={vi.fn()}
      />,
    );
    expect(screen.queryByText(/Sisa kuis|Kuota kuis/)).not.toBeInTheDocument();

    rerender(
      <SubbabItem
        subbab={{ ...baseSubbab, status: "not_started", quiz_sessions_used: 0, quiz_sessions_limit: 3 }}
        chapter={{ _id: "bab-1", name: "Peluang", locked: true }}
        handleSubtopicAction={vi.fn()}
      />,
    );
    expect(screen.getByText("Kuis baru di bab ini khusus Premium")).toBeInTheDocument();
    expect(screen.queryByText(/Sisa kuis/)).not.toBeInTheDocument();
  });
});
