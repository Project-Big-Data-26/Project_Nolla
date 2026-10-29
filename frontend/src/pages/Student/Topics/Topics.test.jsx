import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import API from "../../../api/axios";
import Topics from "./Topics";

const mockedNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return { ...actual, useNavigate: () => mockedNavigate };
});

vi.mock("../../../api/axios", () => ({
    default: { get: vi.fn(), post: vi.fn() },
}));

// Navbar & TopHeader bergantung pada AuthContext; bukan fokus test halaman ini.
vi.mock("../../../components/Navbar", () => ({
    default: () => <div aria-hidden="true" />,
}));
vi.mock("../../../components/TopHeader", () => ({
    default: () => <div />,
}));

// Data diambil dari API (/dashboard/classes dan /dashboard/bab?kelas=N):
// - "Pecahan & Persentase" (Kelas 7): belum pretest -> tombol "Mulai Pretest"
// - "Geometri Dasar" (Kelas 8): sudah pretest -> tombol "Lihat Sub Bab"
const classes = [
    { name: "Kelas 7", nomor_kelas: 7 },
    { name: "Kelas 8", nomor_kelas: 8 },
];

const babByKelas = {
    7: [
        {
            id: "bab-pecahan",
            name: "Pecahan & Persentase",
            description: "Memahami konsep pecahan dan persentase",
            has_pretest: false,
            total_subbab: 2,
            started_subbab: 0,
            completed_subbab: 0,
            progress: 0,
            subbab: [
                { id: "sub-1", name: "Pengenalan Pecahan", started: false, completed: false },
                { id: "sub-2", name: "Operasi Pecahan", started: false, completed: false },
            ],
        },
    ],
    8: [
        {
            id: "bab-geometri",
            name: "Geometri Dasar",
            description: "Mempelajari bentuk dan bangun ruang dasar",
            has_pretest: true,
            total_subbab: 1,
            started_subbab: 1,
            completed_subbab: 0,
            progress: 30,
            subbab: [
                { id: "sub-3", name: "Bangun Datar", started: true, completed: false },
            ],
        },
    ],
};

function renderPage() {
    return render(
        <MemoryRouter>
            <Topics />
        </MemoryRouter>
    );
}

async function renderLoaded() {
    renderPage();
    await screen.findByText("Pecahan & Persentase");
}

describe("Topics", () => {
    beforeEach(() => {
        mockedNavigate.mockReset();
        sessionStorage.clear();
        API.get.mockReset();
        API.get.mockImplementation((path, config) => {
            if (path === "/dashboard/classes") {
                return Promise.resolve({ data: { data: { classes } } });
            }
            if (path === "/dashboard/bab") {
                return Promise.resolve({
                    data: { data: babByKelas[config?.params?.kelas] || [] },
                });
            }
            return Promise.reject(new Error(`Unexpected API request: ${path}`));
        });
    });

    it("merender tanpa crash", async () => {
        renderPage();
        await screen.findByText("Pecahan & Persentase");
    });

    it("menampilkan judul semua bab dari semua kelas", async () => {
        await renderLoaded();
        expect(screen.getByText("Pecahan & Persentase")).toBeInTheDocument();
        expect(screen.getByText("Geometri Dasar")).toBeInTheDocument();
    });

    it("subbab belum terlihat di awal dan muncul setelah klik Lihat Sub Bab", async () => {
        await renderLoaded();
        expect(screen.queryByText("Bangun Datar")).not.toBeInTheDocument();
        // SubbabItem merender nama dua kali (varian mobile & desktop)
    // Bab yang belum pretest tidak punya tombol Lihat Sub Bab
        expect(screen.getAllByRole("button", { name: /Lihat Sub Bab/ })).toHaveLength(1);

        fireEvent.click(screen.getByRole("button", { name: /Lihat Sub Bab/ }));

        expect((await screen.findAllByText("Bangun Datar")).length).toBeGreaterThan(0);
        expect(screen.getByRole("button", { name: /Tutup Sub Bab/ })).toBeInTheDocument();
    });

    it("bab yang belum pretest menampilkan tombol Mulai Pretest", async () => {
        await renderLoaded();
        expect(screen.getByRole("button", { name: /Mulai Pretest/ })).toBeInTheDocument();
    });

    it("klik Mulai Pretest memunculkan modal konfirmasi, bisa dibatalkan", async () => {
        await renderLoaded();
        fireEvent.click(screen.getByRole("button", { name: /Mulai Pretest/ }));

        expect(screen.getByText("Mulai Diagnostic Pretest")).toBeInTheDocument();
        expect(screen.getByText("BAB: Pecahan & Persentase")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Batal" }));
        expect(screen.queryByText("Mulai Diagnostic Pretest")).not.toBeInTheDocument();
        expect(mockedNavigate).not.toHaveBeenCalled();
    });

    it("konfirmasi pretest mengarahkan ke halaman kuis mode pretest", async () => {
        await renderLoaded();
        fireEvent.click(screen.getByRole("button", { name: /Mulai Pretest/ }));
        fireEvent.click(
            screen.getByRole("button", { name: /Mulai atau Lanjutkan Pretest/ })
        );

        expect(mockedNavigate).toHaveBeenCalledWith(
            "/quiz?mode=pretest&babId=bab-pecahan&chapterName=Pecahan%20%26%20Persentase"
        );
    });

    it("filter Kelas 8 lewat dropdown Filters hanya memuat bab kelas tsb", async () => {
        await renderLoaded();
        fireEvent.click(screen.getByTitle("Filter Berdasarkan Kelas"));
        fireEvent.click(screen.getByRole("button", { name: "Kelas 8" }));

        await waitFor(() =>
            expect(screen.queryByText("Pecahan & Persentase")).not.toBeInTheDocument()
        );
        expect(screen.getByText("Geometri Dasar")).toBeInTheDocument();
        expect(API.get).toHaveBeenCalledWith(
            "/dashboard/bab",
            expect.objectContaining({ params: { kelas: 8 } })
        );
    });

    it("search menyaring bab yang cocok dan otomatis menampilkan subbabnya", async () => {
        await renderLoaded();
        fireEvent.change(screen.getByPlaceholderText(/Cari bab atau topik pembelajaran/i), {
            target: { value: "Bangun" },
        });

        // Bab yang sudah pretest otomatis terbuka saat pencarian cocok dengan subbab
        expect((await screen.findAllByText("Bangun Datar")).length).toBeGreaterThan(0);
        expect(screen.getByText("Geometri Dasar")).toBeInTheDocument();
        expect(screen.queryByText("Pecahan & Persentase")).not.toBeInTheDocument();
    });

    it("search tanpa hasil menampilkan pesan kosong dan tombol reset mengembalikan tampilan", async () => {
        await renderLoaded();
        fireEvent.change(screen.getByPlaceholderText(/Cari bab atau topik pembelajaran/i), {
            target: { value: "zzzxxx" },
        });

        expect(await screen.findByText("Tidak ada BAB yang cocok")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Reset Filter/ }));
        expect(await screen.findByText("Pecahan & Persentase")).toBeInTheDocument();
        expect(screen.getByText("Geometri Dasar")).toBeInTheDocument();
    });

    it("menampilkan pesan error bila daftar BAB gagal dimuat", async () => {
        API.get.mockImplementation((path) => {
            if (path === "/dashboard/classes") {
                return Promise.resolve({ data: { data: { classes: [] } } });
            }
            return Promise.reject({ response: { data: { message: "Server error" } } });
        });
        renderPage();
        expect(await screen.findByText("Server error")).toBeInTheDocument();
    });
});
