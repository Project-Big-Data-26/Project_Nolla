import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import PersonalizationProfile from "./PersonalizationProfile";

function renderWithRouter(ui) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("PersonalizationProfile", () => {
    it("merender tanpa crash", () => {
        renderWithRouter(<PersonalizationProfile />);
    });

    it("menampilkan nama dan email user", () => {
        renderWithRouter(<PersonalizationProfile />);
        expect(screen.getByText("Pelajar Tamu")).toBeInTheDocument();
        expect(screen.getByText("guest@mathmentor.app")).toBeInTheDocument();
    });

    it("menampilkan level dan track user", () => {
        renderWithRouter(<PersonalizationProfile />);
        expect(screen.getByText(/Pemula · Umum/)).toBeInTheDocument();
    });

    it("menampilkan 4 kartu statistik belajar", () => {
        renderWithRouter(<PersonalizationProfile />);
        expect(screen.getByText("Akurasi keseluruhan")).toBeInTheDocument();
        expect(screen.getByText("Soal terselesaikan")).toBeInTheDocument();
        expect(screen.getByText("Rentetan belajar")).toBeInTheDocument();
        expect(screen.getByText("Poin diperoleh")).toBeInTheDocument();
    });

    it("menampilkan judul section rekomendasi dan lencana", () => {
        renderWithRouter(<PersonalizationProfile />);
        expect(screen.getByText("Rekomendasi untukmu")).toBeInTheDocument();
        expect(screen.getByText("Lencana diperoleh")).toBeInTheDocument();
    });

    it("menampilkan semua item rekomendasi materi", () => {
        renderWithRouter(<PersonalizationProfile />);
        expect(screen.getByText("Pecahan & Persentase")).toBeInTheDocument();
        expect(screen.getByText("Operasi Bilangan")).toBeInTheDocument();
        expect(screen.getByText("Aljabar Dasar")).toBeInTheDocument();
    });

    it("menampilkan lencana yang sudah didapat", () => {
        renderWithRouter(<PersonalizationProfile />);
        expect(screen.getByText("Pemecah Masalah")).toBeInTheDocument();
        expect(screen.getByText("Menyelesaikan 10 soal")).toBeInTheDocument();
    });
});