import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../../context/AuthContext";
import "@testing-library/jest-dom";
import Dashboard from "./Dashboard";

function renderPage() {
    return render(
        <MemoryRouter><AuthProvider>
            <Dashboard />
        </AuthProvider></MemoryRouter>
    );
}

describe("Dashboard", () => {
    it("merender tanpa crash", () => {
        renderPage();
    });

    it("menampilkan header sambutan", () => {
        renderPage();
        expect(
            screen.getByText("Selamat Datang, User! 👋")
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "Berikut adalah ringkasan aktivitas pembelajaran kamu hari ini."
            )
        ).toBeInTheDocument();
    });

    it("menampilkan 4 kartu statistik: streak, poin, akurasi, waktu belajar", () => {
        renderPage();

        expect(screen.getByText("Streak Belajar")).toBeInTheDocument();
        expect(screen.getByText("7 Hari")).toBeInTheDocument();

        expect(screen.getByText("Total Poin")).toBeInTheDocument();
        expect(screen.getByText("1.240")).toBeInTheDocument();

        expect(screen.getByText("Akurasi")).toBeInTheDocument();
        expect(screen.getByText("86%")).toBeInTheDocument();

        expect(screen.getByText("Waktu Belajar")).toBeInTheDocument();
        expect(screen.getByText("12,5 jam")).toBeInTheDocument();
    });

    it('menampilkan banner "Lanjutkan Belajar" dengan progress 40%', () => {
        renderPage();

        expect(screen.getByText("LANJUTKAN BELAJAR")).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "Pecahan & Persentase" })
        ).toBeInTheDocument();
        expect(
            screen.getByText("Lanjutkan dari materi terakhir yang kamu pelajari.")
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /lanjutkan/i })
        ).toBeInTheDocument();
    });

    it('menampilkan section "Target Hari Ini" dengan progress 3/5 (60%)', () => {
        renderPage();

        expect(screen.getByText("Target Hari Ini")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.getByText("/5")).toBeInTheDocument();
        expect(screen.getByText("60%")).toBeInTheDocument();
        expect(
            screen.getByText("aktivitas selesai")
        ).toBeInTheDocument();
    });

    it('menampilkan section "Materi yang Sedang Dipelajari" dengan 3 topik dan progress masing-masing', () => {
        renderPage();

        const materiHeading = screen.getByText("Materi yang Sedang Dipelajari");
        const materiSection = materiHeading.closest("section");
        const materiScope = within(materiSection);

        expect(materiScope.getByText("Pecahan & Persentase")).toBeInTheDocument();
        expect(materiScope.getByText("40%")).toBeInTheDocument();

        expect(materiScope.getByText("Operasi Bilangan")).toBeInTheDocument();
        expect(materiScope.getByText("20%")).toBeInTheDocument();

        expect(materiScope.getByText("Geometri Dasar")).toBeInTheDocument();
        expect(materiScope.getByText("65%")).toBeInTheDocument();
    });

    it('menampilkan section "Aktivitas Terbaru" dengan 3 aktivitas beserta waktunya', () => {
        renderPage();

        expect(screen.getByText("Aktivitas Terbaru")).toBeInTheDocument();

        expect(
            screen.getByText("Menyelesaikan kuis Pecahan")
        ).toBeInTheDocument();
        expect(screen.getByText("Hari ini, 10:24")).toBeInTheDocument();

        expect(
            screen.getByText("Memulai materi Geometri Dasar")
        ).toBeInTheDocument();
        expect(screen.getByText("Kemarin, 20:15")).toBeInTheDocument();

        expect(
            screen.getByText("Menyelesaikan Operasi Bilangan")
        ).toBeInTheDocument();
        expect(screen.getByText("Kemarin, 15:40")).toBeInTheDocument();
    });
});