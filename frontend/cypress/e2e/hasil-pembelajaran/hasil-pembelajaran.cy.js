/// <reference types="cypress" />
// Test suite Hasil Pembelajaran (UC05: Melihat Hasil Pembelajaran) — NOLLA
// Lokasi: frontend/cypress/e2e/hasil-pembelajaran/hasil-pembelajaran.cy.js
// Acuan: SRS F05.1–F05.3 (UC05 Melihat Hasil Pembelajaran). Belum ada dokumen TC
// resmi, jadi ID "CY-HASIL-xxx" di sini masih sementara/provisional.
//
// ⚠️ PENTING: Per 4 Okt 2026, halaman ini (TopicDetailPage.jsx) masih 100% data
// dummy/statis (array `dataBab` ditulis langsung di kode) — belum terhubung ke
// backend sama sekali, beda dengan halaman BAB Pembelajaran (/topik) yang sudah
// pakai data asli. Scope file ini SENGAJA dibatasi hanya ke hal yang kemungkinan
// besar tetap sama setelah halaman ini terhubung backend nanti (search, filter
// status, elemen UI), BUKAN ke isi/angka data dummy itu sendiri.
//
// Begitu halaman ini terhubung backend:
// - Ganti test yang bergantung ke BAB_CONTOH & JUMLAH_* (jelas ditandai di bawah)
//   supaya tidak pakai nama/angka dari dataBab, tapi dari data akun uji asli
//   (pola yang sama persis seperti di bab-pembelajaran.cy.js).
// - Sisanya (cek search mengurangi daftar, filter status bekerja, ringkasan
//   muncul, dst) seharusnya tetap valid tanpa perlu ditulis ulang.
//
// Prasyarat: frontend & backend jalan, AKUN-01 (lihat cypress.env.json) dipakai login.

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

// == Hal-hal di bawah ini NEMPEL ke data dummy di TopicDetailPage.jsx. ==
// == Update/hapus begitu halaman ini terhubung backend asli. ==
const BAB_CONTOH = "Pecahan Dasar"; // progress 100%, satu-satunya yang "Selesai"
const BAB_SEDANG_DIPELAJARI = "Operasi Pecahan"; // progress 65%
const JUMLAH_BAB_SELESAI = "1"; // dataBab: cuma 1 BAB dengan progress 100
const JUMLAH_BAB_SEDANG_DIPELAJARI = "3"; // dataBab: 3 BAB dengan progress 0 < x < 100

describe("Hasil Pembelajaran: tampilan umum", () => {
    beforeEach(() => {
        cy.viewport(1280, 900);
        cy.clearAllLocalStorage();
        loginViaUi(AKUN01.email, AKUN01.password);
        cy.visit("/hasil-pembelajaran");
    });

    it("CY-HASIL-001 halaman tidak bisa dibuka tanpa login", () => {
        cy.clearAllLocalStorage();
        cy.visit("/hasil-pembelajaran");
        cy.location("pathname").should("eq", "/login");
    });

    it("CY-HASIL-002 halaman menampilkan judul & ringkasan hasil belajar (F05.1)", () => {
        cy.location("pathname").should("eq", "/hasil-pembelajaran");
        cy.contains("h1", "Hasil Pembelajaran").should("be.visible");
        cy.contains("BAB Selesai Dipelajari").should("be.visible");
        cy.contains("BAB Sedang Dipelajari").should("be.visible");
    });

    it("CY-HASIL-003 setiap kartu BAB menampilkan progres, jumlah subbab, dan kelas (F05.1)", () => {
        cy.contains("article h3", BAB_CONTOH)
            .parents("article")
            .within(() => {
                cy.contains(/^\s*BAB\s*\d+\s*$/i).should("be.visible"); // nomor urut BAB
                cy.contains(/dari \d+ subbab dimulai/).should("be.visible");
                cy.contains(/dari \d+ subbab selesai/).should("be.visible");
                cy.contains(/^\d{1,3}%$/).should("be.visible"); // persentase progres
            });
    });

    it("CY-HASIL-004 pencarian menyaring daftar BAB berdasarkan kata kunci", () => {
        cy.get('input[placeholder="Search bab atau topik pembelajaran..."]').type(BAB_CONTOH);
        cy.contains("article h3", BAB_CONTOH).should("be.visible");
        cy.get("article h3").should("have.length", 1); // cuma 1 BAB cocok dengan kata kunci ini
    });

    it("CY-HASIL-005 pencarian tanpa hasil menampilkan pesan yang sesuai", () => {
        cy.get('input[placeholder="Search bab atau topik pembelajaran..."]').type("qwzxkosongtidakada123");
        cy.contains("Tidak ada bab yang cocok dengan pencarian/filter.").should("be.visible");
        cy.get("article h3").should("not.exist");
    });
});

