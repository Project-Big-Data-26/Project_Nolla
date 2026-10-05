/// <reference types="cypress" />
// Test suite BAB Pembelajaran (UC04: Melihat Halaman BAB) — NOLLA
// Lokasi: frontend/cypress/e2e/bab/bab-pembelajaran.cy.js
// Acuan: SRS F04.1–F04.5 (UC04 Melihat Halaman BAB). Belum ada dokumen TC resmi
// (TC-BAB_NOLLA.xlsx) seperti TC-Login/TC-Profil, jadi ID "CY-BAB-xxx" di sini
// masih sementara/provisional.
//
// Prasyarat:
// - Frontend & backend jalan. AKUN-01 (lihat cypress.env.json) dipakai untuk login.
// - Per 4 Okt 2026, AKUN-01 belum punya BAB dengan pretest selesai (has_pretest:
//   false di semua BAB), jadi skenario "BAB sudah pretest" (sub-bab, lihat hasil
//   pretest) di-mock lewat cy.intercept, bukan data asli. Kalau AKUN-01 nanti
//   sudah pernah pretest di BAB tertentu, test yang pakai data asli (006–008)
//   perlu dicek ulang: mungkin BAB yang tadinya "belum pretest" sudah berubah.
// - Halaman /quiz (pengerjaan pretest/latihan soal) di luar cakupan file ini;
//   test di sini berhenti begitu berhasil diarahkan ke /quiz.

const AKUN01 = {
    email: Cypress.env("AKUN01_EMAIL"),
    password: Cypress.env("AKUN01_PASSWORD"),
};

function loginViaUi(email, password) {
    cy.intercept("POST", "**/api/auth/login").as("login");
    cy.visit("/login");
    cy.get('input[name="email"]').clear().type(email);
    cy.get('input[name="password"]').clear().type(password, { log: false });
    cy.contains("button", /^Masuk$/).click();
    cy.wait("@login").its("response.statusCode").should("be.within", 200, 299);
    cy.location("pathname").should("eq", "/topik");
}

// BAB belum pretest (sesuai data asli AKUN-01 saat ini). Kalau datanya sudah
// berubah, ganti ke nama BAB lain yang masih "Mulai Pretest" di akun ini.
const BAB_BELUM_PRETEST = "Ayo Membilang sampai dengan 10";

// Data BAB tiruan: 1 BAB sudah pretest dengan 3 subbab berstatus beda-beda,
// dipakai untuk menguji tampilan yang tidak bisa diuji dari data asli AKUN-01
// sekarang (karena belum ada BAB yang pretest-nya selesai).
const babMockSudahPretest = {
    id: "mock-bab-001",
    name: "BAB Tiruan Sudah Pretest",
    description: "Dipakai khusus untuk menguji tampilan sub-bab.",
    display_order: 1,
    has_pretest: true,
    progress: 40,
    total_subbab: 3,
    started_subbab: 2,
    completed_subbab: 1,
    subbab: [
        {
            id: "mock-subbab-selesai",
            name: "Subbab Tiruan Selesai",
            description: "Subbab yang sudah selesai dipelajari.",
            display_order: 1,
            started: true,
            completed: true,
            current_cognitive_score: 1650,
            current_cognitive_level: "Hard",
        },
        {
            id: "mock-subbab-proses",
            name: "Subbab Tiruan Sedang Dipelajari",
            description: "Subbab yang sedang dipelajari.",
            display_order: 2,
            started: true,
            completed: false,
            current_cognitive_score: 1100,
            current_cognitive_level: "Medium",
        },
        {
            id: "mock-subbab-belum",
            name: "Subbab Tiruan Belum Dimulai",
            description: "Subbab yang belum pernah disentuh.",
            display_order: 3,
            started: false,
            completed: false,
            current_cognitive_score: 1000,
            current_cognitive_level: "Medium",
        },
    ],
};

function mockBabSudahPretest() {
    cy.intercept("GET", "**/api/dashboard/bab*", {
        statusCode: 200,
        body: {
            statusCode: 200,
            success: true,
            message: "Data BAB berhasil diambil.",
            data: [babMockSudahPretest],
        },
    }).as("ambilBab");
}

