import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Topics from "./Topics";

// Sama seperti sebelumnya: stub localStorage in-memory biar hasil test
// konsisten di semua environment (Node 22+ punya localStorage bawaan yang
// implementasinya bisa beda-beda / tidak lengkap).
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

// Topics.jsx (versi redesign) bergantung pada beberapa export dari
// "../data/topicsData": allChapters, allGrades, chaptersByLevel,
// gradeFiltersByLevel, educationLevels. Karena localStorage kosong,
// komponen fallback ke jenjang "SMP" (lihat logic userSettingLevel).
// Fixture di bawah dipakai buat memastikan hasil test bisa diprediksi:
// - "Pecahan & Persentase": diagnosticStatus "not_completed" -> tampil
//   tombol "Mulai Pretest", subbab-nya BELUM terlihat sampai pretest
//   diselesaikan (walau bab ini otomatis masuk expandedChapters).
// - "Geometri Dasar": diagnosticStatus "completed" TAPI punya prasyarat
//   yang belum dikuasai (hasPrerequisite: true, prerequisiteCompleted:
//   false) -> tombol "Lihat Sub Bab" memicu modal peringatan prasyarat,
//   bukan langsung membuka subbab.
vi.mock("../data/topicsData", () => ({
    allChapters: [],
    allGrades: ["Semua Kelas"],
    educationLevels: {
        SD: { name: "Sekolah Dasar", label: "Matematika • SD" },
        SMP: { name: "Sekolah Menengah Pertama", label: "Matematika • SMP" },
        SMA: { name: "Sekolah Menengah Atas", label: "Matematika • SMA" },
    },
    chaptersByLevel: {
        SMP: [
            {
                id: "bab-pecahan",
                name: "Pecahan & Persentase",
                description: "Memahami konsep pecahan dan persentase",
                classRange: "Kelas 7",
                hasPrerequisite: false,
                prerequisiteCompleted: false,
                prerequisiteName: "",
                diagnosticStatus: "not_completed",
                pretestResult: null,
                subtopics: [
                    {
                        id: "sub-1",
                        name: "Pengenalan Pecahan",
                        classReference: "Kelas 7",
                        status: "not_started",
                    },
                    {
                        id: "sub-2",
                        name: "Operasi Pecahan",
                        classReference: "Kelas 7",
                        status: "not_started",
                    },
                ],
            },
            {
                id: "bab-geometri",
                name: "Geometri Dasar",
                description: "Mempelajari bentuk dan bangun ruang dasar",
                classRange: "Kelas 8",
                hasPrerequisite: true,
                prerequisiteCompleted: false,
                prerequisiteName: "Operasi Bilangan Dasar",
                diagnosticStatus: "completed",
                pretestResult: {
                    score: 80,
                    correctCount: 12,
                    wrongCount: 3,
                    duration: "10 Menit",
                    breakdown: [],
                    recommendation: "",
                },
                subtopics: [
                    {
                        id: "sub-3",
                        name: "Bangun Datar",
                        classReference: "Kelas 8",
                        status: "completed",
                    },
                ],
            },
        ],
    },
    gradeFiltersByLevel: {
        SD: ["Semua Kelas", "Kelas 1", "Kelas 2"],
        SMP: ["Semua Kelas", "Kelas 7", "Kelas 8", "Kelas 9"],
        SMA: ["Semua Kelas", "Kelas 10", "Kelas 11", "Kelas 12"],
    },
}));

function renderPage() {
    return render(
        <MemoryRouter>
            <Topics />
        </MemoryRouter>
    );
}

