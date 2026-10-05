import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Settings from "./Settings";

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

// NOTE: Settings.jsx belum menghubungkan <label> dengan <input> lewat
// htmlFor/id, jadi getByLabelText belum bisa dipakai. Sementara pakai
// getAllByRole("spinbutton") berdasarkan urutan DOM:
// index 0 = Target soal harian, index 1 = Target menit harian.
// Kalau nanti htmlFor/id ditambahkan, test ini bisa disederhanakan
// pakai getByLabelText.

describe("Settings", () => {
    beforeEach(() => {
        vi.stubGlobal("localStorage", createLocalStorageMock());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("merender tanpa crash", () => {
        renderWithRouter(<Settings />);
    });

    it("menampilkan judul halaman", () => {
        renderWithRouter(<Settings />);
        expect(screen.getByText("Pengaturan")).toBeInTheDocument();
    });

    it("menampilkan nilai default target soal dan menit harian", () => {
        renderWithRouter(<Settings />);
        const [dailyProblemsInput, dailyMinutesInput] = screen.getAllByRole("spinbutton");
        expect(dailyProblemsInput).toHaveValue(10);
        expect(dailyMinutesInput).toHaveValue(15);
    });

    it("mengubah target soal harian saat diketik", () => {
        renderWithRouter(<Settings />);
        const [dailyProblemsInput] = screen.getAllByRole("spinbutton");
        fireEvent.change(dailyProblemsInput, { target: { value: "25" } });
        expect(dailyProblemsInput).toHaveValue(25);
    });

    it("mengubah target menit harian saat diketik", () => {
        renderWithRouter(<Settings />);
        const [, dailyMinutesInput] = screen.getAllByRole("spinbutton");
        fireEvent.change(dailyMinutesInput, { target: { value: "30" } });
        expect(dailyMinutesInput).toHaveValue(30);
    });

    it("menampilkan 3 pilihan jenjang belajar (SD, SMP, SMA)", () => {
        renderWithRouter(<Settings />);
        expect(screen.getByRole("button", { name: "SD" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "SMP" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "SMA" })).toBeInTheDocument();
    });

    it("mengganti jenjang aktif saat tombol jenjang lain diklik", () => {
        renderWithRouter(<Settings />);
        const smaButton = screen.getByRole("button", { name: "SMA" });
        const smpButton = screen.getByRole("button", { name: "SMP" });

        // Default: SMA aktif (sesuai data user.track)
        expect(smaButton).toHaveClass("border-primary");

        fireEvent.click(smpButton);
        expect(smpButton).toHaveClass("border-primary");
        expect(smaButton).not.toHaveClass("border-primary");
    });

    it('menampilkan teks "Tersimpan!" setelah tombol simpan diklik', () => {
        renderWithRouter(<Settings />);
        const saveButton = screen.getByRole("button", { name: /simpan perubahan/i });

        fireEvent.click(saveButton);
        expect(screen.getByText("Tersimpan!")).toBeInTheDocument();
    });

    it("menampilkan email user di section akun", () => {
        renderWithRouter(<Settings />);
        expect(screen.getByText("guest@mathmentor.app")).toBeInTheDocument();
    });

    it("menampilkan tombol keluar (logout)", () => {
        renderWithRouter(<Settings />);
        expect(screen.getByRole("button", { name: /keluar/i })).toBeInTheDocument();
    });
});