describe("BAB Pembelajaran: tampilan & pencarian (data asli AKUN-01)", () => {
    beforeEach(() => {
        cy.viewport(1280, 900);
        cy.clearAllLocalStorage();
        loginViaUi(AKUN01.email, AKUN01.password);
    });

    it("CY-BAB-001 halaman /topik menampilkan daftar BAB (F04.1)", () => {
        cy.location("pathname").should("eq", "/topik");
        cy.contains("Pantau Progresmu, Raih Potensi Terbaikmu.").should("be.visible");
        cy.get('input[placeholder="Search bab atau topik pembelajaran..."]').should("be.visible");
        cy.contains("article h2", BAB_BELUM_PRETEST).should("be.visible");
        cy.contains("article", BAB_BELUM_PRETEST).contains(/^BAB \d+$/).should("be.visible");
    });

    it("CY-BAB-002 pencarian menyaring BAB berdasarkan kata kunci", () => {
        cy.get('input[placeholder="Search bab atau topik pembelajaran..."]').type("Membilang sampai dengan 10");
        cy.contains("article h2", BAB_BELUM_PRETEST).should("be.visible");
        cy.contains("article h2", "Mengenal Bentuk").should("not.exist");
    });

    it("CY-BAB-003 pencarian tanpa hasil menampilkan tombol reset filter & pencarian", () => {
        cy.get('input[placeholder="Search bab atau topik pembelajaran..."]').type("qwzxkosongtidakada123");
        cy.contains("Tidak ada BAB yang cocok").should("be.visible");
        cy.contains("button", "Reset Filter & Pencarian").click();
        cy.get('input[placeholder="Search bab atau topik pembelajaran..."]').should("have.value", "");
        cy.contains("article h2", BAB_BELUM_PRETEST).should("be.visible");
    });

    it("CY-BAB-004 filter berdasarkan kelas menyaring daftar BAB", () => {
        cy.contains("button", "Filters").click();
        cy.contains('[class*="absolute"]', "Filter Berdasarkan Kelas").should("be.visible");
        cy.contains("button", /^Kelas 1(?! \d)/).click(); // "Kelas 1" persis, bukan "Kelas 10/11/12"
        cy.contains("button", /^Filters: Kelas 1$/).should("be.visible");
        cy.get("article h2").should(($h2) => {
            expect($h2.length, "masih ada BAB untuk Kelas 1 setelah difilter").to.be.greaterThan(0);
        });
    });

    it("CY-BAB-005 BAB yang belum pretest menampilkan tombol \"Mulai Pretest\" (F04.3)", () => {
        cy.contains("article", BAB_BELUM_PRETEST).contains("button", "Mulai Pretest").should("be.visible");
        cy.contains("article", BAB_BELUM_PRETEST).contains("button", "Lihat Sub Bab").should("not.exist");
    });

    it("CY-BAB-006 klik \"Mulai Pretest\" membuka modal konfirmasi, lalu diarahkan ke halaman pretest", () => {
        cy.contains("article", BAB_BELUM_PRETEST).contains("button", "Mulai Pretest").click();
        cy.contains("h3", "Mulai Diagnostic Pretest").should("be.visible");
        cy.contains("p", `BAB: ${BAB_BELUM_PRETEST}`).should("be.visible");
        cy.contains("button", "Mulai atau Lanjutkan Pretest").click();
        cy.location("pathname").should("eq", "/quiz");
        cy.location("search").should("contain", "mode=pretest");
    });

    it("CY-BAB-007 modal konfirmasi pretest bisa dibatalkan lewat tombol Batal", () => {
        cy.contains("article", BAB_BELUM_PRETEST).contains("button", "Mulai Pretest").click();
        cy.contains("h3", "Mulai Diagnostic Pretest").should("be.visible");
        cy.contains("button", "Batal").click();
        cy.contains("h3", "Mulai Diagnostic Pretest").should("not.exist");
        cy.location("pathname").should("eq", "/topik"); // tidak jadi pindah halaman
    });

    it("CY-BAB-008 modal konfirmasi pretest bisa ditutup lewat tombol X", () => {
        cy.contains("article", BAB_BELUM_PRETEST).contains("button", "Mulai Pretest").click();
        cy.contains("h3", "Mulai Diagnostic Pretest").should("be.visible");
        // Scope ke kotak modal (class "max-w-md"), bukan "rounded-3xl" saja: kartu BAB
        // (<article>) juga pakai "rounded-3xl", jadi selector itu bisa salah ambil.
        cy.contains("h3", "Mulai Diagnostic Pretest")
            .parents('[class*="max-w-md"]')
            .find("button")
            .first() // tombol X: satu-satunya button sebelum h3 di urutan DOM modal ini
            .click();
        cy.contains("h3", "Mulai Diagnostic Pretest").should("not.exist");
    });
});