describe("Topics", () => {
    beforeEach(() => {
        vi.stubGlobal("localStorage", createLocalStorageMock());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("merender tanpa crash", () => {
        renderPage();
    });

    it("menampilkan judul kedua bab (SMP, karena belum ada setting di localStorage)", () => {
        renderPage();
        expect(screen.getByText("Pecahan & Persentase")).toBeInTheDocument();
        expect(screen.getByText("Geometri Dasar")).toBeInTheDocument();
    });

    it("subbab belum terlihat di awal: bab pertama belum pretest, bab kedua belum di-expand", () => {
        renderPage();

        // bab-pecahan: sudah otomatis "expanded" tapi belum pretest, jadi
        // subbabnya sengaja belum ditampilkan (menunggu pretest selesai).
        expect(screen.queryByText("Pengenalan Pecahan")).not.toBeInTheDocument();

        // bab-geometri: sudah pretest, tapi belum di-expand -> subbab juga belum terlihat.
        expect(screen.queryByText("Bangun Datar")).not.toBeInTheDocument();
    });

    it("search menyaring bab yang cocok dan otomatis menampilkan subbabnya", () => {
        renderPage();

        fireEvent.change(
            screen.getByPlaceholderText(/search bab atau topik pembelajaran/i),
            { target: { value: "geometri" } }
        );

        // bab-geometri match by nama -> otomatis expanded karena isSearching,
        // dan karena sudah pretest, subbabnya langsung terlihat.
        expect(screen.getByText("Geometri Dasar")).toBeInTheDocument();
        expect(screen.getByText("Bangun Datar")).toBeInTheDocument();
        expect(screen.queryByText("Pecahan & Persentase")).not.toBeInTheDocument();
    });

    it("search tanpa hasil menampilkan pesan kosong dan tombol reset mengembalikan tampilan", () => {
        renderPage();

        fireEvent.change(
            screen.getByPlaceholderText(/search bab atau topik pembelajaran/i),
            { target: { value: "zzz-tidak-ada" } }
        );
        expect(screen.getByText("Tidak ada BAB yang cocok")).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("button", { name: "Reset Filter & Pencarian" })
        );

        expect(screen.getByText("Pecahan & Persentase")).toBeInTheDocument();
        expect(screen.getByText("Geometri Dasar")).toBeInTheDocument();
    });

    it('filter "Kelas 8" lewat dropdown Filters hanya menampilkan bab yang punya subbab di kelas tsb', () => {
        renderPage();

        // Buka dropdown filter kelas
        fireEvent.click(screen.getByRole("button", { name: "Filters" }));
        // Pilih "Kelas 8"
        fireEvent.click(screen.getByRole("button", { name: "Kelas 8" }));

        expect(screen.getByText("Geometri Dasar")).toBeInTheDocument();
        expect(
            screen.queryByText("Pecahan & Persentase")
        ).not.toBeInTheDocument();
    });

    it("membuka bab yang sudah pretest tapi punya prasyarat belum selesai memunculkan modal peringatan, bisa di-bypass", () => {
        renderPage();

        fireEvent.click(screen.getByRole("button", { name: "Lihat Sub Bab" }));

        expect(
            screen.getByText("Materi Prasyarat Belum Selesai")
        ).toBeInTheDocument();
        expect(screen.getByText(/Operasi Bilangan Dasar/)).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("button", { name: "Tetap Lanjutkan" })
        );

        expect(
            screen.queryByText("Materi Prasyarat Belum Selesai")
        ).not.toBeInTheDocument();
        // bab jadi terbuka setelah di-bypass -> subbab-nya sekarang terlihat
        expect(screen.getByText("Bangun Datar")).toBeInTheDocument();
    });

    it('klik "Mulai Pretest" di bab yang belum pretest memunculkan modal konfirmasi, bisa dibatalkan', () => {
        renderPage();

        fireEvent.click(screen.getByRole("button", { name: "Mulai Pretest" }));

        expect(screen.getByText("Mulai Diagnostic Pretest")).toBeInTheDocument();
        expect(screen.getByText("BAB: Pecahan & Persentase")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Batal" }));

        expect(
            screen.queryByText("Mulai Diagnostic Pretest")
        ).not.toBeInTheDocument();
        // dibatalkan -> tetap belum pretest, subbab masih belum terlihat
        expect(screen.queryByText("Pengenalan Pecahan")).not.toBeInTheDocument();
    });

    it('menyelesaikan "Mulai Pretest Sekarang" menampilkan hasil dan membuka subbab bab tsb', () => {
        renderPage();

        fireEvent.click(screen.getByRole("button", { name: "Mulai Pretest" }));
        fireEvent.click(
            screen.getByRole("button", { name: "Mulai Pretest Sekarang" })
        );

        expect(screen.getByText("Hasil Diagnostic Pretest")).toBeInTheDocument();
        expect(screen.getByText("BAB: Pecahan & Persentase")).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("button", { name: "Tutup Ringkasan" })
        );

        expect(
            screen.queryByText("Hasil Diagnostic Pretest")
        ).not.toBeInTheDocument();
        // sekarang sudah pretest & bab ini sudah otomatis expanded dari awal
        expect(screen.getByText("Pengenalan Pecahan")).toBeInTheDocument();
        expect(screen.getByText("Operasi Pecahan")).toBeInTheDocument();
    });
});