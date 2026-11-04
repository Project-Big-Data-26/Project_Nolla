import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom";
import API from "../../api/axios";
import { track } from "../../analytics/client";
import StagingQuestionReviewPage from "./StagingQuestionReviewPage";
import { StagingCheckRoute } from "./StagingSoalBrowser";

vi.mock("../../components/Navbar", () => ({
  default: () => <div aria-hidden="true" />,
}));

vi.mock("../../api/axios", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock("../../analytics/client", () => ({
  track: vi.fn(),
  createClientId: () => "id",
}));

const unchecked = { value: null, checked_at: null, stale: false };

const item = (overrides = {}) => ({
  question_id: "soal-1",
  sequence: 1,
  subbab_id: "subbab-1",
  question_text: "Hitung $\\frac{1}{2}$",
  soal_type: "multiple_choice",
  options: [
    { option_id: "A", text: "Pilihan A" },
    { option_id: "B", text: "Pilihan B" },
  ],
  image_url: [],
  cognitive_level: "hard",
  stored_cognitive_level: "hard",
  cognitive_score: null,
  status: "active",
  correct_answer: "B",
  selected_answer: null,
  is_correct: null,
  check: { question: unchecked, review: unchecked },
  ...overrides,
});

const subbabResponse = (questions) => ({
  data: {
    data: {
      subbab_id: "subbab-1",
      subbab_name: "Pecahan",
      summary: {},
      questions,
    },
  },
});

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/staging/cek-soal" element={<StagingCheckRoute />} />
        <Route
          path="/staging/cek-soal/review"
          element={<StagingQuestionReviewPage />}
        />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  sessionStorage.clear();
  API.get.mockReset();
  API.post.mockReset();
  API.patch.mockReset();
  track.mockReset();
});

