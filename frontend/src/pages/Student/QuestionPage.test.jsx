import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom";
import API from "../../api/axios";
import QuestionPage from "./QuestionPage";
import QuestionReviewPage from "./QuestionReviewPage";

vi.mock("../../components/Navbar", () => ({
  default: () => <div aria-hidden="true" />,
}));

vi.mock("../../api/axios", () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const firstPretestQuestion = {
  question_id: "pretest-q1",
  question_text: "Soal pretest pertama",
  options: [
    { option_id: "A", text: "Pilihan satu" },
    { option_id: "B", text: "Pilihan dua" },
  ],
};

const secondPretestQuestion = {
  question_id: "pretest-q2",
  question_text: "Soal pretest kedua",
  options: [{ option_id: "A", text: "Pilihan tiga" }],
};

const renderPage = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/quiz" element={<QuestionPage />} />
        <Route path="/review-quiz" element={<QuestionReviewPage />} />
        <Route path="/topik" element={<p>Halaman topik</p>} />
      </Routes>
    </MemoryRouter>,
  );

const selectOption = (text) =>
  fireEvent.click(screen.getByText(text).closest("button"));

beforeEach(() => {
  sessionStorage.clear();
  API.get.mockReset();
  API.post.mockReset();
  API.delete.mockReset();
});

