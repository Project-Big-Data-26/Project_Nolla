import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import ChapterCard from "./ChapterCard";

vi.mock("./SubbabItem", () => ({
  default: ({ subbab }) => <div>{subbab.name}</div>,
}));

const chapter = {
  _id: "bab-12",
  display_order: 1,
  name: "Peluang",
  description: "Materi peluang",
  has_pretest: true,
  total_subbab: 1,
  started_subbab: 1,
  progress: 100,
  completed_subbab: 0,
  classRange: "Kelas 12",
  subbab: [
    {
      _id: "subbab-1",
      name: "Aturan Perkalian",
      classReference: "Kelas 12",
      status: "not_started",
    },
  ],
  filteredSubbab: [
    {
      _id: "subbab-1",
      name: "Aturan Perkalian",
      classReference: "Kelas 12",
      status: "not_started",
    },
  ],
};

const SearchAccordionHarness = () => {
  const [collapsedChapters, setCollapsedChapters] = useState(new Set());
  const toggleChapter = (currentChapter, isExpanded) => {
    setCollapsedChapters((previous) => {
      const next = new Set(previous);
      if (isExpanded) next.add(currentChapter._id);
      else next.delete(currentChapter._id);
      return next;
    });
  };

  return (
    <ChapterCard
      chapter={chapter}
      isSearching
      expandedChapters={new Set()}
      collapsedSearchChapters={collapsedChapters}
      toggleChapter={toggleChapter}
      setPretestConfirmChapter={vi.fn()}
      handleViewPretestResult={vi.fn()}
      pretestLoading={false}
      selectedGrade="Kelas 12"
      handleSubtopicAction={vi.fn()}
    />
  );
};

describe("ChapterCard search accordion", () => {
  it("can close and reopen a chapter while search is active", () => {
    render(<SearchAccordionHarness />);

    expect(screen.getByText("1 dari 1 subbab dimulai")).toBeInTheDocument();
    expect(screen.getByText("Aturan Perkalian")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tutup Sub Bab" }));

    expect(screen.queryByText("Aturan Perkalian")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Lihat Sub Bab" }));

    expect(screen.getByText("Aturan Perkalian")).toBeInTheDocument();
  });
});