describe("Pintu cek soal staging", () => {
  it("pintu 1: label soal_id & level, approve halaman soal tanpa sesi kuis atau analytics", async () => {
    API.get.mockResolvedValueOnce(
      subbabResponse([
        item(),
        item({
          question_id: "soal-2",
          sequence: 2,
          cognitive_level: "medium",
          stored_cognitive_level: null,
        }),
      ]),
    );
    API.patch.mockResolvedValueOnce({
      data: {
        data: {
          question: item({
            check: {
              question: { value: true, checked_at: "2026-11-04T00:00:00Z", stale: false },
              review: unchecked,
            },
          }),
        },
      },
    });

    renderAt("/staging/cek-soal?subbabId=subbab-1");

    expect(await screen.findByText("soal-1")).toBeInTheDocument();
    expect(API.get).toHaveBeenCalledWith("/staging/soal-check/subbab/subbab-1");
    expect(screen.getByText("hard")).toBeInTheDocument();
    expect(screen.getByText(/Halaman soal/)).toBeInTheDocument();
    expect(screen.getByText(/· Belum dicek/)).toBeInTheDocument();
    expect(screen.getByText("STAGING")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tampil benar" }));

    await waitFor(() =>
      expect(API.patch).toHaveBeenCalledWith("/staging/soal-check/soal/soal-1", {
        page: "question",
        value: true,
      }),
    );
    expect(await screen.findByText(/· Tampil benar/)).toBeInTheDocument();

    // Soal kedua: level kosong di database ditandai.
    fireEvent.click(screen.getByRole("button", { name: "Selanjutnya" }));
    expect(await screen.findByText("soal-2")).toBeInTheDocument();
    expect(screen.getByText("level belum diisi")).toBeInTheDocument();

    // Memilih opsi tidak menyimpan apa pun.
    fireEvent.click(screen.getByText("Pilihan A").closest("button"));

    expect(API.post).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
    expect(sessionStorage.length).toBe(0);
  });

  it("soal terakhir menuju review; review menampilkan kunci dan approve halaman review", async () => {
    API.get
      .mockResolvedValueOnce(subbabResponse([item()]))
      .mockResolvedValueOnce(subbabResponse([item()]));
    API.patch.mockResolvedValueOnce({
      data: {
        data: {
          question: item({
            check: {
              question: unchecked,
              review: { value: false, checked_at: "2026-11-04T00:00:00Z", stale: false },
            },
          }),
        },
      },
    });

    renderAt("/staging/cek-soal?subbabId=subbab-1");

    fireEvent.click(await screen.findByRole("button", { name: "Lihat review" }));

    expect(await screen.findByText(/Halaman review/)).toBeInTheDocument();
    expect(screen.getByText("soal-1")).toBeInTheDocument();
    // Kunci B ditandai benar, tanpa jawaban siswa yang salah.
    expect(screen.getByText("Pilihan B").closest("div.w-full")).toHaveClass("bg-emerald-600");
    expect(screen.getByText("Pilihan A").closest("div.w-full")).not.toHaveClass("bg-rose-500");

    fireEvent.click(screen.getByRole("button", { name: "Rusak" }));

    await waitFor(() =>
      expect(API.patch).toHaveBeenCalledWith("/staging/soal-check/soal/soal-1", {
        page: "review",
        value: false,
      }),
    );
    expect(await screen.findByText(/· Rusak/)).toBeInTheDocument();
    expect(track).not.toHaveBeenCalled();
  });

  it("pintu 2: memuat satu soal lewat soalId dan menandai hasil cek usang", async () => {
    API.get.mockResolvedValueOnce({
      data: {
        data: {
          question: item({
            check: {
              question: { value: false, checked_at: "2026-11-03T00:00:00Z", stale: true },
              review: unchecked,
            },
          }),
        },
      },
    });

    renderAt("/staging/cek-soal?soalId=soal-1");

    expect(await screen.findByText("soal-1")).toBeInTheDocument();
    expect(API.get).toHaveBeenCalledWith("/staging/soal-check/soal/soal-1");
    expect(screen.getByText(/Perlu cek ulang/)).toBeInTheDocument();
  });

  it("bukan staging (404 tanpa pesan JSON): pesan pintu tidak tersedia", async () => {
    API.get.mockRejectedValueOnce({ response: { status: 404, data: "<html>" } });

    renderAt("/staging/cek-soal?subbabId=subbab-1");

    expect(await screen.findByText(/APP_ENV=staging/)).toBeInTheDocument();
    expect(API.post).not.toHaveBeenCalled();
  });

  it("review tanpa subbabId/soalId menampilkan pesan", async () => {
    renderAt("/staging/cek-soal/review");

    expect(await screen.findByText(/subbabId atau soalId/)).toBeInTheDocument();
    expect(API.get).not.toHaveBeenCalled();
  });

  it("tanpa subbabId: daftar kelas -> bab -> subbab, cari, dan buka subbab", async () => {
    API.get
      .mockResolvedValueOnce({
        data: {
          data: {
            kelas: [
              {
                kelas_id: "k1",
                name: "Kelas 1",
                jenjang: "SD",
                bab: [
                  {
                    bab_id: "b1",
                    name: "Bilangan",
                    subbab: [
                      {
                        subbab_id: "subbab-1",
                        name: "Pecahan",
                        soal_count: 3,
                        reviewed_count: 1,
                        broken_count: 0,
                      },
                      {
                        subbab_id: "subbab-0",
                        name: "Kosong",
                        soal_count: 0,
                        reviewed_count: 0,
                        broken_count: 0,
                      },
                    ],
                  },
                ],
              },
              { kelas_id: "k7", name: "Kelas 7", jenjang: "SMP", bab: [] },
            ],
          },
        },
      })
      .mockResolvedValueOnce(subbabResponse([item()]));

    renderAt("/staging/cek-soal");

    expect(await screen.findByText(/SD · Kelas 1/)).toBeInTheDocument();
    expect(API.get).toHaveBeenCalledWith("/staging/soal-check/tree");
    expect(screen.getByText("Kosong").closest("a")).toBeNull();

    fireEvent.change(screen.getByLabelText("Cari kelas, bab, atau subbab"), {
      target: { value: "pecah" },
    });
    expect(screen.queryByText(/Kelas 7/)).not.toBeInTheDocument();
    expect(screen.queryByText("Kosong")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Pecahan"));

    expect(await screen.findByText("soal-1")).toBeInTheDocument();
    expect(API.get).toHaveBeenLastCalledWith("/staging/soal-check/subbab/subbab-1");
  });

  it("tanpa subbabId: input soal_id membuka pintu 2", async () => {
    API.get
      .mockResolvedValueOnce({ data: { data: { kelas: [] } } })
      .mockResolvedValueOnce({ data: { data: { question: item() } } });

    renderAt("/staging/cek-soal");

    expect(await screen.findByText("Belum ada data kelas.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Buka satu soal lewat soal_id"), {
      target: { value: " soal-1 " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buka soal" }));

    expect(await screen.findByText("soal-1")).toBeInTheDocument();
    expect(API.get).toHaveBeenLastCalledWith("/staging/soal-check/soal/soal-1");
  });

  it("tanpa subbabId di luar staging: pesan pintu tidak tersedia", async () => {
    API.get.mockRejectedValueOnce({ response: { status: 404, data: "<html>" } });

    renderAt("/staging/cek-soal");

    expect(await screen.findByText(/APP_ENV=staging/)).toBeInTheDocument();
  });

  it("nomor soal dipaginasi per 10 dengan penunjuk posisi / total", async () => {
    const many = Array.from({ length: 23 }, (_, index) =>
      item({ question_id: `soal-${index + 1}`, sequence: index + 1 }),
    );
    API.get.mockResolvedValueOnce(subbabResponse(many));

    renderAt("/staging/cek-soal?subbabId=subbab-1");

    expect(await screen.findByText("1 / 23")).toBeInTheDocument();
    const nav = () => screen.getByLabelText("Navigasi nomor soal");
    const visibleNumbers = () =>
      Array.from(nav().querySelectorAll("button")).map((button) => button.textContent);
    expect(visibleNumbers()).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    expect(screen.getByRole("button", { name: "10 soal sebelumnya" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "10 soal berikutnya" }));
    expect(screen.getByText("11 / 23")).toBeInTheDocument();
    expect(screen.getByText("soal-11")).toBeInTheDocument();
    expect(visibleNumbers()[0]).toBe("11");

    fireEvent.click(screen.getByRole("button", { name: "10 soal berikutnya" }));
    expect(visibleNumbers()).toEqual(["21", "22", "23"]);
    expect(screen.getByRole("button", { name: "10 soal berikutnya" })).toBeDisabled();

    // Selanjutnya dari soal 10 berpindah ke kelompok 11-20.
    fireEvent.click(screen.getByRole("button", { name: "Soal 21" }));
    fireEvent.click(screen.getByRole("button", { name: "10 soal sebelumnya" }));
    fireEvent.click(screen.getByRole("button", { name: "Soal 20" }));
    fireEvent.click(screen.getByRole("button", { name: "10 soal sebelumnya" }));
    fireEvent.click(screen.getByRole("button", { name: "Soal 10" }));
    fireEvent.click(screen.getByRole("button", { name: "Selanjutnya" }));
    expect(screen.getByText("11 / 23")).toBeInTheDocument();
    expect(visibleNumbers()[0]).toBe("11");
  });

  it("review: nomor soal juga dipaginasi per 10 dengan penunjuk", async () => {
    const many = Array.from({ length: 12 }, (_, index) =>
      item({ question_id: `soal-${index + 1}`, sequence: index + 1 }),
    );
    API.get.mockResolvedValueOnce(subbabResponse(many));

    renderAt("/staging/cek-soal/review?subbabId=subbab-1&n=12");

    expect(await screen.findByText("12 / 12")).toBeInTheDocument();
    const buttons = screen
      .getByLabelText("Navigasi nomor soal review")
      .querySelectorAll("button");
    expect(Array.from(buttons).map((button) => button.textContent)).toEqual(["11", "12"]);
  });

  it("pemilih: saring subbab semua / belum direview / sudah direview", async () => {
    const sub = (subbab_id, name, soal_count, reviewed_count, broken_count = 0) => ({
      subbab_id,
      name,
      soal_count,
      reviewed_count,
      broken_count,
    });
    API.get.mockResolvedValueOnce({
      data: {
        data: {
          kelas: [
            {
              kelas_id: "k1",
              name: "Kelas 1",
              jenjang: "SD",
              bab: [
                {
                  bab_id: "b1",
                  name: "Bilangan",
                  subbab: [
                    sub("s-done", "Selesai", 5, 5, 2),
                    sub("s-pending", "Sebagian", 10, 4),
                    sub("s-empty", "Kosong", 0, 0),
                  ],
                },
              ],
            },
            {
              kelas_id: "k2",
              name: "Kelas 2",
              jenjang: "SD",
              bab: [{ bab_id: "b2", name: "Ukuran", subbab: [sub("s-new", "Baru", 3, 0)] }],
            },
          ],
        },
      },
    });

    renderAt("/staging/cek-soal");

    expect(await screen.findByRole("button", { name: "Semua (4)" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Belum direview (2)" })).toBeInTheDocument();
    expect(screen.getByText("5/5 direview")).toBeInTheDocument();
    expect(screen.getByText("2 rusak")).toBeInTheDocument();
    expect(screen.getByText("4/10 direview")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sudah direview (1)" }));
    expect(screen.getByText("Selesai")).toBeInTheDocument();
    expect(screen.queryByText("Sebagian")).not.toBeInTheDocument();
    expect(screen.queryByText("Kosong")).not.toBeInTheDocument();
    expect(screen.queryByText(/Kelas 2/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Belum direview (2)" }));
    expect(screen.getByText("Sebagian")).toBeInTheDocument();
    expect(screen.getByText("Baru")).toBeInTheDocument();
    expect(screen.queryByText("Selesai")).not.toBeInTheDocument();
    expect(screen.queryByText("Kosong")).not.toBeInTheDocument();

    // Saring status + cari digabung.
    fireEvent.change(screen.getByLabelText("Cari kelas, bab, atau subbab"), {
      target: { value: "selesai" },
    });
    expect(screen.getByText("Tidak ada subbab yang cocok.")).toBeInTheDocument();
  });

  describe("filter review / aprove", () => {
    const summary = {
      total: 180,
      question: { unchecked: 150, ok: 20, broken: 5, stale: 5 },
      review: { unchecked: 170, ok: 8, broken: 2, stale: 0 },
    };
    const filteredResponse = (questions) => ({
      data: {
        data: {
          subbab_id: "subbab-1",
          subbab_name: "Peluang",
          summary,
          filter: {},
          questions,
        },
      },
    });

    it("mengirim filter per halaman, menandai filter aktif, dan menampilkan nomor asli", async () => {
      API.get.mockResolvedValueOnce(
        filteredResponse([
          item({ question_id: "soal-57", sequence: 57 }),
          item({ question_id: "soal-90", sequence: 90 }),
        ]),
      );
      API.patch.mockResolvedValueOnce({
        data: {
          data: {
            question: item({
              question_id: "soal-57",
              sequence: 1,
              check: {
                question: { value: true, checked_at: "2026-11-04T00:00:00Z", stale: false },
                review: unchecked,
              },
            }),
          },
        },
      });

      renderAt("/staging/cek-soal?subbabId=subbab-1&review=0");

      expect(await screen.findByText("soal-57")).toBeInTheDocument();
      expect(API.get).toHaveBeenCalledWith(
        "/staging/soal-check/subbab/subbab-1?page=question&review=0",
      );
      expect(screen.getByRole("link", { name: "Belum dicek (155)" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(screen.getByRole("link", { name: "Semua (180)" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Sudah dicek (25)" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Tampil benar (20)" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Rusak (5)" })).toBeInTheDocument();
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
      expect(screen.getByText("No. 57")).toBeInTheDocument();

      // Daftar tetap sampai reload; nomor asli tidak tertimpa respons PATCH.
      fireEvent.click(screen.getByRole("button", { name: "Tampil benar" }));
      expect(await screen.findByText(/· Tampil benar/)).toBeInTheDocument();
      expect(screen.getByText("No. 57")).toBeInTheDocument();
      expect(screen.getByText("1 / 2")).toBeInTheDocument();

      // Pindah ke review membawa filter dan soal yang sama.
      expect(screen.getByRole("link", { name: "Lihat di review" })).toHaveAttribute(
        "href",
        "/staging/cek-soal/review?subbabId=subbab-1&review=0&at=soal-57",
      );
    });

    it("review: memakai status halaman review dan membuka soal dari parameter at", async () => {
      API.get.mockResolvedValueOnce(
        filteredResponse([
          item({ question_id: "soal-10", sequence: 10 }),
          item({ question_id: "soal-57", sequence: 57 }),
        ]),
      );

      renderAt("/staging/cek-soal/review?subbabId=subbab-1&aprove=0&at=soal-57");

      expect(await screen.findByText("soal-57")).toBeInTheDocument();
      expect(API.get).toHaveBeenCalledWith(
        "/staging/soal-check/subbab/subbab-1?page=review&aprove=0",
      );
      expect(screen.getByText("2 / 2")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Rusak (2)" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(screen.getByRole("link", { name: "Lihat di halaman soal" })).toHaveAttribute(
        "href",
        "/staging/cek-soal?subbabId=subbab-1&aprove=0&at=soal-57",
      );
    });

    it("filter tanpa hasil: pesan dan pilihan filter, bukan error; ganti filter memuat ulang", async () => {
      API.get
        .mockResolvedValueOnce(filteredResponse([]))
        .mockResolvedValueOnce(filteredResponse([item({ question_id: "soal-3", sequence: 3 })]));

      renderAt("/staging/cek-soal?subbabId=subbab-1&aprove=0");

      expect(
        await screen.findByText("Tidak ada soal yang cocok dengan filter ini"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Soal tidak dapat dimuat")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("link", { name: "Belum dicek (155)" }));

      expect(await screen.findByText("soal-3")).toBeInTheDocument();
      expect(API.get).toHaveBeenLastCalledWith(
        "/staging/soal-check/subbab/subbab-1?page=question&review=0",
      );
      expect(screen.getByText("No. 3")).toBeInTheDocument();
    });

    it("nilai filter tidak valid di URL diabaikan", async () => {
      API.get.mockResolvedValueOnce(filteredResponse([item()]));

      renderAt("/staging/cek-soal?subbabId=subbab-1&review=2&aprove=ya");

      expect(await screen.findByText("soal-1")).toBeInTheDocument();
      expect(API.get).toHaveBeenCalledWith("/staging/soal-check/subbab/subbab-1");
      expect(screen.getByRole("link", { name: "Semua (180)" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });
  });
});
