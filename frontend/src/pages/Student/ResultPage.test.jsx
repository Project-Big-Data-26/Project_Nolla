import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import ResultPage from "./ResultPage";

function renderPage() {
    return render(
        <MemoryRouter>
            <ResultPage />
        </MemoryRouter>
    );
}

// CATATAN: hasil per soal (pertanyaan, pilihan, pembahasan) dirender lewat
// komponen anak `ResultQuestionCard`, bukan langsung oleh ResultPage. Detail
// tampilan tiap soal sengaja TIDAK ditest di sini (biar tidak terlalu terikat
// ke implementasi internal komponen anak) — akan ditest terpisah lewat file
// test `ResultQuestionCard.test.jsx` sendiri. Test di sini fokus ke bagian
// yang dirender langsung oleh ResultPage: header, ringkasan skor, dan tombol
// navigasi bawah.

describe("ResultPage", () => {
    it("merender tanpa crash", () => {
        renderPage();
    });

    it("menampilkan header halaman", () => {
        renderPage();
        expect(screen.getByText("Hasil Latihan")).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "Hasil Pengerjaan" })
        ).toBeInTheDocument();
        expect(
            screen.getByText("Lihat hasil jawaban kamu pada latihan matematika ini.")
        ).toBeInTheDocument();
    });

    it("menghitung dan menampilkan ringkasan skor dengan benar (nilai 67, benar 2/3)", () => {
        renderPage();

        // dari data dummy: soal 1 & 3 dijawab benar, soal 2 dijawab salah
        // => correctCount = 2, totalQuestions = 3, percentage = round(2/3*100) = 67
        expect(
            screen.getByRole("heading", { name: "Pecahan & Persentase" })
        ).toBeInTheDocument();
        expect(screen.getByText("Nilai")).toBeInTheDocument();
        expect(screen.getByText("67")).toBeInTheDocument();
        expect(screen.getByText("Benar")).toBeInTheDocument();
        expect(screen.getByText("2/3")).toBeInTheDocument();
        expect(screen.getByText("67%")).toBeInTheDocument();
        expect(
            screen.getByText("Persentase jawaban benar")
        ).toBeInTheDocument();
    });

    it('menampilkan section "Detail Jawaban"', () => {
        renderPage();
        expect(screen.getByText("Detail Jawaban")).toBeInTheDocument();
        expect(
            screen.getByText(
                "Periksa jawaban benar dan jawaban yang masih perlu dipelajari."
            )
        ).toBeInTheDocument();
    });

    it('tombol "Kembali ke Latihan" memanggil console.log', () => {
        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { });
        renderPage();

        fireEvent.click(
            screen.getByRole("button", { name: /kembali ke latihan/i })
        );

        expect(consoleSpy).toHaveBeenCalledWith("Kembali ke halaman pengerjaan");

        consoleSpy.mockRestore();
    });

    it('tombol "Lihat Evaluasi" memanggil console.log', () => {
        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { });
        renderPage();

        fireEvent.click(screen.getByRole("button", { name: /lihat evaluasi/i }));

        expect(consoleSpy).toHaveBeenCalledWith("Buka halaman evaluasi");

        consoleSpy.mockRestore();
    });
});