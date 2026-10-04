import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import API from "../../../api/axios";
import TopicDetailPage from "./TopicDetailPage";

vi.mock("../../../api/axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("../../../components/Navbar", () => ({
  default: () => null,
}));

describe("TopicDetailPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads learning results and displays backend summary and BAB progress", async () => {
    API.get.mockResolvedValue({
      data: {
        summary: {
          completed_bab: 1,
          in_progress_bab: 1,
        },
        data: [
          {
            id: "bab-1",
            name: "Peluang",
            description: "Memahami konsep peluang.",
            display_order: 1,
            class_reference: "Kelas 12",
            progress: 100,
            total_subbab: 3,
            started_subbab: 2,
            completed_subbab: 3,
            status: "completed",
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <TopicDetailPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Peluang")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("2 dari 3 subbab dimulai")).toBeInTheDocument();
    expect(screen.getByText("3 dari 3 subbab selesai")).toBeInTheDocument();
    expect(screen.getByText("Kelas 12")).toBeInTheDocument();
    expect(API.get).toHaveBeenCalledWith("/learning-results");
  });

  it("shows an error when the learning results request fails", async () => {
    API.get.mockRejectedValue({
      response: { data: { message: "Server tidak tersedia." } },
    });

    render(
      <MemoryRouter>
        <TopicDetailPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Server tidak tersedia.")).toBeInTheDocument();
  });
});
