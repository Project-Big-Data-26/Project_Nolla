import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import QuestionPage from "./QuestionPage";

function renderPage() {
    return render(
        <MemoryRouter>
            <QuestionPage />
        </MemoryRouter>
    );
}

describe("QuestionPage", () => {
    it("merender tanpa crash", () => {
        renderPage();
    });

    it("menampilkan soal pertama dan progress awal", () => {
        renderPage();
        expect(screen.getByText("Compute ½ + ¼")).toBeInTheDocument();
        expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
    });

    it("menampilkan semua pilihan jawaban soal pertama", () => {
        renderPage();
        expect(screen.getByText("¾")).toBeInTheDocument();
        expect(screen.getByText("⅙")).toBeInTheDocument();
        expect(screen.getByText("⅔")).toBeInTheDocument();
        expect(screen.getByText("½")).toBeInTheDocument();
    });

    it('tombol "Check answer" disabled sebelum ada jawaban dipilih', () => {
        renderPage();
        expect(screen.getByRole("button", { name: "Check answer" })).toBeDisabled();
    });

    it('tombol "Check answer" aktif setelah memilih jawaban', () => {
        renderPage();
        fireEvent.click(screen.getByText("¾").closest("button"));
        expect(
            screen.getByRole("button", { name: "Check answer" })
        ).not.toBeDisabled();
    });

    it("menampilkan feedback benar saat jawaban yang dipilih tepat", () => {
        renderPage();
        fireEvent.click(screen.getByText("¾").closest("button")); // jawaban benar = A ("¾")
        fireEvent.click(screen.getByRole("button", { name: "Check answer" }));

        expect(
            screen.getByText("Great job! Your answer is correct.")
        ).toBeInTheDocument();
        expect(screen.getByText("Step-by-step solution")).toBeInTheDocument();
    });

    it("menampilkan feedback salah beserta jawaban yang benar saat jawaban dipilih keliru", () => {
        renderPage();
        fireEvent.click(screen.getByText("⅙").closest("button")); // jawaban salah (benar = A)
        fireEvent.click(screen.getByRole("button", { name: "Check answer" }));

        expect(screen.getByText(/Not quite\. Correct answer:/)).toBeInTheDocument();
    });

    it("tidak bisa ganti jawaban setelah di-check", () => {
        renderPage();
        const optionA = screen.getByText("¾").closest("button");
        const optionB = screen.getByText("⅙").closest("button");

        fireEvent.click(optionA);
        fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
        fireEvent.click(optionB); // coba ganti jawaban setelah checked

        // tombol berubah jadi "Next question", bukan "Check answer" lagi,
        // menandakan state checked tidak berubah/ter-reset oleh klik opsi lain.
        // Pakai regex karena accessible name tombol sebenarnya "Next question ›"
        // (ada karakter panah di <span> sebelahnya, ikut terhitung sebagai nama tombol).
        expect(
            screen.getByRole("button", { name: /next question/i })
        ).toBeInTheDocument();
    });

    it("menampilkan hint saat tombol Hint diklik, lalu tombolnya disabled", () => {
        renderPage();
        const hintButton = screen.getByRole("button", { name: /hint/i });

        fireEvent.click(hintButton);

        expect(
            screen.getByText("Find a common denominator.")
        ).toBeInTheDocument();
        expect(hintButton).toBeDisabled();
    });

    it("pindah ke soal berikutnya dan reset state saat Skip diklik", () => {
        renderPage();
        fireEvent.click(screen.getByRole("button", { name: /hint/i }));
        fireEvent.click(screen.getByRole("button", { name: "▷ Skip" }));

        expect(screen.getByText("Question 2 of 3")).toBeInTheDocument();
        expect(
            screen.getByText("What is the value of x if x + 5 = 12?")
        ).toBeInTheDocument();
        // hint soal sebelumnya tidak ikut terbawa ke soal baru
        expect(
            screen.queryByText("Find a common denominator.")
        ).not.toBeInTheDocument();
    });

    it('tombol Skip disabled di soal terakhir', () => {
        renderPage();
        // skip 2x untuk sampai ke soal terakhir (soal ke-3 dari 3)
        fireEvent.click(screen.getByRole("button", { name: "▷ Skip" }));
        fireEvent.click(screen.getByRole("button", { name: "▷ Skip" }));

        expect(screen.getByText("Question 3 of 3")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "▷ Skip" })).toBeDisabled();
    });

    it('tombol berubah jadi "Finish" di soal terakhir setelah dijawab', () => {
        renderPage();
        fireEvent.click(screen.getByRole("button", { name: "▷ Skip" }));
        fireEvent.click(screen.getByRole("button", { name: "▷ Skip" }));

        // di soal terakhir, pilih jawaban lalu check
        fireEvent.click(screen.getByText("15").closest("button"));
        fireEvent.click(screen.getByRole("button", { name: "Check answer" }));

        // regex, sama seperti alasan di test sebelumnya (nama tombol asli "Finish ›")
        expect(
            screen.getByRole("button", { name: /finish/i })
        ).toBeInTheDocument();
    });

    it("toggle Timed/Untimed mengganti label dan tampilan timer", () => {
        renderPage();
        expect(screen.getByText("Timed")).toBeInTheDocument();
        expect(screen.getByText("2:35")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /timed/i }));

        expect(screen.getByText("Untimed")).toBeInTheDocument();
        expect(screen.getByText("4:07")).toBeInTheDocument();
    });
});