describe("BAB Pembelajaran: BAB yang sudah pretest (data tiruan)", () => {
    beforeEach(() => {
        cy.viewport(1280, 900);
        cy.clearAllLocalStorage();
        mockBabSudahPretest();
        loginViaUi(AKUN01.email, AKUN01.password);
        cy.wait("@ambilBab");
    });

    it("CY-BAB-009 BAB yang sudah pretest menampilkan tombol \"Lihat Sub Bab\" (bukan \"Mulai Pretest\")", () => {
        cy.contains("article", babMockSudahPretest.name).contains("button", "Lihat Sub Bab").should("be.visible");
        cy.contains("article", babMockSudahPretest.name).contains("button", "Mulai Pretest").should("not.exist");
    });

    it("CY-BAB-010 \"Lihat Sub Bab\" membuka & menutup daftar subbab, menampilkan status yang sesuai", () => {
        cy.contains("article", babMockSudahPretest.name).contains("button", "Lihat Sub Bab").click();
        cy.contains("Subbab Tiruan Selesai").should("be.visible");
        cy.contains("Subbab Tiruan Sedang Dipelajari").should("be.visible");
        cy.contains("Subbab Tiruan Belum Dimulai").should("be.visible");
        // Badge status tiap subbab sesuai datanya masing-masing
        cy.contains("div", "Subbab Tiruan Selesai").parents("div").first().parent().contains("Selesai");
        cy.contains("div", "Subbab Tiruan Sedang Dipelajari").parents("div").first().parent().contains("Sedang Dipelajari");
        cy.contains("div", "Subbab Tiruan Belum Dimulai").parents("div").first().parent().contains("Belum Dimulai");
        // Tutup lagi
        cy.contains("article", babMockSudahPretest.name).contains("button", "Tutup Sub Bab").click();
        cy.contains("Subbab Tiruan Selesai").should("not.exist");
    });

    it("CY-BAB-011 klik tombol subbab mengarah ke halaman kuis yang sesuai (F04.4)", () => {
        cy.contains("article", babMockSudahPretest.name).contains("button", "Lihat Sub Bab").click();
        cy.contains("div", "Subbab Tiruan Sedang Dipelajari").parents("div").first().parent().contains("button", "Mulai").click();
        cy.location("pathname").should("eq", "/quiz");
        cy.location("search").should("contain", "mode=quiz").and("contain", "mock-subbab-proses");
    });

    // Sebelumnya BUG: tombol "Lihat Hasil Pretest" memanggil setActivePretestResult yang tidak
    // terdefinisi di ChapterCard sehingga melempar ReferenceError. Sudah diperbaiki developer:
    // sekarang tombol memanggil handleViewPretestResult, yang mengambil status pretest lalu
    // hasilnya dari backend. Dua endpoint itu di-stub karena BAB tiruan tidak ada di database.
    function stubHasilPretest() {
        cy.intercept("GET", "**/api/pretest/status/*", {
            statusCode: 200,
            body: {
                statusCode: 200,
                success: true,
                data: { bab_id: babMockSudahPretest.id, has_pretest: true, status: "active", pretest_id: "mock-pretest-001" },
            },
        }).as("statusPretest");
        cy.intercept("GET", "**/api/pretest/mock-pretest-001/result", {
            statusCode: 200,
            body: {
                statusCode: 200,
                success: true,
                data: {
                    score: 70,
                    correct_answers: 7,
                    wrong_answers: 3,
                    duration: 300,
                    submateri_result: [
                        { subbab_name: "Subbab Tiruan Selesai", current_cognitive_level: "Hard", current_cognitive_score: 1650 },
                    ],
                    recommendation: "Lanjutkan ke subbab berikutnya.",
                },
            },
        }).as("hasilPretest");
    }

    it("CY-BAB-012 klik \"Lihat Hasil Pretest\" membuka modal Hasil Diagnostic Pretest", () => {
        stubHasilPretest();
        cy.contains("article", babMockSudahPretest.name).contains("button", "Lihat Sub Bab").click();
        cy.contains("button", "Lihat Hasil Pretest").click();
        cy.wait("@statusPretest");
        cy.wait("@hasilPretest");
        cy.contains("h3", "Hasil Diagnostic Pretest").should("be.visible");
        cy.contains(`BAB: ${babMockSudahPretest.name}`).should("be.visible");
        cy.contains("Skor Pretest").should("be.visible");
        cy.contains("Subbab Tiruan Selesai").should("be.visible");
    });

    it("CY-BAB-013 modal Hasil Diagnostic Pretest bisa ditutup", () => {
        stubHasilPretest();
        cy.contains("article", babMockSudahPretest.name).contains("button", "Lihat Sub Bab").click();
        cy.contains("button", "Lihat Hasil Pretest").click();
        cy.contains("h3", "Hasil Diagnostic Pretest").should("be.visible");
        cy.contains("h3", "Hasil Diagnostic Pretest").closest("div.relative").find("button").first().click();
        cy.contains("h3", "Hasil Diagnostic Pretest").should("not.exist");
    });

    it("CY-BAB-014 hasil pretest gagal dimuat menampilkan pesan dan tidak membuka modal", () => {
        cy.intercept("GET", "**/api/pretest/status/*", {
            statusCode: 500,
            body: { statusCode: 500, success: false, message: "Hasil pretest gagal dimuat." },
        }).as("statusPretest");
        cy.contains("article", babMockSudahPretest.name).contains("button", "Lihat Sub Bab").click();
        cy.contains("button", "Lihat Hasil Pretest").click();
        cy.wait("@statusPretest");
        cy.contains("Hasil pretest gagal dimuat.").should("be.visible");
        cy.contains("h3", "Hasil Diagnostic Pretest").should("not.exist");
    });
});
