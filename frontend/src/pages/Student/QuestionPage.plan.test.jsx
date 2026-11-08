import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom";
import API from "../../api/axios";
import QuestionPage from "./QuestionPage";

vi.mock("../../components/Navbar", () => ({ default: () => <div aria-hidden="true" /> }));
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));
vi.mock("../../api/axios", () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const FREE = {
  plan: "free",
  is_trial: false,
  active_until: null,
  trial: { available: true, started_at: null, ends_at: null },
  limits: { quiz_sessions_per_subbab: 3 },
};

const CATALOG = {
  currency: "IDR",
  purchasable: false,
  plans: [
    {
      code: "yearly", name: "Premium Tahunan", duration_days: 365, price: 399000,
      discount: { type: "flat", value: 100000, amount: 100000 }, final_price: 299000,
    },
  ],
};

const forbidden = (code, message, data) =>
  Object.assign(new Error("403"), {
    response: { status: 403, data: { statusCode: 403, success: false, code, message, data } },
  });

const renderPage = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/quiz" element={<QuestionPage />} />
        <Route path="/topik" element={<p>Halaman topik</p>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  sessionStorage.clear();
  API.get.mockReset();
  API.post.mockReset();
  API.delete.mockReset();
});

describe("QuestionPage — blokir paket", () => {
  it("kuota habis: panel khusus, trial lalu memulai ulang kuis", async () => {
    API.get.mockImplementation((path) => {
      if (path === "/subscription/me") return Promise.resolve({ data: { data: FREE } });
      if (path === "/subscription/plans") return Promise.resolve({ data: { data: CATALOG } });
      return Promise.reject(new Error(path));
    });
    API.post.mockImplementation((path) => {
      if (path === "/quiz/start") {
        return Promise.reject(
          forbidden("QUIZ_LIMIT_REACHED", "Batas 3 sesi kuis tercapai", { used: 3, limit: 3 }),
        );
      }
      return Promise.reject(new Error(path));
    });

    renderPage("/quiz?mode=quiz&subbabId=sub-1&topicName=Pecahan");

    expect(await screen.findByText("Kuota kuis habis")).toBeInTheDocument();
    expect(screen.getByText(/kuis 3 kali per subbab/)).toBeInTheDocument();
    expect(screen.queryByText("Sesi soal tidak dapat dimuat")).not.toBeInTheDocument();
    expect(await screen.findByText("Premium Tahunan")).toBeInTheDocument();
    expect(screen.getByText("Rp299.000")).toBeInTheDocument();
    expect(screen.getByText("Hemat Rp100.000")).toBeInTheDocument();
    const trialButton = await screen.findByRole("button", { name: /Coba Premium 3 Hari Gratis/ });

    API.post.mockImplementation((path) => {
      if (path === "/subscription/trial") {
        return Promise.resolve({ data: { data: { ...FREE, plan: "premium", is_trial: true } } });
      }
      if (path === "/quiz/start") {
        return Promise.resolve({
          data: {
            data: {
              session_id: "quiz-9",
              started_at: new Date().toISOString(),
              questions: [
                { question_id: "q1", question_text: "Soal setelah trial", options: [{ option_id: "A", text: "Satu" }] },
              ],
            },
          },
        });
      }
      return Promise.reject(new Error(path));
    });
    fireEvent.click(trialButton);
    expect(screen.queryByText("Kuota kuis habis")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Kembali ke topik" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Aktifkan Trial/ }));

    expect(await screen.findByText("Soal setelah trial")).toBeInTheDocument();
    expect(API.post.mock.calls.filter(([path]) => path === "/quiz/start")).toHaveLength(2);
  });

  it("bab terkunci pada pretest: pesan server, tanpa tombol trial bila sudah dipakai", async () => {
    API.get.mockImplementation((path) => {
      if (path === "/pretest/status/bab-9") {
        return Promise.resolve({ data: { data: { status: "not_started", locked: true } } });
      }
      if (path === "/subscription/me") {
        return Promise.resolve({ data: { data: { ...FREE, trial: { ...FREE.trial, available: false } } } });
      }
      if (path === "/subscription/plans") return Promise.resolve({ data: { data: CATALOG } });
      if (path === "/subscription/plans") return Promise.resolve({ data: { data: CATALOG } });
      return Promise.reject(new Error(path));
    });
    API.post.mockRejectedValue(forbidden("PREMIUM_REQUIRED", "Bab ini khusus premium."));

    renderPage("/quiz?mode=pretest&babId=bab-9&chapterName=Peluang");

    expect(await screen.findByText("Materi khusus Premium")).toBeInTheDocument();
    expect(screen.getByText("Bab ini khusus premium.")).toBeInTheDocument();
    expect(await screen.findByText(/Trial premium sudah digunakan/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Coba Premium/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Kembali ke topik" }));
    expect(await screen.findByText("Halaman topik")).toBeInTheDocument();
  });

  it("403 lama tanpa code tetap memakai panel error umum", async () => {
    API.post.mockRejectedValue(
      Object.assign(new Error("403"), {
        response: { status: 403, data: { message: "Subbab belum tersedia untuk quiz" } },
      }),
    );
    renderPage("/quiz?mode=quiz&subbabId=sub-1&topicName=Pecahan");

    expect(await screen.findByText("Sesi soal tidak dapat dimuat")).toBeInTheDocument();
    expect(screen.getByText("Subbab belum tersedia untuk quiz")).toBeInTheDocument();
    await waitFor(() =>
      expect(API.get).not.toHaveBeenCalledWith("/subscription/me"),
    );
    expect(API.get).not.toHaveBeenCalledWith("/subscription/plans");
  });
});
