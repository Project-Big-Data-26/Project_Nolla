import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom";
import API from "../../../api/axios";
import Topics from "./Topics";

vi.mock("../../../api/axios", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

vi.mock("../../../components/Navbar", () => ({
  default: () => <div aria-hidden="true" />,
}));
vi.mock("../../../components/TopHeader", () => ({
  default: () => <div />,
}));
vi.mock("../../../components/SearchBar", () => ({
  default: ({
    searchQuery,
    setSearchQuery,
    selectedGrade,
    setSelectedGrade,
    availableGradeFilters,
  }) => (
    <div>
      <input
        aria-label="Search topics"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
      />
      <select
        aria-label="Grade"
        value={selectedGrade}
        onChange={(event) => setSelectedGrade(event.target.value)}
      >
        {availableGradeFilters.map((grade) => (
          <option key={grade} value={grade}>
            {grade}
          </option>
        ))}
      </select>
    </div>
  ),
}));
vi.mock("../../../components/ChapterCard", () => ({
  default: ({ chapter }) => (
    <article data-testid={`chapter-card-${chapter._id}`}>
      <h2>{chapter.name}</h2>
    </article>
  ),
}));
beforeEach(() => {
  sessionStorage.clear();
  API.get.mockReset();
  API.get.mockImplementation((path) => {
    if (path === "/dashboard/classes") {
      return Promise.resolve({
        data: {
          data: {
            classes: [
              { name: "Kelas 12", nomor_kelas: 12 },
              { name: "Kelas 11", nomor_kelas: 11 },
            ],
          },
        },
      });
    }
    if (path === "/dashboard/bab") {
      return Promise.resolve({
        data: {
          data: [
            {
              id: "bab-a",
              name: "Peluang A",
              has_pretest: true,
              total_subbab: 2,
              started_subbab: 1,
              completed_subbab: 0,
              progress: 50,
              subbab: [
                {
                  id: "sub-a",
                  name: "Aturan A",
                  started: true,
                  completed: false,
                },
                {
                  id: "sub-a2",
                  name: "Aturan A2",
                  started: false,
                  completed: false,
                },
              ],
            },
            {
              id: "bab-b",
              name: "Peluang B",
              has_pretest: true,
              total_subbab: 2,
              started_subbab: 2,
              completed_subbab: 2,
              progress: 100,
              subbab: [
                {
                  id: "sub-b",
                  name: "Aturan B",
                  started: true,
                  completed: true,
                },
                {
                  id: "sub-b2",
                  name: "Aturan B2",
                  started: true,
                  completed: true,
                },
              ],
            },
          ],
        },
      });
    }
    if (path === "/pretest/pretest-1/result") {
      return Promise.resolve({
        data: {
          data: {
            score: 80,
            correct_answers: 4,
            wrong_answers: 1,
            duration: 60,
            prerequisite_bab_result: [
              { name: "Operasi Bilangan Dasar", status: "tidak terpenuhi" },
            ],
            submateri_result: [
              {
                subbab_name: "Peluang Suatu Kejadian",
                current_cognitive_level: "medium",
                current_cognitive_score: "1000/1400",
              },
            ],
            recommendation: "Lanjutkan belajar.",
          },
        },
      });
    }
    throw new Error(`Unexpected API request: ${path}`);
  });
});

describe("Topics pretest result handoff", () => {
  it("fetches and opens the existing result modal from review navigation", async () => {
    sessionStorage.setItem(
      "topics:return-state",
      JSON.stringify({ searchQuery: "Peluang", selectedGrade: "Kelas 12" }),
    );

    render(
      <MemoryRouter
        initialEntries={[
          "/topik?pretestResultId=pretest-1&babId=bab-b&chapterName=Peluang%20B",
        ]}
      >
        <Routes>
          <Route path="/topik" element={<Topics />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Hasil Diagnostic Pretest"),
    ).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("Breakdown Prasyarat")).toBeInTheDocument();
    expect(screen.getByText("Operasi Bilangan Dasar")).toBeInTheDocument();
    expect(screen.getByText("Tidak Terpenuhi")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.queryByText("Easy")).not.toBeInTheDocument();
    expect(await screen.findByLabelText("Search topics")).toHaveValue(
      "Peluang",
    );
    expect(screen.getByLabelText("Grade")).toHaveValue("Kelas 12");
    const chapterCards = screen.getAllByTestId(/^chapter-card-/);
    expect(chapterCards[0]).toHaveAttribute(
      "data-testid",
      "chapter-card-bab-a",
    );
    expect(chapterCards[1]).toHaveAttribute(
      "data-testid",
      "chapter-card-bab-b",
    );
    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith(
        "/pretest/pretest-1/result",
        expect.any(Object),
      );
    });
  });
});
