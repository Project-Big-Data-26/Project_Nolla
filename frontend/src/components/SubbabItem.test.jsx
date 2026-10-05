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
});
