import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Topics from "./Topics";

// Beberapa environment Node (fitur --experimental-webstorage di Node 22+)
// punya `localStorage` global bawaan yang bisa "membajak" `window.localStorage`
// (di environment test jsdom, `window` === `globalThis`, jadi keduanya sama
// objeknya). Versi bawaan Node itu kadang tidak lengkap implementasinya (mis.
// tidak punya `.clear()`) kalau tidak dikonfigurasi dengan file path yang
// valid. Daripada bergantung ke localStorage asli yang perilakunya beda-beda
// tiap environment, di-stub manual pakai implementasi in-memory sendiri biar
// hasil test selalu konsisten di komputer manapun.
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

// Topics.jsx bergantung pada data statis dari "../data/topicsData". Supaya
// test ini tidak bergantung pada isi data asli (yang bisa berubah-ubah) dan
// hasilnya bisa diprediksi, modul datanya di-mock dengan fixture terkontrol:
// - "Pecahan & Persentase": belum menyelesaikan pretest bab (diagnosticStatus
//   != "completed"), tanpa prasyarat, 2 subbab. Ini bab PERTAMA sehingga
//   otomatis ter-expand oleh state awal komponen.
// - "Geometri Dasar": pretest bab sudah selesai, TAPI punya prasyarat yang
//   belum dikuasai (hasPrerequisite: true, prerequisiteCompleted: false),
//   1 subbab. Bab ini collapsed di awal.
vi.mock("../data/topicsData", () => ({
    educationLevels: {
        SD: {
            name: "Sekolah Dasar",
            label: "Matematika • SD",
            grades: ["Semua Kelas", "Kelas 1", "Kelas 2"],
        },
        SMP: {
            name: "Sekolah Menengah Pertama",
            label: "Matematika • SMP",
            grades: ["Semua Kelas", "Kelas 7", "Kelas 8", "Kelas 9"],
        },
        SMA: {
            name: "Sekolah Menengah Atas",
            label: "Matematika • SMA",
            grades: ["Semua Kelas", "Kelas 10", "Kelas 11", "Kelas 12"],
        },
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
                postTestStatus: "locked",
                postTestResult: null,
                subtopics: [
                    {
                        id: "sub-1",
                        name: "Pengenalan Pecahan",
                        classReference: "Kelas 7",
                        status: "not_started",
                        progress: 0,
                    },
                    {
                        id: "sub-2",
                        name: "Operasi Pecahan",
                        classReference: "Kelas 7",
                        status: "not_started",
                        progress: 0,
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
                postTestStatus: "available",
                postTestResult: null,
                subtopics: [
                    {
                        id: "sub-3",
                        name: "Bangun Datar",
                        classReference: "Kelas 8",
                        status: "completed",
                        progress: 100,
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

// Cari elemen kartu (div ber-class "rounded-xl") terdekat yang membungkus
// sebuah judul, supaya bisa scoped query (mis. tombol "Ambil Pretest" yang
// teksnya sama persis muncul di beberapa tempat di halaman ini).
function getCardFor(headingText) {
    const heading = screen.getByText(headingText);
    return heading.closest('div[class*="rounded-xl"]');
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

    it("menampilkan judul halaman dan badge jenjang default (SMP, karena belum ada di localStorage)", () => {
        renderPage();
        expect(screen.getByText("Topic Library")).toBeInTheDocument();
        expect(screen.getByText("Matematika • SMP")).toBeInTheDocument();
    });

    it("bab pertama otomatis ter-expand, bab kedua collapsed di awal", () => {
        renderPage();

        // bab-pecahan adalah bab pertama -> otomatis expanded
        expect(screen.getByText("Pengenalan Pecahan")).toBeInTheDocument();

        // bab-geometri collapsed -> subbabnya belum terlihat, tapi judul babnya tetap ada
        expect(screen.getByText("Geometri Dasar")).toBeInTheDocument();
        expect(screen.queryByText("Bangun Datar")).not.toBeInTheDocument();
    });

    it("search menyaring bab/subbab yang cocok dan otomatis expand hasil pencarian", () => {
        renderPage();

        fireEvent.change(
            screen.getByPlaceholderText(/cari nama bab atau subbab/i),
            { target: { value: "geometri" } }
        );

        expect(screen.getByText("Geometri Dasar")).toBeInTheDocument();
        expect(screen.getByText("Bangun Datar")).toBeInTheDocument();
        expect(screen.queryByText("Pecahan & Persentase")).not.toBeInTheDocument();
    });

    it("search tanpa hasil menampilkan pesan kosong dan tombol reset mengembalikan tampilan", () => {
        renderPage();

        fireEvent.change(
            screen.getByPlaceholderText(/cari nama bab atau subbab/i),
            { target: { value: "zzz-tidak-ada" } }
        );
        expect(
            screen.getByText("Tidak ada BAB atau Subbab yang cocok")
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("button", { name: "Reset Filter & Pencarian" })
        );

        expect(screen.getByText("Pecahan & Persentase")).toBeInTheDocument();
        expect(screen.getByText("Geometri Dasar")).toBeInTheDocument();
    });

    it('filter "Kelas 8" hanya menampilkan bab yang punya subbab di kelas tsb', () => {
        renderPage();

        fireEvent.click(screen.getByRole("button", { name: "Kelas 8" }));

        expect(screen.getByText("Geometri Dasar")).toBeInTheDocument();
        expect(
            screen.queryByText("Pecahan & Persentase")
        ).not.toBeInTheDocument();
    });

    it("membuka bab yang punya prasyarat belum selesai memunculkan modal peringatan, bisa di-bypass", () => {
        renderPage();

        fireEvent.click(screen.getByRole("button", { name: "Lihat Subbab" }));

        expect(
            screen.getByText("Materi Prasyarat Belum Dikuasai")
        ).toBeInTheDocument();
        expect(screen.getByText(/Operasi Bilangan Dasar/)).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("button", { name: "Tetap Lanjutkan Belajar" })
        );

        expect(
            screen.queryByText("Materi Prasyarat Belum Dikuasai")
        ).not.toBeInTheDocument();
        // bab jadi terbuka setelah di-bypass
        expect(screen.getByText("Bangun Datar")).toBeInTheDocument();
    });

    it("mengganti jenjang lewat modal pemilih jenjang memperbarui badge di header", () => {
        renderPage();

        fireEvent.click(
            screen.getByTitle("Klik untuk memilih jenjang SD, SMP, atau SMA")
        );
        expect(
            screen.getByText("Pilih Jenjang Pembelajaran")
        ).toBeInTheDocument();

        fireEvent.click(screen.getByText("Sekolah Dasar").closest("button"));

        expect(
            screen.queryByText("Pilih Jenjang Pembelajaran")
        ).not.toBeInTheDocument();
        expect(screen.getByText("Matematika • SD")).toBeInTheDocument();
    });

    it('klik "Ambil Pretest" pada subbab (bab belum pretest) memunculkan modal pretest wajib', () => {
        renderPage();

        const subtopicCard = getCardFor("Pengenalan Pecahan");
        fireEvent.click(
            within(subtopicCard).getByRole("button", { name: /ambil pretest/i })
        );

        expect(
            screen.getByText("Pretest Wajib Diselesaikan")
        ).toBeInTheDocument();
        expect(screen.getByText("BAB: Pecahan & Persentase")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Nanti Saja" }));

        expect(
            screen.queryByText("Pretest Wajib Diselesaikan")
        ).not.toBeInTheDocument();
    });

    it('klik "Ambil Pretest" di level bab memunculkan modal konfirmasi mulai pretest, bisa dibatalkan', () => {
        renderPage();

        const pretestCard = getCardFor("Diagnostic Pretest: Pecahan & Persentase");
        fireEvent.click(
            within(pretestCard).getByRole("button", { name: /ambil pretest/i })
        );

        expect(screen.getByText("Mulai Diagnostic Pretest")).toBeInTheDocument();
        expect(screen.getByText("BAB: Pecahan & Persentase")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Batal" }));

        expect(
            screen.queryByText("Mulai Diagnostic Pretest")
        ).not.toBeInTheDocument();
    });

    // CATATAN: hasil pretest/post test (`TestResultModal`) sengaja tidak ditest
    // isinya di sini karena dirender oleh komponen anak terpisah yang detail
    // tampilannya belum diketahui. Test di atas berhenti tepat sebelum modal
    // hasil terbuka (mis. klik "Batal"/"Nanti Saja"), yang mencakup flow utama
    // tanpa perlu bergantung ke implementasi internal `TestResultModal`.
});