describe("QuestionPage", () => {
  it("mengunci soal pretest mendatang dan membuat jawaban sebelumnya hanya-baca", async () => {
    API.get.mockResolvedValueOnce({
      data: { data: { status: "not_started" } },
    });
    API.post
      .mockResolvedValueOnce({
        data: {
          data: {
            pretest_id: "pretest-1",
            started_at: new Date().toISOString(),
            total_questions: 2,
            first_question: firstPretestQuestion,
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            next_question: secondPretestQuestion,
            next_question_sequence: 2,
            total_questions: 2,
            progress: 50,
          },
        },
      });

    renderPage("/quiz?mode=pretest&babId=bab-1&chapterName=Bab%20Satu");

    expect(await screen.findByText("Soal pretest pertama")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Soal 2, terkunci" }),
    ).toBeDisabled();

    selectOption("Pilihan satu");
    fireEvent.click(screen.getByRole("button", { name: "Selanjutnya" }));

    expect(await screen.findByText("Soal pretest kedua")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Soal 1" }));

    expect(
      screen.getByText("Jawaban sudah dikirim dan tidak dapat diubah."),
    ).toBeInTheDocument();
    expect(screen.getByText("Pilihan satu").closest("button")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Soal 1" })).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(API.post).toHaveBeenNthCalledWith(2, "/pretest/pretest-1/answer", {
      question_id: "pretest-q1",
      selected_answer: "A",
      response_time_ms: expect.any(Number),
      response_time_partial: false,
    });
  });

  it("melanjutkan sesi pretest setelah refresh dan memulihkan riwayat lokal", async () => {
    sessionStorage.setItem(
      "pretest:pretest-1",
      JSON.stringify({
        startedAt: Date.now() - 5000,
        history: [
          {
            sequence: 1,
            question: {
              id: "pretest-q1",
              text: "Soal pretest pertama",
              stage: null,
              options: [
                { id: "A", text: "Pilihan satu" },
                { id: "B", text: "Pilihan dua" },
              ],
              images: [],
            },
            selectedAnswer: "A",
          },
        ],
      }),
    );
    API.get
      .mockResolvedValueOnce({
        data: { data: { status: "active", pretest_id: "pretest-1" } },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            question: secondPretestQuestion,
            sequence: 2,
            total_questions: 2,
          },
        },
      });

    renderPage("/quiz?mode=pretest&babId=bab-1");

    expect(await screen.findByText("Soal pretest kedua")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Soal 1" }));

    expect(screen.getByText("Soal pretest pertama")).toBeInTheDocument();
    expect(screen.getByText("Pilihan satu").closest("button")).toBeDisabled();
    expect(API.get).toHaveBeenNthCalledWith(1, "/pretest/status/bab-1");
    expect(API.get).toHaveBeenNthCalledWith(2, "/pretest/pretest-1/question");
  });

  it("membuka review setelah pretest selesai dan menampilkan jawaban salah", async () => {
    API.get
      .mockResolvedValueOnce({
        data: { data: { status: "not_started" } },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            pretest_id: "pretest-review-1",
            score: 0,
            total_questions: 1,
            correct_answers: 0,
            wrong_answers: 1,
            duration: 125,
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            pretest_id: "pretest-review-1",
            bab_id: "bab-1",
            score: 0,
            total_questions: 1,
            correct_answers: 0,
            wrong_answers: 1,
            duration: 125,
            questions: [
              {
                question_id: "pretest-q1",
                sequence: 1,
                question_text: "Soal pretest pertama",
                options: [
                  { option_id: "A", text: "Pilihan satu" },
                  { option_id: "B", text: "Pilihan dua" },
                ],
                selected_answer: "A",
                correct_answer: "B",
                is_correct: false,
                response_time: 65,
              },
            ],
          },
        },
      });
    API.post
      .mockResolvedValueOnce({
        data: {
          data: {
            pretest_id: "pretest-review-1",
            started_at: new Date().toISOString(),
            total_questions: 1,
            first_question: firstPretestQuestion,
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            is_correct: false,
            next_question: null,
            total_questions: 1,
          },
        },
      })
      .mockResolvedValueOnce({ data: { success: true } });

    renderPage("/quiz?mode=pretest&babId=bab-1&chapterName=Bab%20Satu");
    expect(await screen.findByText("Soal pretest pertama")).toBeInTheDocument();
    selectOption("Pilihan satu");
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findByText("WAKTU PENGERJAAN")).toBeInTheDocument();
    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith("/pretest/pretest-review-1/review");
    });
    expect(await screen.findByText("2:05")).toBeInTheDocument();
    expect(screen.getAllByText("WAKTU PENGERJAAN")).toHaveLength(1);
    expect(screen.queryByText("Waktu pengerjaan")).not.toBeInTheDocument();
    expect(screen.queryByText("1:05")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Pilihan satu").closest("div")).toHaveClass(
        "bg-rose-500",
      );
      expect(screen.getByText("Pilihan dua").closest("div")).toHaveClass(
        "bg-emerald-600",
      );
    });
    expect(API.post).toHaveBeenNthCalledWith(
      3,
      "/pretest/pretest-review-1/submit",
      {},
    );
  });

  it("membolehkan navigasi dan perubahan jawaban kuis sebelum mengirim semuanya", async () => {
    API.get.mockResolvedValueOnce({
      data: {
        data: {
          session_id: "quiz-1",
          subbab_id: "subbab-1",
          correct_count: 1,
          wrong_count: 1,
          total_questions: 2,
          duration: 90,
          questions: [
            {
              question_id: "quiz-q1",
              sequence: 1,
              question_text: "Soal kuis satu",
              options: [
                { option_id: "A", text: "Jawaban A" },
                { option_id: "B", text: "Jawaban B" },
              ],
              selected_answer: "B",
              correct_answer: "A",
              is_correct: false,
              response_time: 30,
            },
            {
              question_id: "quiz-q2",
              sequence: 2,
              question_text: "Soal kuis dua",
              options: [{ option_id: "C", text: "Jawaban C" }],
              selected_answer: "C",
              correct_answer: "C",
              is_correct: true,
              response_time: 60,
            },
          ],
        },
      },
    });
    API.post
      .mockResolvedValueOnce({
        data: {
          data: {
            session_id: "quiz-1",
            started_at: new Date().toISOString(),
            questions: [
              {
                question_id: "quiz-q1",
                question_text: "Soal kuis satu",
                options: [
                  { option_id: "A", text: "Jawaban A" },
                  { option_id: "B", text: "Jawaban B" },
                ],
              },
              {
                question_id: "quiz-q2",
                question_text: "Soal kuis dua",
                options: [{ option_id: "C", text: "Jawaban C" }],
              },
            ],
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            session_id: "quiz-1",
            correct_count: 1,
            total_questions: 2,
            score: 50,
          },
        },
      });

    renderPage("/quiz?mode=quiz&subbabId=subbab-1&topicName=Aljabar");

    expect(await screen.findByText("Soal kuis satu")).toBeInTheDocument();
    selectOption("Jawaban A");
    fireEvent.click(screen.getByRole("button", { name: "Soal 2" }));
    expect(screen.getByText("Soal kuis dua")).toBeInTheDocument();
    selectOption("Jawaban C");
    fireEvent.click(screen.getByRole("button", { name: "Soal 1" }));

    selectOption("Jawaban B");
    fireEvent.click(screen.getByRole("button", { name: "Soal 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findByText("Soal kuis satu")).toBeInTheDocument();
    expect(screen.getByText("WAKTU PENGERJAAN")).toBeInTheDocument();
    expect(screen.getByText("Jawaban A").closest("div")).toHaveClass(
      "bg-emerald-600",
    );
    expect(screen.getByText("Jawaban B").closest("div")).toHaveClass(
      "bg-rose-500",
    );
    expect(API.get).toHaveBeenCalledWith("/quiz/quiz-1/review");
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    fireEvent.click(screen.getByRole("button", { name: "Lihat Hasil" }));
    expect(await screen.findByText("Hasil Quiz")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("1:30")).toBeInTheDocument();
    await waitFor(() => {
      expect(API.post).toHaveBeenNthCalledWith(
        2,
        "/quiz/quiz-1/submit",
        expect.objectContaining({
          answers: [
            expect.objectContaining({
              question_id: "quiz-q1",
              selected_option: "B",
              response_time_ms: expect.any(Number),
              response_time_partial: false,
            }),
            expect.objectContaining({
              question_id: "quiz-q2",
              selected_option: "C",
              response_time_ms: expect.any(Number),
            }),
          ],
          duration: expect.any(Number),
          timing_method: "client_visible_v1",
        }),
      );
    });
  });

  const startActivePretest = () => {
    sessionStorage.setItem(
      "pretest:pretest-9",
      JSON.stringify({ startedAt: Date.now(), history: [] }),
    );
    API.get
      .mockResolvedValueOnce({
        data: { data: { status: "active", pretest_id: "pretest-9" } },
      })
      .mockResolvedValueOnce({
        data: {
          data: { question: firstPretestQuestion, sequence: 1, total_questions: 2 },
        },
      });
    renderPage("/quiz?mode=pretest&babId=bab-1");
  };

  it("keluar sementara tidak membatalkan pretest", async () => {
    startActivePretest();
    fireEvent.click(await screen.findByRole("button", { name: "Keluar dari pengerjaan" }));
    expect(screen.getByText("Keluar dari pretest?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Keluar, lanjutkan nanti" }));

    expect(await screen.findByText("Halaman topik")).toBeInTheDocument();
    expect(API.delete).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("pretest:pretest-9")).not.toBeNull();
  });

  it("membatalkan pretest setelah konfirmasi dan menghapus data lokal", async () => {
    API.delete.mockResolvedValueOnce({ data: { data: { discarded: true } } });
    startActivePretest();
    fireEvent.click(await screen.findByRole("button", { name: "Keluar dari pengerjaan" }));
    fireEvent.click(screen.getByRole("button", { name: "Batalkan pretest" }));
    expect(screen.getByText("Batalkan pretest ini?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ya, batalkan pretest" }));

    expect(await screen.findByText("Halaman topik")).toBeInTheDocument();
    expect(API.delete).toHaveBeenCalledWith("/pretest/pretest-9/discard");
    expect(sessionStorage.getItem("pretest:pretest-9")).toBeNull();
    expect(sessionStorage.getItem("pretest:pretest-9:timing")).toBeNull();
  });

  it("menampilkan error dan tetap di halaman bila pembatalan gagal", async () => {
    API.delete.mockRejectedValueOnce({
      response: { status: 409, data: { message: "Pretest yang sudah selesai tidak dapat dibatalkan." } },
    });
    startActivePretest();
    fireEvent.click(await screen.findByRole("button", { name: "Keluar dari pengerjaan" }));
    fireEvent.click(screen.getByRole("button", { name: "Batalkan pretest" }));
    fireEvent.click(screen.getByRole("button", { name: "Ya, batalkan pretest" }));

    expect(
      await screen.findByText("Pretest yang sudah selesai tidak dapat dibatalkan."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Halaman topik")).not.toBeInTheDocument();
  });

  it("menganggap submit pretest 409 sebagai sudah selesai lalu membuka review", async () => {
    API.get
      .mockResolvedValueOnce({ data: { data: { status: "not_started" } } })
      .mockResolvedValueOnce({
        data: { data: { pretest_id: "pretest-409", score: 100, total_questions: 1, correct_answers: 1 } },
      })
      .mockResolvedValue({ data: { data: { questions: [] } } });
    API.post
      .mockResolvedValueOnce({
        data: {
          data: {
            pretest_id: "pretest-409",
            started_at: new Date().toISOString(),
            total_questions: 1,
            first_question: firstPretestQuestion,
          },
        },
      })
      .mockResolvedValueOnce({
        data: { data: { is_correct: true, next_question: null, total_questions: 1 } },
      })
      .mockRejectedValueOnce({
        response: { status: 409, data: { message: "Pretest ini sudah diselesaikan sebelumnya." } },
      });

    renderPage("/quiz?mode=pretest&babId=bab-1");
    await screen.findByText("Soal pretest pertama");
    selectOption("Pilihan dua");
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith("/pretest/pretest-409/result");
    });
    expect(
      screen.queryByText("Pretest ini sudah diselesaikan sebelumnya."),
    ).not.toBeInTheDocument();
  });
});
