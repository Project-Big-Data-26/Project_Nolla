import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import PersonalizationProfile from "./PersonalizationProfile";

// TopHeader sekarang baca localStorage.getItem("user_name") langsung
// (bukan lewat props lagi). Di beberapa environment Node (22+ dengan
// --experimental-webstorage), localStorage bawaan bisa rusak/nggak
// lengkap kalau tidak dikonfigurasi dengan file path yang valid, makanya
// di-stub manual pakai implementasi in-memory sendiri biar konsisten di
// semua environment.
function createLocalStorageMock() {
    let store = {};
    return {
        getItem: (key) => (key in store ? store[key] : null),
        setItem: (key, value) => {
            store[key] = String(value);
        },
        removeItem: (key) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
}

function renderWithRouter(ui) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("PersonalizationProfile", () => {
    beforeEach(() => {
        vi.stubGlobal("localStorage", createLocalStorageMock());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

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