describe("Hasil Pembelajaran: filter status pembelajaran (F05.2, F05.3)", () => {
    beforeEach(() => {
        cy.viewport(1280, 900);
        cy.clearAllLocalStorage();
        loginViaUi(AKUN01.email, AKUN01.password);
        cy.visit("/hasil-pembelajaran");
    });

    it("CY-HASIL-006 filter menyediakan 3 pilihan: Semua, Selesai, Sedang Dipelajari (F05.3)", () => {
        cy.contains("button", "Filters").click();
        cy.contains("Filter Berdasarkan Progres").should("be.visible");
        ["Semua", "Selesai", "Sedang Dipelajari"].forEach((opsi) => {
            cy.contains('[class*="absolute"] button', opsi).should("be.visible");
        });
    });

    it("CY-HASIL-007 filter \"Selesai\" hanya menampilkan BAB berprogres 100% (F05.2)", () => {
        cy.contains("button", "Filters").click();
        cy.contains('[class*="absolute"] button', /^Selesai$/).click();
        cy.contains("button", /^Filters: Selesai$/).should("be.visible");
        cy.contains("article h3", BAB_CONTOH).should("be.visible");
        cy.contains("article h3", BAB_SEDANG_DIPELAJARI).should("not.exist");
    });

    it("CY-HASIL-008 filter \"Sedang Dipelajari\" hanya menampilkan BAB berprogres 0–100% (F05.2)", () => {
        cy.contains("button", "Filters").click();
        cy.contains('[class*="absolute"] button', "Sedang Dipelajari").click();
        cy.contains("button", /^Filters: Sedang Dipelajari$/).should("be.visible");
        cy.contains("article h3", BAB_SEDANG_DIPELAJARI).should("be.visible");
        cy.contains("article h3", BAB_CONTOH).should("not.exist"); // yang 100% tidak termasuk
    });

    it("CY-HASIL-009 filter bisa dikembalikan ke \"Semua\" lewat \"Kembalikan ke Default\"", () => {
        cy.contains("button", "Filters").click();
        cy.contains('[class*="absolute"] button', /^Selesai$/).click();
        cy.contains("button", "Filters").click();
        cy.contains("Kembalikan ke Default").click();
        cy.contains("button", "Filters").should("be.visible").and("not.contain.text", "Filters:");
        cy.contains("article h3", BAB_SEDANG_DIPELAJARI).should("be.visible"); // BAB lain muncul lagi
    });
});

// == Test di bawah ini juga NEMPEL ke angka dari data dummy (lihat catatan di atas). ==
describe("Hasil Pembelajaran: ringkasan angka (nempel ke data dummy, update saat backend tersambung)", () => {
    it("CY-HASIL-010 ringkasan BAB Selesai & Sedang Dipelajari sesuai jumlah BAB yang berstatus itu", () => {
        cy.viewport(1280, 900);
        cy.clearAllLocalStorage();
        loginViaUi(AKUN01.email, AKUN01.password);
        cy.visit("/hasil-pembelajaran");
        cy.contains("article", "BAB Selesai Dipelajari").contains(JUMLAH_BAB_SELESAI).should("be.visible");
        cy.contains("article", "BAB Sedang Dipelajari").contains(JUMLAH_BAB_SEDANG_DIPELAJARI).should("be.visible");
    });
});
