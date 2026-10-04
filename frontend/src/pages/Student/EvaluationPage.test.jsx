import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../../context/AuthContext";
import "@testing-library/jest-dom";
import EvaluationPage from "./EvaluationPage";

function renderPage() {
    return render(
        <MemoryRouter><AuthProvider>
            <EvaluationPage />
        </AuthProvider></MemoryRouter>
    );
}

describe("EvaluationPage", () => {
    it("merender tanpa crash", () => {
        renderPage();
    });

    it("menampilkan header halaman", () => {
        renderPage();
        expect(screen.getByText("Evaluasi Pretest")).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "Hasil Evaluasi" })
        ).toBeInTheDocument();
        expect(
            screen.getByText("Berikut adalah hasil pengerjaan pretest kamu.")
        ).toBeInTheDocument();
    });

    it('menampilkan section "Nilai Pretest" dengan skor 60 dari 100 poin', () => {
        renderPage();
        expect(screen.getByText("NILAI PRETEST")).toBeInTheDocument();
        expect(screen.getByText("60")).toBeInTheDocument();
        expect(screen.getByText("dari 100 poin")).toBeInTheDocument();
    });

    it("menampilkan statistik jawaban benar dan salah", () => {
        renderPage();

        expect(screen.getByText("Jawaban Benar")).toBeInTheDocument();
        expect(screen.getByText("6")).toBeInTheDocument();

        expect(screen.getByText("Jawaban Salah")).toBeInTheDocument();
        expect(screen.getByText("4")).toBeInTheDocument();
    });

    it("menampilkan rekomendasi materi prasyarat karena nilai di bawah 70", () => {
        renderPage();

        expect(
            screen.getByText("Rekomendasi Materi Prasyarat")
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "Nilai pretest kamu masih perlu ditingkatkan. Sebaiknya pelajari kembali materi berikut sebelum melanjutkan."
            )
        ).toBeInTheDocument();
        expect(screen.getByText("Operasi Bilangan Dasar")).toBeInTheDocument();
        expect(
            screen.getByText("Materi prasyarat yang direkomendasikan")
        ).toBeInTheDocument();
    });

    // CATATAN: `score`, `correct`, `incorrect` di EvaluationPage.jsx masih data
    // dummy hardcode (score = 60), dan `isLowScore` (score < 70) selalu bernilai
    // true dengan data saat ini. Jadi skenario "nilai tinggi -> rekomendasi TIDAK
    // muncul" belum bisa ditest di sini sampai halaman ini menerima skor secara
    // dinamis (misal lewat props atau data dari backend).
});